
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V10_PROD'; 
const CONFIG_KEY = 'TANXING_UPLINK_CONFIG_V10'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'paper-minimal';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';
export type SystemStatus = 'booting' | 'syncing' | 'ready';

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
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'FULL_RESTORE'; payload: any }
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
    isDemoMode: true 
};

// 工具函数：确保导入的对象结构完整，防止 JSON 恢复后系统崩溃
const ensureValidState = (data: any, currentConfig: any): AppState => {
    return {
        ...emptyState,
        ...data,
        supabaseConfig: { ...emptyState.supabaseConfig, ...currentConfig, ...(data.supabaseConfig || {}) },
        isInitialized: true,
        isDemoMode: false, // 只要是数据恢复，就关闭演示模式
        toasts: [],
        exportTasks: []
    };
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
        case 'HYDRATE_STATE': 
            return ensureValidState(action.payload, state.supabaseConfig);
        case 'FULL_RESTORE': 
            SESSION_ID = Math.random().toString(36).substring(7);
            return ensureValidState(action.payload, state.supabaseConfig);
        case 'LOAD_MOCK_DATA':
            return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true };
        case 'SET_SUPABASE_CONFIG': 
            return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
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
    // 1. 同步预载：在 Provider 创建的第一时间获取配置
    const getPrebootConfig = () => {
        try {
            const cfg = localStorage.getItem(CONFIG_KEY);
            return cfg ? JSON.parse(cfg) : null;
        } catch(e) { return null; }
    };

    const preConfig = getPrebootConfig();
    const [state, dispatch] = useReducer(appReducer, {
        ...emptyState,
        supabaseConfig: preConfig || emptyState.supabaseConfig,
        isDemoMode: preConfig ? false : true // 如果有配置，初始即认为是非 Demo 模式
    });

    const [systemStatus, setSystemStatus] = useState<SystemStatus>('booting');
    const lastSyncFingerprintRef = useRef<string>('');
    const isInternalUpdateRef = useRef(false);
    const supabaseRef = useRef<SupabaseClient | null>(null);

    // 2. 增强启动引导程序
    useEffect(() => {
        const bootSequence = async () => {
            console.log("[Boot] Initializing Protocol V10...");
            
            // 尝试读取本地主库
            const savedDb = localStorage.getItem(DB_KEY);
            let localData = null;
            if (savedDb) {
                try { localData = JSON.parse(savedDb); } catch (e) {}
            }

            const config = state.supabaseConfig;

            if (config?.url && config?.key) {
                setSystemStatus('syncing');
                console.log("[Boot] Uplink configured. Syncing with remote terminal...");
                try {
                    const client = createClient(config.url, config.key);
                    const { data, error } = await client.from('app_backups').select('data').order('created_at', { ascending: false }).limit(1);
                    
                    if (!error && data && data.length > 0) {
                        const cloudPayload = data[0].data.payload;
                        console.log("[Boot] Cloud snapshot pulled successfully.");
                        dispatch({ type: 'HYDRATE_STATE', payload: cloudPayload });
                        lastSyncFingerprintRef.current = JSON.stringify(cloudPayload);
                    } else {
                        console.log("[Boot] Cloud empty. Checking local cache...");
                        if (localData && localData.products?.length > 0) dispatch({ type: 'HYDRATE_STATE', payload: localData });
                        else dispatch({ type: 'LOAD_MOCK_DATA' });
                    }
                } catch (e) {
                    console.warn("[Boot] Uplink error. Falling back to local cache.");
                    if (localData) dispatch({ type: 'HYDRATE_STATE', payload: localData });
                    else dispatch({ type: 'LOAD_MOCK_DATA' });
                }
            } else {
                console.log("[Boot] No uplink config. Loading local/mock...");
                if (localData && localData.products?.length > 0) dispatch({ type: 'HYDRATE_STATE', payload: localData });
                else dispatch({ type: 'LOAD_MOCK_DATA' });
            }

            setSystemStatus('ready');
        };
        bootSequence();
    }, []);

    // 3. 实时链路核心 (订阅监听)
    useEffect(() => {
        if (systemStatus !== 'ready' || !state.supabaseConfig?.url || !state.supabaseConfig?.key) return;

        console.log("[Cloud] Opening persistent socket...");
        const client = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        supabaseRef.current = client;

        const channel = client.channel(`v10_sync_main`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_backups' }, (payload) => {
                const incoming = payload.new;
                if (incoming?.data?.source_session !== SESSION_ID) {
                    const payloadData = incoming.data.payload;
                    const fingerprint = JSON.stringify(payloadData);
                    if (fingerprint !== lastSyncFingerprintRef.current) {
                        console.log("[Cloud] External update detected. Mirroring state.");
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
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, systemStatus]);

    // 4. 持久化层 (写入控制)
    useEffect(() => {
        // 重要：在 ready 之前禁止一切持久化，防止初始化时的空状态“反向覆盖”本地有效数据
        if (systemStatus !== 'ready' || !state.isInitialized) return;

        // 保存独立配置 (绝对防刷新关键)
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.supabaseConfig));
        
        // 保存主数据库
        const persistencePayload = { ...state, toasts: [], exportTasks: [] };
        localStorage.setItem(DB_KEY, JSON.stringify(persistencePayload));

        document.body.className = `theme-${state.theme}`;

        // 如果是由于收到云端推送触发的渲染，不需要再次推回云端（防止死循环）
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        // 自动云端同步
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 3000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.transactions, state.theme, state.supabaseConfig, systemStatus, state.isInitialized]);

    const pullFromCloud = async () => {
        if (!state.supabaseConfig?.url) return;
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'syncing' });
        try {
            const client = supabaseRef.current || createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            const { data } = await client.from('app_backups').select('data').order('created_at', { ascending: false }).limit(1);
            if (data && data.length > 0) {
                const cloudPayload = data[0].data.payload;
                lastSyncFingerprintRef.current = JSON.stringify(cloudPayload);
                isInternalUpdateRef.current = true;
                dispatch({ type: 'HYDRATE_STATE', payload: cloudPayload });
                showToast('已从云端恢复最新镜像', 'success');
            }
        } catch (e) { dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); }
    };

    const syncToCloud = async (isForce: boolean = false) => {
        if (systemStatus !== 'ready' || !state.supabaseConfig?.url || (!isForce && state.isDemoMode)) return;

        const payloadToSync = {
            products: state.products, orders: state.orders, tasks: state.tasks, customers: state.customers,
            shipments: state.shipments, suppliers: state.suppliers, transactions: state.transactions,
            adCampaigns: state.adCampaigns, influencers: state.influencers, inboundShipments: state.inboundShipments,
            supabaseConfig: state.supabaseConfig, theme: state.theme
        };

        const fingerprint = JSON.stringify(payloadToSync);
        if (!isForce && fingerprint === lastSyncFingerprintRef.current) return; 

        try {
            const client = supabaseRef.current || createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            await client.from('app_backups').insert([{ 
                data: { source_session: SESSION_ID, payload: payloadToSync, timestamp: new Date().toISOString() } 
            }]);
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
        } catch (e) { 
            console.error("[Cloud] Sync failure:", e);
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
