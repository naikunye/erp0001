import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V9_FIREBASE'; 
const CONFIG_KEY = 'TANXING_FIREBASE_CONFIG'; 
const CHUNK_SIZE = 500000; // 降低至 500KB，确保含中文字符的大文件也不会突破 Firestore 限制
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
    const isInternalUpdateRef = useRef(false);

    const sanitizeId = (id: string) => id?.replace(/https?:\/\//g, '').split('.')[0].trim();

    const bootFirebase = async (config: FirebaseConfig) => {
        const cleanId = sanitizeId(config.projectId);
        if (!config.apiKey || !cleanId) return;

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const apps = getApps();
            for (const app of apps) {
                await deleteApp(app).catch(() => {});
            }

            const app = initializeApp({ ...config, projectId: cleanId });
            getFirestore(app); // 仅初始化
            
            // 延迟 1 秒确认连接（Firestore 初始化是同步的，但我们需要给用户一点反馈感）
            setTimeout(() => {
                dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
                dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { projectId: cleanId } });
            }, 500);
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

    // 自动保存逻辑
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.firebaseConfig));
        const slimState = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus };
        try { localStorage.setItem(DB_KEY, JSON.stringify(slimState)); } catch(e) {}
        
        if (!isInternalUpdateRef.current && state.connectionStatus === 'connected' && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 10000); // 延长自动同步周期至 10秒
            return () => clearTimeout(timer);
        }
        isInternalUpdateRef.current = false;
    }, [state.products, state.orders, state.transactions, state.shipments, state.connectionStatus]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (state.connectionStatus === 'disconnected' && !isForce) return false;
        
        try {
            const db = getFirestore(getApp());
            const fullPayload = {
                products: state.products,
                orders: state.orders,
                transactions: state.transactions,
                customers: state.customers,
                shipments: state.shipments,
                tasks: state.tasks,
                suppliers: state.suppliers,
                influencers: state.influencers,
                inboundShipments: state.inboundShipments,
                auditLogs: state.auditLogs.slice(0, 50),
                session: SESSION_ID,
                timestamp: new Date().toISOString()
            };

            const dataStr = JSON.stringify(fullPayload);
            const chunks: string[] = [];
            
            for (let i = 0; i < dataStr.length; i += CHUNK_SIZE) {
                chunks.push(dataStr.substring(i, i + CHUNK_SIZE));
            }

            const batch = writeBatch(db);
            
            // 写入清单
            batch.set(doc(db, 'quantum_backup', 'manifest'), {
                chunkCount: chunks.length,
                totalSize: dataStr.length,
                timestamp: fullPayload.timestamp,
                session: SESSION_ID
            });

            // 写入每个切片
            chunks.forEach((content, index) => {
                const chunkRef = doc(db, 'quantum_backup', `chunk_${index}`);
                batch.set(chunkRef, { content, index });
            });

            await batch.commit();
            dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            return true;

        } catch (e: any) {
            console.error("[Quantum Sync Failed]", e);
            // 如果是因为权限问题，抛出具体错误供 UI 捕获
            if (e.code === 'permission-denied') {
                showToast('Firestore 权限拒绝：请在控制台开启 Rules', 'error');
            }
            return false;
        }
    };

    const pullFromCloud = async () => {
        try {
            const db = getFirestore(getApp());
            const manifestSnap = await getDoc(doc(db, 'quantum_backup', 'manifest'));
            
            if (manifestSnap.exists()) {
                const { chunkCount, session } = manifestSnap.data();
                if (session === SESSION_ID) return;

                const chunkPromises = [];
                for (let i = 0; i < chunkCount; i++) {
                    chunkPromises.push(getDoc(doc(db, 'quantum_backup', `chunk_${i}`)));
                }

                const results = await Promise.all(chunkPromises);
                const fullStr = results.map(snap => snap.data()?.content || '').join('');

                const data = JSON.parse(fullStr);
                if (data) {
                    isInternalUpdateRef.current = true;
                    dispatch({ type: 'HYDRATE_STATE', payload: data });
                    showToast('量子镜像同步完成', 'success');
                }
            }
        } catch (e) {
            console.error("[Quantum Pull Failed]", e);
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
