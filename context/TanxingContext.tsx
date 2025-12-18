
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

// 采用更稳定的数据库键名，防止版本冲突
const DB_KEY = 'TANXING_DB_STABLE_PROD_V7'; 
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
    isInitialized: boolean; // 用于控制 UI 加载遮罩
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
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders], isDemoMode: false };
        case 'HYDRATE_STATE': return { ...state, ...action.payload, isInitialized: true };
        case 'FULL_RESTORE': 
            SESSION_ID = Math.random().toString(36).substring(7); // 恢复数据后重置会话，强制下一次同步能被识别
            return { ...state, ...action.payload, isInitialized: true, isDemoMode: false };
        case 'LOAD_MOCK_DATA':
            return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true };
        case 'SET_SUPABASE_CONFIG': return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'SET_INITIALIZED': return { ...state, isInitialized: action.payload };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': 
            localStorage.removeItem(DB_KEY);
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
    const [isHydrated, setIsHydrated] = useState(false); // 关键锁：防止覆盖写入
    const lastSyncFingerprintRef = useRef<string>('');
    const isInternalUpdateRef = useRef(false);
    const supabaseRef = useRef<SupabaseClient | null>(null);

    // 1. 初始化启动序列
    useEffect(() => {
        const initializeApp = async () => {
            console.log("[System] Booting Terminal...");
            const saved = localStorage.getItem(DB_KEY);
            let localData = null;
            
            if (saved) {
                try {
                    localData = JSON.parse(saved);
                } catch (e) { console.error("[System] Cache corrupt"); }
            }

            const config = localData?.supabaseConfig || state.supabaseConfig;

            // 云优先策略
            if (config?.url && config?.key) {
                try {
                    const tempSupabase = createClient(config.url, config.key);
                    const { data, error } = await tempSupabase.from('app_backups').select('data').order('created_at', { ascending: false }).limit(1);
                    
                    if (!error && data && data.length > 0) {
                        const cloudPayload = data[0].data.payload;
                        console.log("[System] Cloud snapshot recovered");
                        dispatch({ type: 'HYDRATE_STATE', payload: { ...cloudPayload, supabaseConfig: config } });
                        lastSyncFingerprintRef.current = JSON.stringify(cloudPayload);
                    } else if (localData) {
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

            // 完成初始化，释放写入锁
            setIsHydrated(true);
        };
        initializeApp();
    }, []);

    // 2. Supabase 实时监听
    useEffect(() => {
        if (!isHydrated || !state.supabaseConfig?.url || !state.supabaseConfig?.key || !state.supabaseConfig?.isRealTime) return;

        console.log("[Cloud] Connecting to real-time matrix...");
        const client = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        supabaseRef.current = client;

        const channel = client.channel(`live_sync_v7`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_backups' }, (payload) => {
                const incoming = payload.new;
                // 排除自己发出的消息，防止死循环
                if (incoming?.data?.source_session !== SESSION_ID) {
                    const payloadData = incoming.data.payload;
                    const fingerprint = JSON.stringify(payloadData);
                    if (fingerprint !== lastSyncFingerprintRef.current) {
                        console.log("[Cloud] External broadcast detected, syncing...");
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

    // 3. 稳健持久化逻辑：只有 isHydrated 为 true 时才允许保存
    useEffect(() => {
        if (!isHydrated) return;

        // 保存到本地
        try {
            const persistencePayload = { ...state, toasts: [], exportTasks: [] };
            localStorage.setItem(DB_KEY, JSON.stringify(persistencePayload));
        } catch (e) {}

        document.body.className = `theme-${state.theme}`;

        // 如果是内部更新引发的 state 改变，不触发自动上行同步
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }

        // 自动云同步防抖：延时 3 秒，确保用户停止操作后再同步
        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime && !state.isDemoMode) {
            const timer = setTimeout(() => syncToCloud(), 3000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.transactions, state.theme, isHydrated]);

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
            }
        } catch (e) { dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); }
    };

    const syncToCloud = async (isForce: boolean = false) => {
        if (!isHydrated || !state.supabaseConfig?.url || (!isForce && state.isDemoMode)) return;

        const payloadToSync = {
            products: state.products, orders: state.orders, tasks: state.tasks, customers: state.customers,
            shipments: state.shipments, suppliers: state.suppliers, transactions: state.transactions,
            adCampaigns: state.adCampaigns, influencers: state.influencers, inboundShipments: state.inboundShipments,
            supabaseConfig: state.supabaseConfig // 也要同步配置，以便新设备拉取
        };

        const fingerprint = JSON.stringify(payloadToSync);
        if (!isForce && fingerprint === lastSyncFingerprintRef.current) return; 

        try {
            const client = supabaseRef.current || createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            const { error } = await client.from('app_backups').insert([{ 
                data: { source_session: SESSION_ID, payload: payloadToSync, timestamp: new Date().toISOString() } 
            }]);
            
            if (error) throw error;
            
            lastSyncFingerprintRef.current = fingerprint;
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
        } catch (e) { 
            console.error("[Cloud] Sync Failed", e);
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
