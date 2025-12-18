
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V4_FINAL';
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'paper-minimal';
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
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'CREATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'SET_SUPABASE_CONFIG'; payload: Partial<AppState['supabaseConfig']> }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'FULL_RESTORE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'SET_INITIALIZED'; payload: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
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
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products] };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
        case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks] };
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] };
        case 'UPDATE_ORDER_STATUS': return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) };
        case 'DELETE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers] };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments] };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload) };
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers] };
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [action.payload, ...state.adCampaigns] };
        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers] };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments] };
        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true };
        case 'FULL_RESTORE': 
            SESSION_ID = Math.random().toString(36).substring(7);
            return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'LOAD_MOCK_DATA':
            return {
                ...state,
                products: MOCK_PRODUCTS,
                transactions: MOCK_TRANSACTIONS,
                customers: MOCK_CUSTOMERS,
                orders: MOCK_ORDERS,
                shipments: MOCK_SHIPMENTS,
                suppliers: MOCK_SUPPLIERS,
                adCampaigns: MOCK_AD_CAMPAIGNS,
                influencers: MOCK_INFLUENCERS,
                inboundShipments: MOCK_INBOUND_SHIPMENTS,
                isDemoMode: true,
                isInitialized: true
            };
        case 'SET_SUPABASE_CONFIG': return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'SET_INITIALIZED': return { ...state, isInitialized: action.payload };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'RESET_DATA': 
            localStorage.removeItem(DB_KEY);
            return emptyState;
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
    // 1. 初始化 Reducer
    const [state, dispatch] = useReducer(appReducer, emptyState);

    const isInternalUpdate = useRef(false);
    const lastSyncDataRef = useRef<string>('');

    // 2. 启动逻辑：先读本地，有云连云，无云看是否加载 Mock
    useEffect(() => {
        const boot = async () => {
            const saved = localStorage.getItem(DB_KEY);
            let localState = null;
            if (saved) {
                try {
                    localState = JSON.parse(saved);
                    dispatch({ type: 'HYDRATE_STATE', payload: { ...localState, isInitialized: false } });
                } catch (e) { console.error("Local storage corrupt"); }
            }

            const currentConfig = localState?.supabaseConfig || state.supabaseConfig;
            
            if (currentConfig?.url && currentConfig?.key) {
                // 如果有云配置，启动必须拉取云端覆盖本地
                await pullFromCloud(currentConfig);
            } else {
                // 如果本地也为空且没云端，自动注入模拟数据（仅内存，不写代码）
                if (!localState || (localState.products.length === 0)) {
                    dispatch({ type: 'LOAD_MOCK_DATA' });
                } else {
                    dispatch({ type: 'SET_INITIALIZED', payload: true });
                }
            }
        };
        boot();
    }, []);

    // 3. Supabase 实时监听
    useEffect(() => {
        const config = state.supabaseConfig;
        if (!config?.url || !config?.key || !config?.isRealTime || !state.isInitialized) return;

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const supabase = createClient(config.url, config.key);
            const channel = supabase.channel('tanxing_realtime_v4')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_backups' }, (payload) => {
                    const incoming = payload.new;
                    if (incoming && incoming.data && incoming.data.source_session !== SESSION_ID) {
                        const incomingPayload = incoming.data.payload;
                        const payloadString = JSON.stringify(incomingPayload);
                        if (payloadString !== lastSyncDataRef.current) {
                            isInternalUpdate.current = true;
                            lastSyncDataRef.current = payloadString;
                            dispatch({ type: 'HYDRATE_STATE', payload: incomingPayload });
                        }
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
                    else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
                });

            return () => { supabase.removeChannel(channel); };
        } catch (e) { dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); }
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, state.isInitialized]);

    // 4. 数据持久化与自动同步执行
    useEffect(() => {
        if (!state.isInitialized) return;

        // 写入本地存储 (Guard: 防止空状态覆盖)
        try {
            const payload = { ...state, toasts: [], exportTasks: [] };
            localStorage.setItem(DB_KEY, JSON.stringify(payload));
        } catch (e) {}
        
        document.body.className = `theme-${state.theme}`;

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // 自动上云 (非演示模式)
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 5000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.transactions, state.isInitialized]);

    const pullFromCloud = async (configOverride?: any) => {
        const config = configOverride || state.supabaseConfig;
        if (!config?.url || !config?.key) return;
        
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'syncing' });
        try {
            const supabase = createClient(config.url, config.key);
            const { data, error } = await supabase
                .from('app_backups')
                .select('data')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            if (data && data.length > 0) {
                const cloudPayload = data[0].data.payload;
                lastSyncDataRef.current = JSON.stringify(cloudPayload);
                isInternalUpdate.current = true;
                dispatch({ type: 'HYDRATE_STATE', payload: cloudPayload });
            } else {
                dispatch({ type: 'SET_INITIALIZED', payload: true });
            }
        } catch (e) {
            dispatch({ type: 'SET_INITIALIZED', payload: true });
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        }
    };

    const syncToCloud = async (isForce: boolean = false) => {
        if (!state.isInitialized || !state.supabaseConfig?.url || !state.supabaseConfig?.key) return;
        if (state.isDemoMode && !isForce) return; // 演示模式禁同步

        const payloadToSync = {
            products: state.products,
            orders: state.orders,
            tasks: state.tasks,
            customers: state.customers,
            shipments: state.shipments,
            suppliers: state.suppliers,
            transactions: state.transactions,
            adCampaigns: state.adCampaigns,
            influencers: state.influencers,
            inboundShipments: state.inboundShipments,
            supabaseConfig: state.supabaseConfig // 保持配置同步
        };

        const payloadString = JSON.stringify(payloadToSync);
        if (!isForce && payloadString === lastSyncDataRef.current) return; 

        try {
            const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            await supabase.from('app_backups').insert([{
                data: {
                    source_session: SESSION_ID,
                    payload: payloadToSync,
                    timestamp: new Date().toISOString()
                }
            }]);
            lastSyncDataRef.current = payloadString;
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
        } catch (e) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
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
