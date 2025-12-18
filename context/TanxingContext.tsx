
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V4';
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
    isDemoMode: boolean; // 新增：标记当前是否为模拟演示数据
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
    | { type: 'LOAD_MOCK_DATA' } // 新增：明确加载模拟数据动作
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'SET_INITIALIZED'; payload: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' };

// --- 核心修复：空初始状态 ---
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
        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers], isDemoMode: false };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c), isDemoMode: false };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload), isDemoMode: false };
        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments], isDemoMode: false };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s), isDemoMode: false };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload), isDemoMode: false };
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers], isDemoMode: false };
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [action.payload, ...state.adCampaigns], isDemoMode: false };
        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers], isDemoMode: false };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s), isDemoMode: false };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload), isDemoMode: false };
        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments], isDemoMode: false };
        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'FULL_RESTORE': 
            SESSION_ID = Math.random().toString(36).substring(7);
            return { ...state, ...action.payload, isInitialized: true, isDemoMode: false, connectionStatus: 'disconnected' };
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
        case 'RESET_DATA': return emptyState;
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
    const [state, dispatch] = useReducer(appReducer, emptyState, (initial) => {
        try {
            const saved = localStorage.getItem(DB_KEY);
            if (!saved) return initial;
            const parsed = JSON.parse(saved);
            // 启动时禁用初始化标志，直到拉取完成
            return { ...initial, ...parsed, isInitialized: false, connectionStatus: 'disconnected' };
        } catch { return initial; }
    });

    const isInternalUpdate = useRef(false);
    const lastSyncDataRef = useRef<string>('');

    // --- 严密的启动引导流 ---
    useEffect(() => {
        const init = async () => {
            // 1. 检查是否有云端配置
            if (state.supabaseConfig?.url && state.supabaseConfig?.key) {
                console.log("[Boot] Detected cloud config, pulling latest snapshot...");
                await pullFromCloud();
            } else {
                // 2. 无云端配置，且无本地数据，维持空状态并标记初始化完成
                console.log("[Boot] No cloud config, boot completed with local cache.");
                dispatch({ type: 'SET_INITIALIZED', payload: true });
            }
        };
        init();
    }, []);

    // --- 实时订阅逻辑 (仅处理远程变更) ---
    useEffect(() => {
        const config = state.supabaseConfig;
        if (!config?.url || !config?.key || !config?.isRealTime) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
            return;
        }

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
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, state.supabaseConfig?.isRealTime]);

    // --- 持久化保护层 ---
    useEffect(() => {
        // 关键：未初始化前，禁止一切本地存储和同步，防止模拟数据写回
        if (!state.isInitialized) return;

        try {
            localStorage.setItem(DB_KEY, JSON.stringify({ ...state, toasts: [], exportTasks: [] }));
        } catch (e) {}
        
        document.body.className = `theme-${state.theme}`;

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // 仅在连接正常且非演示模式时触发同步
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 5000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.theme, state.connectionStatus, state.isInitialized]);

    const pullFromCloud = async () => {
        if (!state.supabaseConfig?.url || !state.supabaseConfig?.key) return;
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'syncing' });
        
        try {
            const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
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
                console.log("[Sync] Pulled from cloud successfully.");
            } else {
                console.log("[Sync] Cloud is empty.");
                dispatch({ type: 'SET_INITIALIZED', payload: true });
            }
        } catch (e) {
            console.error("[Sync] Pull failed:", e);
            dispatch({ type: 'SET_INITIALIZED', payload: true });
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        }
    };

    const syncToCloud = async (isForce: boolean = false) => {
        // 演示模式下禁止自动上传，防止污染真实云端数据
        if (!state.isInitialized || !state.supabaseConfig?.url || !state.supabaseConfig?.key || (state.isDemoMode && !isForce)) return;
        
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
            const { error } = await supabase.from('app_backups').insert([{
                data: {
                    source_session: SESSION_ID,
                    payload: payloadToSync,
                    timestamp: new Date().toISOString()
                }
            }]);
            
            if (error) throw error;
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
