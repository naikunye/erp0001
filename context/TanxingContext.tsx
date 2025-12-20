import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import AV from 'leancloud-storage';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V11_LEAN'; 
const CONFIG_KEY = 'TANXING_LEAN_CONFIG'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'midnight-dark';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';

interface LeanConfig {
    appId: string;
    appKey: string;
    serverURL: string;
    lastSync: string | null;
}

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    leanConfig: LeanConfig;
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
    hasSyncedOnce: boolean; // 新增：标记是否至少与云端进行过一次有效交互
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
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_LEAN_CONFIG'; payload: Partial<LeanConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' }
    | { type: 'MARK_SYNCED' };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null },
    connectionStatus: 'disconnected', products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], calendarEvents: [], suppliers: [], adCampaigns: [], influencers: [], inboundShipments: [], toasts: [], auditLogs: [], exportTasks: [], isMobileMenuOpen: false, isInitialized: false, isDemoMode: false, hasSyncedOnce: false
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
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, isInitialized: true };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true };
        case 'MARK_SYNCED': return { ...state, hasSyncedOnce: true, isDemoMode: false };
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (isForce?: boolean) => Promise<boolean>;
    pullFromCloud: (silent?: boolean) => Promise<void>;
    bootLean: (appId: string, appKey: string, serverURL: string) => Promise<void>;
}>({ state: emptyState, dispatch: () => null, showToast: () => null, syncToCloud: async () => false, pullFromCloud: async () => {}, bootLean: async () => {} });

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const [isHydrated, setIsHydrated] = useState(false);
    const isInternalUpdateRef = useRef(false);

    const bootLean = async (appId: string, appKey: string, serverURL: string) => {
        if (!appId || !appKey) return;
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        try {
            const cleanUrl = serverURL?.trim().replace(/\/$/, "");
            AV.init({ appId, appKey, serverURL: cleanUrl });
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        } catch (e: any) {
            console.error("LeanCloud Init Failed", e);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
            throw e;
        }
    };

    // 核心修复：更严格的初始化流程
    useEffect(() => {
        const init = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);
            
            // 1. 先加载本地缓存
            if (savedDb) {
                const localData = JSON.parse(savedDb);
                dispatch({ type: 'HYDRATE_STATE', payload: { ...localData, connectionStatus: 'disconnected' } });
            } else {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }

            // 2. 如果有云端配置，执行连接并【强制拉取一次】
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                try {
                    await bootLean(config.appId, config.appKey, config.serverURL);
                    // 关键：连接成功后立刻尝试拉取云端数据，覆盖本地可能的旧缓存或Mock
                    await pullFromCloud(true);
                } catch (e) {
                    console.warn("Auto-pull failed during init", e);
                }
            }
            
            setIsHydrated(true);
        };
        init();
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        
        // 保存配置到本地
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        
        // 保存数据到本地缓存
        const slimState = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus };
        try { localStorage.setItem(DB_KEY, JSON.stringify(slimState)); } catch(e) {}
        
        // 自动同步逻辑：增加 hasSyncedOnce 校验，防止 Mock 数据意外上传
        if (!isInternalUpdateRef.current && 
            state.connectionStatus === 'connected' && 
            !state.isDemoMode && 
            state.hasSyncedOnce) {
            const timer = setTimeout(() => syncToCloud(), 15000);
            return () => clearTimeout(timer);
        }
        isInternalUpdateRef.current = false;
    }, [state.products, state.orders, state.transactions, state.shipments, state.connectionStatus, state.hasSyncedOnce]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (state.connectionStatus !== 'connected' && !isForce) return false;
        if (!state.leanConfig.serverURL) {
            showToast('同步被拦截: 未配置服务器地址 URL', 'error');
            return false;
        }
        
        try {
            const fullPayload = {
                products: state.products, orders: state.orders, transactions: state.transactions,
                customers: state.customers, shipments: state.shipments, tasks: state.tasks,
                suppliers: state.suppliers, influencers: state.influencers,
                inboundShipments: state.inboundShipments,
                session: SESSION_ID, timestamp: new Date().toISOString()
            };

            const Backup = AV.Object.extend('Backup');
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            
            let backupObj = null;
            try {
                backupObj = await query.first();
            } catch (queryErr: any) {
                const isNotFound = queryErr.code === 101 || queryErr.message?.includes("doesn't exist");
                if (!isNotFound) throw queryErr;
            }
            
            if (!backupObj) {
                backupObj = new Backup();
                backupObj.set('uniqueId', 'GLOBAL_BACKUP_NODE');
            }

            backupObj.set('payload', JSON.stringify(fullPayload));
            backupObj.set('lastSyncTime', new Date().toISOString());
            backupObj.set('session', SESSION_ID);

            await backupObj.save();
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            dispatch({ type: 'MARK_SYNCED' }); // 标记同步成功，开启后续自动同步
            return true;
        } catch (e: any) {
            console.error("[LeanCloud Sync Failed]", e);
            showToast(`同步异常: ${e.message}`, 'error');
            return false;
        }
    };

    const pullFromCloud = async (silent: boolean = false) => {
        if (!state.leanConfig.serverURL) {
            if (!silent) showToast('请先配置服务器地址', 'warning');
            return;
        }
        try {
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            
            let backupObj = null;
            try {
                backupObj = await query.first();
            } catch (queryErr: any) {
                const isNotFound = queryErr.code === 101 || queryErr.message?.includes("doesn't exist");
                if (!isNotFound) throw queryErr;
            }
            
            if (backupObj) {
                const payloadStr = backupObj.get('payload');
                const session = backupObj.get('session');
                
                // 如果不是静默拉取（即用户手动拉取），且 session 一致，询问
                if (!silent && session === SESSION_ID) {
                    if (!confirm('检测到云端数据由当前会话产生，确定要重新覆盖本地吗？')) return;
                }

                const parsed = JSON.parse(payloadStr);
                isInternalUpdateRef.current = true;
                dispatch({ type: 'HYDRATE_STATE', payload: parsed });
                dispatch({ type: 'MARK_SYNCED' }); // 关键：拉取成功也视为激活同步链路
                if (!silent) showToast('全量云端镜像同步完成', 'success');
            } else {
                if (!silent) showToast('云端尚无备份记录', 'info');
            }
        } catch (e: any) {
            console.error("[LeanCloud Pull Failed]", e);
            if (!silent) showToast(`拉取失败: ${e.message}`, 'error');
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
