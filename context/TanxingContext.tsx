import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, enableNetwork, terminate } from 'firebase/firestore';
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

    const bootFirebase = async (config: FirebaseConfig) => {
        if (!config.apiKey || !config.projectId) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
            return;
        }
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const apps = getApps();
            for (const app of apps) {
                try { const db = getFirestore(app); await terminate(db); } catch(e) {}
                await deleteApp(app).catch(() => {});
            }
            const app = initializeApp(config);
            const db = getFirestore(app);
            await enableNetwork(db);
            const docRef = doc(db, 'backups', 'quantum_state');

            // 握手测试
            await setDoc(docRef, { 
                handshake: { ts: new Date().toISOString(), session: SESSION_ID, type: 'heartbeat' } 
            }, { merge: true });

            // 拉取快照 (仅在没有本地数据或强制同步时)
            const snapshot = await getDoc(docRef);
            if (snapshot.exists() && snapshot.data().payload) {
                const cloudData = snapshot.data().payload;
                // 如果本地没有产品数据，才用云端覆盖，防止导入后的本地数据在刷新时被旧云端覆盖
                if (state.products.length === 0) {
                    lastSyncFingerprintRef.current = JSON.stringify(cloudData);
                    dispatch({ type: 'HYDRATE_STATE', payload: cloudData });
                }
            }

            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
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

    useEffect(() => {
        if (!isHydrated || state.connectionStatus !== 'connected') return;
        let db;
        try { db = getFirestore(getApp()); } catch(e) { return; }
        const docRef = doc(db, 'backups', 'quantum_state');
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const incoming = snapshot.data();
                if (incoming.source_session && incoming.source_session !== SESSION_ID && !snapshot.metadata.hasPendingWrites) {
                    const fingerprint = JSON.stringify(incoming.payload);
                    if (fingerprint && fingerprint !== lastSyncFingerprintRef.current) {
                        isInternalUpdateRef.current = true;
                        lastSyncFingerprintRef.current = fingerprint;
                        dispatch({ type: 'HYDRATE_STATE', payload: incoming.payload });
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [state.connectionStatus, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.firebaseConfig));
        const slimState = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus };
        try { localStorage.setItem(DB_KEY, JSON.stringify(slimState)); } catch(e) {}
        document.body.className = `theme-${state.theme}`;
        if (!isInternalUpdateRef.current && state.connectionStatus === 'connected' && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 3000);
            return () => clearTimeout(timer);
        }
        isInternalUpdateRef.current = false;
    }, [state.products, state.orders, state.transactions, state.shipments, state.theme, state.connectionStatus]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (state.connectionStatus !== 'connected' && !isForce) return false;
        
        // 限制审计日志长度，防止超过 Firestore 1MB 文档限制
        const safeAuditLogs = state.auditLogs.slice(0, 100);
        const safeTransactions = state.transactions.slice(0, 500);

        const payload = {
            products: state.products, orders: state.orders, tasks: state.tasks,
            customers: state.customers, shipments: state.shipments, suppliers: state.suppliers,
            transactions: safeTransactions, adCampaigns: state.adCampaigns, influencers: state.influencers,
            inboundShipments: state.inboundShipments, auditLogs: safeAuditLogs
        };

        const fingerprint = JSON.stringify(payload);
        if (!isForce && fingerprint === lastSyncFingerprintRef.current) return true;

        try {
            const db = getFirestore(getApp());
            await setDoc(doc(db, 'backups', 'quantum_state'), {
                source_session: SESSION_ID,
                payload: payload,
                timestamp: new Date().toISOString()
            }, { merge: true });
            
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            return true;
        } catch (e: any) {
            console.error("[Sync Error]", e);
            if (e.message.includes('too large')) {
                dispatch({ type: 'ADD_TOAST', payload: { message: '同步失败：数据量过大 (超出 Firestore 1MB 限制)，请清理审计日志。', type: 'error' } });
            }
            return false;
        }
    };

    const pullFromCloud = async () => {
        if (state.connectionStatus !== 'connected') {
            dispatch({ type: 'ADD_TOAST', payload: { message: '请先启动连接', type: 'warning' } });
            return;
        }
        try {
            const db = getFirestore(getApp());
            const snapshot = await getDoc(doc(db, 'backups', 'quantum_state'));
            if (snapshot.exists()) {
                const cloudData = snapshot.data().payload;
                dispatch({ type: 'HYDRATE_STATE', payload: cloudData });
                dispatch({ type: 'ADD_TOAST', payload: { message: '已从云端拉取最新数据', type: 'success' } });
            }
        } catch (e) {
            dispatch({ type: 'ADD_TOAST', payload: { message: '拉取失败', type: 'error' } });
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