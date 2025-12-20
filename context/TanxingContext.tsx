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
    syncAllowed: boolean; 
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
    | { type: 'ALLOW_SYNC' }
    | { type: 'INITIALIZED_SUCCESS' };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null },
    connectionStatus: 'disconnected', products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], calendarEvents: [], suppliers: [], adCampaigns: [], influencers: [], inboundShipments: [], toasts: [], auditLogs: [], exportTasks: [], isMobileMenuOpen: false, isInitialized: false, isDemoMode: false, syncAllowed: false
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p), isDemoMode: false, syncAllowed: true };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products], isDemoMode: false, syncAllowed: true };
        case 'HYDRATE_STATE': 
            return { ...state, ...action.payload, isDemoMode: false };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'ALLOW_SYNC': return { ...state, syncAllowed: true };
        case 'INITIALIZED_SUCCESS': return { ...state, isInitialized: true };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true };
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (isForce?: boolean) => Promise<boolean>;
    pullFromCloud: (isSilent?: boolean) => Promise<boolean>;
    bootLean: (appId: string, appKey: string, serverURL: string) => Promise<void>;
}>({ state: emptyState, dispatch: () => null, showToast: () => null, syncToCloud: async () => false, pullFromCloud: async () => false, bootLean: async () => {} });

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const [isInternalUpdate, setIsInternalUpdate] = useState(false);
    const hasAttemptedPullRef = useRef(false);

    const bootLean = async (appId: string, appKey: string, serverURL: string) => {
        if (!appId || !appKey || !serverURL) return;
        const cleanUrl = serverURL.trim().replace(/\/$/, "");
        AV.init({ appId, appKey, serverURL: cleanUrl });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    };

    // 核心修复：阻塞式加载流程
    useEffect(() => {
        const startup = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);

            // 第一步：恢复本地 UI 配置
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                
                try {
                    // 第二步：尝试建立云端物理连接
                    await bootLean(config.appId, config.appKey, config.serverURL);
                    
                    // 第三步：强制拉取。成功拉取后，hasAttemptedPullRef 确保我们不再加载 Mock
                    const pullSuccess = await pullFromCloud(true);
                    if (pullSuccess) {
                        hasAttemptedPullRef.current = true;
                    }
                } catch (e) {
                    console.error("Cloud boot error", e);
                }
            }

            // 第四步：如果云端没拉到数据，才降级加载本地缓存
            if (!hasAttemptedPullRef.current) {
                if (savedDb) {
                    dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
                } else {
                    dispatch({ type: 'LOAD_MOCK_DATA' });
                }
            }

            // 第五步：释放 UI 锁定，进入系统
            dispatch({ type: 'INITIALIZED_SUCCESS' });
        };
        startup();
    }, []);

    // 后台自动同步逻辑：必须解锁后才运行
    useEffect(() => {
        if (!state.isInitialized) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        
        if (!isInternalUpdate) {
            const slim = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus, isInitialized: false };
            try { localStorage.setItem(DB_KEY, JSON.stringify(slim)); } catch(e) {}
        }

        if (state.connectionStatus === 'connected' && state.syncAllowed && !isInternalUpdate) {
            const timer = setTimeout(() => syncToCloud(), 15000);
            return () => clearTimeout(timer);
        }
        setIsInternalUpdate(false);
    }, [state.products, state.orders, state.transactions, state.syncAllowed, state.isInitialized]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (!state.syncAllowed && !isForce) return false;
        if (state.connectionStatus !== 'connected') return false;

        try {
            const payload = {
                products: state.products, orders: state.orders, transactions: state.transactions,
                customers: state.customers, shipments: state.shipments, tasks: state.tasks,
                suppliers: state.suppliers, influencers: state.influencers,
                inboundShipments: state.inboundShipments,
                timestamp: new Date().toISOString(), session: SESSION_ID
            };

            const Backup = AV.Object.extend('Backup');
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            let backupObj = null;
            try {
                backupObj = await query.first();
            } catch (err: any) {
                if (err.code !== 101 && !err.message?.includes("doesn't exist")) throw err;
            }

            if (!backupObj) {
                backupObj = new Backup();
                backupObj.set('uniqueId', 'GLOBAL_BACKUP_NODE');
            }

            backupObj.set('payload', JSON.stringify(payload));
            backupObj.set('lastSyncTime', new Date().toISOString());
            backupObj.set('session', SESSION_ID);

            await backupObj.save();
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
            dispatch({ type: 'ALLOW_SYNC' });
            return true;
        } catch (e: any) {
            console.error("[Tanxing Sync Error]", e);
            showToast(`同步失败: ${e.message}`, 'error');
            return false;
        }
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => {
        try {
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            let backupObj = null;
            try {
                backupObj = await query.first();
            } catch (err: any) {
                if (err.code !== 101 && !err.message?.includes("doesn't exist")) throw err;
            }

            if (backupObj) {
                const rawPayload = backupObj.get('payload');
                if (!rawPayload) return false;
                const data = JSON.parse(rawPayload);
                setIsInternalUpdate(true);
                dispatch({ type: 'HYDRATE_STATE', payload: { ...data, syncAllowed: true } });
                if (!isSilent) showToast('已成功同步云端镜像', 'success');
                return true;
            } else {
                if (!isSilent) showToast('云端尚无备份', 'info');
                return false;
            }
        } catch (e: any) {
            if (!isSilent) showToast(`拉取异常: ${e.message}`, 'error');
            return false;
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
