import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V8_STABLE'; 
const CONFIG_KEY = 'TANXING_UPLINK_CONFIG'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'midnight-dark';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    supabaseConfig: { url: string; key: string; lastSync: string | null; isRealTime: boolean };
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
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'ADD_AUDIT_LOG'; payload: Omit<AuditLog, 'id'> }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'FULL_RESTORE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_SUPABASE_CONFIG'; payload: Partial<AppState['supabaseConfig']> }
    | { type: 'SET_INITIALIZED'; payload: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'RESET_DATA' };

const emptyState: AppState = {
    theme: 'ios-glass',
    activePage: 'dashboard',
    navParams: {},
    supabaseConfig: { url: '', key: '', lastSync: null, isRealTime: true },
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
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t), isDemoMode: false };
        case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload), isDemoMode: false };
        
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders], isDemoMode: false };
        case 'UPDATE_ORDER_STATUS': return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o), isDemoMode: false };
        case 'DELETE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload), isDemoMode: false };

        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments], isDemoMode: false };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s), isDemoMode: false };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload), isDemoMode: false };

        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers], isDemoMode: false };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c), isDemoMode: false };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload), isDemoMode: false };

        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers], isDemoMode: false };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s), isDemoMode: false };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload), isDemoMode: false };

        case 'ADD_AUDIT_LOG': return { ...state, auditLogs: [{ ...action.payload, id: `LOG-${Date.now()}` }, ...state.auditLogs] };
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers], isDemoMode: false };
        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments], isDemoMode: false };

        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'FULL_RESTORE': 
            SESSION_ID = Math.random().toString(36).substring(7);
            return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'LOAD_MOCK_DATA':
            return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true };
        case 'SET_SUPABASE_CONFIG': return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'SET_INITIALIZED': return { ...state, isInitialized: action.payload };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': 
            localStorage.removeItem(DB_KEY);
            localStorage.removeItem(CONFIG_KEY);
            return { ...emptyState, isInitialized: true };
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
    const supabaseRef = useRef<SupabaseClient | null>(null);

    // 系统冷启动初始化
    useEffect(() => {
        const initializeSystem = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            let config = state.supabaseConfig;
            if (savedConfig) {
                try {
                    config = JSON.parse(savedConfig);
                    dispatch({ type: 'SET_SUPABASE_CONFIG', payload: config });
                } catch (e) { console.error("[Boot] Config corrupted"); }
            }

            const savedDb = localStorage.getItem(DB_KEY);
            let localData = null;
            if (savedDb) {
                try { localData = JSON.parse(savedDb); } catch (e) {}
            }

            if (config?.url && config?.key) {
                try {
                    const client = createClient(config.url, config.key);
                    supabaseRef.current = client;
                    const { data, error } = await client.from('app_backups').select('data').order('created_at', { ascending: false }).limit(1);
                    
                    if (!error && data && data.length > 0) {
                        const cloudPayload = data[0].data.payload;
                        dispatch({ type: 'HYDRATE_STATE', payload: { ...cloudPayload, supabaseConfig: config } });
                        lastSyncFingerprintRef.current = JSON.stringify(cloudPayload);
                    } else if (localData && localData.products?.length > 0) {
                        dispatch({ type: 'HYDRATE_STATE', payload: localData });
                    } else {
                        dispatch({ type: 'LOAD_MOCK_DATA' });
                    }
                } catch (e) {
                    if (localData) dispatch({ type: 'HYDRATE_STATE', payload: localData });
                    else dispatch({ type: 'LOAD_MOCK_DATA' });
                }
            } else if (localData && localData.products?.length > 0) {
                dispatch({ type: 'HYDRATE_STATE', payload: localData });
            } else {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }

            setIsHydrated(true);
        };
        initializeSystem();
    }, []);

    // 建立实时监听通道
    useEffect(() => {
        if (!isHydrated || !state.supabaseConfig?.url || !state.supabaseConfig?.key || !state.supabaseConfig?.isRealTime) return;
        const client = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        supabaseRef.current = client;

        const channel = client.channel(`matrix_sync_stable`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_backups' }, (payload) => {
                const incoming = payload.new;
                if (incoming?.data?.source_session !== SESSION_ID) {
                    const payloadData = incoming.data.payload;
                    const fingerprint = JSON.stringify(payloadData);
                    if (fingerprint !== lastSyncFingerprintRef.current) {
                        isInternalUpdateRef.current = true;
                        lastSyncFingerprintRef.current = fingerprint;
                        dispatch({ type: 'HYDRATE_STATE', payload: payloadData });
                    }
                }
            })
            .subscribe((status) => {
                dispatch({ type: 'SET_CONNECTION_STATUS', payload: status === 'SUBSCRIBED' ? 'connected' : 'error' });
            });

        return () => { channel.unsubscribe(); };
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, isHydrated]);

    // 状态变动自动触发持久化与同步
    useEffect(() => {
        if (!isHydrated) return;
        try {
            const persistencePayload = { ...state, toasts: [], exportTasks: [] };
            localStorage.setItem(DB_KEY, JSON.stringify(persistencePayload));
            localStorage.setItem(CONFIG_KEY, JSON.stringify(state.supabaseConfig));
        } catch (e) {}

        document.body.className = `theme-${state.theme}`;

        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        // 仅在已连接且非演示模式下触发自动同步
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 1200); // 增加防抖时长，减少写入频率
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.transactions, state.shipments, state.customers, state.suppliers, state.theme, isHydrated, state.supabaseConfig]);

    const pullFromCloud = async () => {
        if (!state.supabaseConfig?.url) return;
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'syncing' });
        try {
            const client = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            const { data, error } = await client.from('app_backups').select('data').order('created_at', { ascending: false }).limit(1);
            if (error) throw error;
            if (data && data.length > 0) {
                const cloudPayload = data[0].data.payload;
                lastSyncFingerprintRef.current = JSON.stringify(cloudPayload);
                isInternalUpdateRef.current = true;
                dispatch({ type: 'HYDRATE_STATE', payload: cloudPayload });
            }
        } catch (e: any) { 
            showToast(`同步失败: ${e.message}`, 'error');
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); 
        }
    };

    const syncToCloud = async (isForce: boolean = false) => {
        if (!isHydrated || !state.supabaseConfig?.url || (!isForce && state.isDemoMode)) return;

        const payloadToSync = {
            products: state.products, orders: state.orders, tasks: state.tasks, customers: state.customers,
            shipments: state.shipments, suppliers: state.suppliers, transactions: state.transactions,
            adCampaigns: state.adCampaigns, influencers: state.influencers, inboundShipments: state.inboundShipments,
            auditLogs: state.auditLogs,
            supabaseConfig: state.supabaseConfig 
        };

        const fingerprint = JSON.stringify(payloadToSync);
        if (!isForce && fingerprint === lastSyncFingerprintRef.current) return; 

        try {
            // 确保使用最新的凭证创建客户端
            const client = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            const { error } = await client.from('app_backups').insert([{ 
                data: { source_session: SESSION_ID, payload: payloadToSync, timestamp: new Date().toISOString() } 
            }]);
            
            if (error) throw error;
            
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
        } catch (e: any) { 
            console.error("[Matrix Sync Error]", e);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); 
            // 只有手动触发(isForce)时才弹窗报错，静默失败不打扰用户
            if (isForce) showToast(`云端保存失败: ${e.message || '未知错误'}`, 'error');
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