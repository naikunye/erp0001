import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, enableNetwork, terminate, writeBatch } from 'firebase/firestore';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V9_FIREBASE'; 
const CONFIG_KEY = 'TANXING_FIREBASE_CONFIG'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'midnight-dark';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    lastSync: string | null;
}

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    firebaseConfig: FirebaseConfig;
    connectionStatus: ConnectionStatus;
    products: Product[];
    transactions: Transaction[];
    customers: Customer[];
    orders: Order[];
    shipments: Shipment[];
    tasks: Task[];
    calendarEvents: CalendarEvent[];
    suppliers: Supplier[];
    adCampaigns: AdCampaign[];
    influencers: Influencer[];
    inboundShipments: InboundShipment[];
    toasts: Toast[];
    auditLogs: AuditLog[];
    exportTasks: ExportTask[];
    isMobileMenuOpen: boolean;
    isInitialized: boolean; 
    isDemoMode: boolean;
}

type Action =
    | { type: 'SET_THEME'; payload: AppState['theme'] }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: { searchQuery?: string } } }
    | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_FIREBASE_CONFIG'; payload: Partial<FirebaseConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    firebaseConfig: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', lastSync: null },
    connectionStatus: 'disconnected', products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], calendarEvents: [], suppliers: [], adCampaigns: [], influencers: [], inboundShipments: [], toasts: [], auditLogs: [], exportTasks: [], isMobileMenuOpen: false, isInitialized: false, isDemoMode: false
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p), isDemoMode: false };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products], isDemoMode: false };
        case 'HYDRATE_STATE': 
            const { connectionStatus, ...rest } = action.payload;
            return { ...state, ...rest, isInitialized: true, isDemoMode: false };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true, connectionStatus: 'disconnected' };
        case 'SET_FIREBASE_CONFIG': return { ...state, firebaseConfig: { ...state.firebaseConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true };
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (isForce?: boolean) => Promise<boolean>;
    pullFromCloud: () => Promise<void>;
    bootFirebase: (config: FirebaseConfig) => Promise<void>;
}>({ state: emptyState, dispatch: () => null, showToast: () => null, syncToCloud: async () => false, pullFromCloud: async () => {}, bootFirebase: async () => {} });

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const [isHydrated, setIsHydrated] = useState(false);
    const lastSyncFingerprintRef = useRef<string>('');
    const isInternalUpdateRef = useRef(false);

    const sanitizeId = (id: string) => id?.replace(/https?:\/\//g, '').split('.')[0].trim();

    const bootFirebase = async (config: FirebaseConfig) => {
        const cleanId = sanitizeId(config.projectId);
        if (!config.apiKey || !cleanId) return;

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const apps = getApps();
            for (const app of apps) {
                try { const db = getFirestore(app); await terminate(db); } catch(e) {}
                await deleteApp(app).catch(() => {});
            }

            const app = initializeApp({ ...config, projectId: cleanId });
            const db = getFirestore(app);
            await enableNetwork(db);
            
            // 握手测试
            const docRef = doc(db, 'backups', 'manifest');
            await setDoc(docRef, { handshake: SESSION_ID, last_active: new Date().toISOString() }, { merge: true });

            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
            dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { projectId: cleanId } });
        } catch (e: any) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
            throw e;
        }
    };

    useEffect(() => {
        const init = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);
            if (savedDb) {
                const localData = JSON.parse(savedDb);
                dispatch({ type: 'HYDRATE_STATE', payload: { ...localData, connectionStatus: 'disconnected' } });
            }
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                dispatch({ type: 'SET_FIREBASE_CONFIG', payload: config });
                await bootFirebase(config).catch(() => {});
            } else if (!savedDb) {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }
            setIsHydrated(true);
        };
        init();
    }, []);

    // 实时同步：监听 Manifest
    useEffect(() => {
        if (!isHydrated || state.connectionStatus !== 'connected') return;
        const db = getFirestore(getApp());
        const unsub = onSnapshot(doc(db, 'backups', 'manifest'), async (snap) => {
            if (snap.exists()) {
                const meta = snap.data();
                if (meta.source_session !== SESSION_ID && meta.fingerprint !== lastSyncFingerprintRef.current) {
                    // 如果 Manifest 变了，全量拉取一次
                    await pullFromCloud();
                }
            }
        });
        return unsub;
    }, [state.connectionStatus, isHydrated]);

    // 自动保存逻辑
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.firebaseConfig));
        const slimState = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus };
        try { localStorage.setItem(DB_KEY, JSON.stringify(slimState)); } catch(e) {}
        
        if (!isInternalUpdateRef.current && state.connectionStatus === 'connected' && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 5000);
            return () => clearTimeout(timer);
        }
        isInternalUpdateRef.current = false;
    }, [state.products, state.orders, state.transactions, state.shipments, state.connectionStatus]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (state.connectionStatus !== 'connected' && !isForce) return false;
        
        try {
            const db = getFirestore(getApp());
            const batch = writeBatch(db);
            const ts = new Date().toISOString();

            // 1. 裁剪冗余数据：仅保留最近 20 条日志和 100 条流水，减少体积
            const cleanAuditLogs = state.auditLogs.slice(0, 20);
            const cleanTransactions = state.transactions.slice(0, 100);

            // 2. 节点化数据块
            const nodes = {
                products: { products: state.products, suppliers: state.suppliers },
                orders: { orders: state.orders, customers: state.customers, inboundShipments: state.inboundShipments },
                finance: { transactions: cleanTransactions, adCampaigns: state.adCampaigns },
                misc: { shipments: state.shipments, tasks: state.tasks, auditLogs: cleanAuditLogs, influencers: state.influencers }
            };

            const fingerprint = JSON.stringify(nodes);
            if (!isForce && fingerprint === lastSyncFingerprintRef.current) return true;

            // 3. 执行分段写入
            Object.entries(nodes).forEach(([key, payload]) => {
                const nodeRef = doc(db, 'backups', `node_${key}`);
                batch.set(nodeRef, { payload, timestamp: ts });
            });

            // 4. 更新清单
            batch.set(doc(db, 'backups', 'manifest'), {
                fingerprint,
                source_session: SESSION_ID,
                lastSync: ts
            });

            await batch.commit();
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            return true;

        } catch (e: any) {
            console.error("[Sync Failed]", e);
            if (e.message.includes('too large')) {
                dispatch({ type: 'ADD_TOAST', payload: { message: '数据过大 (5MB+)，部分图片或日志同步已被截断。', type: 'warning' } });
            }
            return false;
        }
    };

    const pullFromCloud = async () => {
        if (state.connectionStatus !== 'connected') return;
        try {
            const db = getFirestore(getApp());
            const nodes = ['products', 'orders', 'finance', 'misc'];
            let combinedPayload: any = {};

            const results = await Promise.all(nodes.map(n => getDoc(doc(db, 'backups', `node_${n}`))));
            
            results.forEach(snap => {
                if (snap.exists()) {
                    combinedPayload = { ...combinedPayload, ...snap.data().payload };
                }
            });

            if (Object.keys(combinedPayload).length > 0) {
                isInternalUpdateRef.current = true;
                lastSyncFingerprintRef.current = JSON.stringify(combinedPayload);
                dispatch({ type: 'HYDRATE_STATE', payload: combinedPayload });
            }
        } catch (e) {
            console.error("[Pull Failed]", e);
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, bootFirebase }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);