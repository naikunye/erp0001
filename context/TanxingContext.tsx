import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
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
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string, status: Order['status'] } }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_AUDIT_LOG'; payload: Omit<AuditLog, 'id'> }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_FIREBASE_CONFIG'; payload: Partial<FirebaseConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' };

const emptyState: AppState = {
    theme: 'ios-glass',
    activePage: 'dashboard',
    navParams: {},
    firebaseConfig: { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', lastSync: null },
    connectionStatus: 'disconnected',
    products: [],
    transactions: [],
    customers: [],
    orders: [],
    shipments: [],
    tasks: [],
    calendarEvents: [],
    suppliers: [],
    adCampaigns: [],
    influencers: [],
    inboundShipments: [],
    toasts: [],
    auditLogs: [],
    exportTasks: [],
    isMobileMenuOpen: false,
    isInitialized: false,
    isDemoMode: false
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
        case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload), isDemoMode: false };
        case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks], isDemoMode: false };
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders], isDemoMode: false };
        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments], isDemoMode: false };
        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true };
        case 'SET_FIREBASE_CONFIG': return { ...state, firebaseConfig: { ...state.firebaseConfig, ...action.payload } };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true };
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (isForce?: boolean) => Promise<void>;
    pullFromCloud: () => Promise<void>;
}>({ state: emptyState, dispatch: () => null, showToast: () => null, syncToCloud: async () => {}, pullFromCloud: async () => {} });

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const [isHydrated, setIsHydrated] = useState(false);
    const lastSyncFingerprintRef = useRef<string>('');
    const isInternalUpdateRef = useRef(false);

    // 初始化载入
    useEffect(() => {
        const boot = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);
            let config: FirebaseConfig | null = null;
            
            if (savedConfig) {
                try {
                    config = JSON.parse(savedConfig);
                    dispatch({ type: 'SET_FIREBASE_CONFIG', payload: config! });
                } catch (e) {}
            }

            if (config?.apiKey && config?.projectId) {
                try {
                    const app = !getApps().length ? initializeApp(config) : getApp();
                    const db = getFirestore(app);
                    const docRef = doc(db, 'backups', 'quantum_state');
                    const snapshot = await getDoc(docRef);
                    
                    if (snapshot.exists()) {
                        const cloudData = snapshot.data().payload;
                        dispatch({ type: 'HYDRATE_STATE', payload: { ...cloudData, firebaseConfig: config } });
                        lastSyncFingerprintRef.current = JSON.stringify(cloudData);
                    } else if (savedDb) {
                        dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
                    } else {
                        dispatch({ type: 'LOAD_MOCK_DATA' });
                    }
                } catch (e) {
                    if (savedDb) dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
                    else dispatch({ type: 'LOAD_MOCK_DATA' });
                }
            } else if (savedDb) {
                dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
            } else {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }
            setIsHydrated(true);
        };
        boot();
    }, []);

    // 建立实时监听 (当 Config 改变时自动重启)
    useEffect(() => {
        if (!isHydrated || !state.firebaseConfig?.apiKey || !state.firebaseConfig?.projectId) return;
        
        let unsubscribe: (() => void) | null = null;

        try {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
            
            const app = !getApps().length ? initializeApp(state.firebaseConfig) : getApp();
            const db = getFirestore(app);
            const docRef = doc(db, 'backups', 'quantum_state');
            
            unsubscribe = onSnapshot(docRef, (snapshot) => {
                // 成功握手
                dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
                
                if (snapshot.exists()) {
                    const incoming = snapshot.data();
                    if (incoming.source_session !== SESSION_ID) {
                        const fingerprint = JSON.stringify(incoming.payload);
                        if (fingerprint !== lastSyncFingerprintRef.current) {
                            isInternalUpdateRef.current = true;
                            lastSyncFingerprintRef.current = fingerprint;
                            dispatch({ type: 'HYDRATE_STATE', payload: incoming.payload });
                        }
                    }
                }
            }, (error) => {
                console.error("[Firebase] Realtime listener error:", error);
                dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
            });
        } catch (e) {
            console.error("[Firebase] App initialization error:", e);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [state.firebaseConfig.apiKey, state.firebaseConfig.projectId, isHydrated]);

    // 自动本地持久化
    useEffect(() => {
        if (!isHydrated) return;
        
        try {
            const slimState = { 
                ...state, 
                toasts: [], 
                auditLogs: state.auditLogs.slice(0, 10),
                exportTasks: [] 
            };
            localStorage.setItem(DB_KEY, JSON.stringify(slimState));
            localStorage.setItem(CONFIG_KEY, JSON.stringify(state.firebaseConfig));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                try { localStorage.setItem(CONFIG_KEY, JSON.stringify(state.firebaseConfig)); } catch(e2) {}
            }
        }

        document.body.className = `theme-${state.theme}`;

        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        // 自动同步：仅在已连接且非 Demo 模式下触发
        if (state.connectionStatus === 'connected' && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 5000); 
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.transactions, state.shipments, state.theme, isHydrated, state.connectionStatus, state.firebaseConfig]);

    const syncToCloud = async (isForce: boolean = false) => {
        if (!isHydrated || !state.firebaseConfig?.apiKey || (!isForce && state.isDemoMode)) return;

        const payload = {
            products: state.products, orders: state.orders, tasks: state.tasks,
            customers: state.customers, shipments: state.shipments, suppliers: state.suppliers,
            transactions: state.transactions, adCampaigns: state.adCampaigns, influencers: state.influencers,
            inboundShipments: state.inboundShipments, auditLogs: state.auditLogs
        };

        const fingerprint = JSON.stringify(payload);
        if (!isForce && fingerprint === lastSyncFingerprintRef.current) return;

        try {
            const db = getFirestore(getApp());
            await setDoc(doc(db, 'backups', 'quantum_state'), {
                source_session: SESSION_ID,
                payload: payload,
                timestamp: new Date().toISOString()
            }, { merge: true });
            
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_FIREBASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            if (isForce) showToast('云端数据节点已同步', 'success');
        } catch (e: any) {
            console.error("[Firebase] Sync error:", e);
            if (isForce) showToast(`同步失败: ${e.message}`, 'error');
            throw e;
        }
    };

    const pullFromCloud = async () => {
        if (!state.firebaseConfig?.apiKey) return;
        try {
            const db = getFirestore(getApp());
            const snapshot = await getDoc(doc(db, 'backups', 'quantum_state'));
            if (snapshot.exists()) {
                const cloudData = snapshot.data().payload;
                dispatch({ type: 'HYDRATE_STATE', payload: cloudData });
                showToast('已从云端恢复数据镜像', 'success');
            } else {
                showToast('云端尚无备份文件', 'warning');
            }
        } catch (e: any) {
            showToast('数据拉取失败', 'error');
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);