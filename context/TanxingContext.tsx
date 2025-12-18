
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_FINAL_V5';
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
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p), isDemoMode: false };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products], isDemoMode: false };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload), isDemoMode: false };
        case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks], isDemoMode: false };
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t), isDemoMode: false };
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders], isDemoMode: false };
        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true };
        case 'FULL_RESTORE': return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
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
        case 'SET_INITIALIZED': return { ...state, isInitialized: action.payload };
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
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const lastSyncDataRef = useRef<string>('');
    const isInternalUpdate = useRef(false);

    // 1. 核心生命周期：阻止任何写入，直到确认加载完毕
    useEffect(() => {
        const init = async () => {
            const saved = localStorage.getItem(DB_KEY);
            let initialState = null;
            if (saved) {
                try {
                    initialState = JSON.parse(saved);
                } catch (e) { console.error("Cache Corrupt"); }
            }

            // 如果有本地云配置，优先拉取
            if (initialState?.supabaseConfig?.url && initialState?.supabaseConfig?.key) {
                await pullFromCloud(initialState.supabaseConfig);
            } else if (initialState && initialState.products.length > 0) {
                // 如果没有云但有本地数据，恢复本地
                dispatch({ type: 'HYDRATE_STATE', payload: initialState });
            } else {
                // 全空环境，加载模拟数据
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }
        };
        init();
    }, []);

    // 2. Supabase 实时监听修复
    useEffect(() => {
        const config = state.supabaseConfig;
        if (!config?.url || !config?.key || !config?.isRealTime || !state.isInitialized) return;

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const supabase = createClient(config.url, config.key);
            const channel = supabase.channel('tanxing_realtime_v5')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_backups' }, (payload) => {
                    const incoming = payload.new;
                    if (incoming?.data?.source_session !== SESSION_ID) {
                        const payloadData = incoming.data.payload;
                        if (JSON.stringify(payloadData) !== lastSyncDataRef.current) {
                            isInternalUpdate.current = true;
                            lastSyncDataRef.current = JSON.stringify(payloadData);
                            dispatch({ type: 'HYDRATE_STATE', payload: payloadData });
                        }
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
                    else if (status === 'CHANNEL_ERROR') dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
                });

            return () => { supabase.removeChannel(channel); };
        } catch (e) { dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); }
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, state.isInitialized]);

    // 3. 持久化副作用 (只有初始化后才生效)
    useEffect(() => {
        if (!state.isInitialized) return;

        // 写入本地存储 (Guard: 防止覆盖)
        try {
            const payload = { ...state, toasts: [], exportTasks: [] };
            localStorage.setItem(DB_KEY, JSON.stringify(payload));
        } catch (e) {}

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // 演示模式或空配置不触发自动同步
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 3000);
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
                dispatch({ type: 'HYDRATE_STATE', payload: { ...cloudPayload, supabaseConfig: config } });
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
        if (state.isDemoMode && !isForce) return;

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
            inboundShipments: state.inboundShipments
        };

        const payloadString = JSON.stringify(payloadToSync);
        if (!isForce && payloadString === lastSyncDataRef.current) return; 

        try {
            const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            await supabase.from('app_backups').insert([{
                data: { source_session: SESSION_ID, payload: payloadToSync, timestamp: new Date().toISOString() }
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
