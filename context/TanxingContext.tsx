import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import AV from 'leancloud-storage';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V12_LEAN'; 
const CONFIG_KEY = 'TANXING_LEAN_CONFIG'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'midnight-dark';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'syncing';
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface LeanConfig {
    appId: string;
    appKey: string;
    serverURL: string;
    lastSync: string | null;
    payloadSize?: number;
    cloudObjectId?: string; // 缓存对象ID
}

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    leanConfig: LeanConfig;
    connectionStatus: ConnectionStatus;
    saveStatus: SaveStatus; // 实时保存状态
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
    | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_LEAN_CONFIG'; payload: Partial<LeanConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' }
    | { type: 'INITIALIZED_SUCCESS' };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null },
    connectionStatus: 'disconnected', saveStatus: 'idle', products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], calendarEvents: [], suppliers: [], adCampaigns: [], influencers: [], inboundShipments: [], toasts: [], auditLogs: [], exportTasks: [], isMobileMenuOpen: false, isInitialized: false, isDemoMode: false, syncAllowed: false
};

const appReducer = (state: AppState, action: Action): AppState => {
    const markDirty = (newState: Partial<AppState>): AppState => ({ 
        ...state, 
        ...newState, 
        syncAllowed: true, 
        saveStatus: 'dirty',
        isDemoMode: false 
    });

    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'SET_SAVE_STATUS': return { ...state, saveStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        
        case 'UPDATE_PRODUCT': return markDirty({ products: state.products.map(p => p.id === action.payload.id ? action.payload : p) });
        case 'ADD_PRODUCT': return markDirty({ products: [action.payload, ...state.products] });
        case 'DELETE_PRODUCT': return markDirty({ products: state.products.filter(p => p.id !== action.payload) });

        case 'UPDATE_SHIPMENT': return markDirty({ shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SHIPMENT': return markDirty({ shipments: [action.payload, ...state.shipments] });
        case 'DELETE_SHIPMENT': return markDirty({ shipments: state.shipments.filter(s => s.id !== action.payload) });

        case 'UPDATE_ORDER_STATUS': return markDirty({ orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) });
        case 'ADD_ORDER': return markDirty({ orders: [action.payload, ...state.orders] });
        case 'DELETE_ORDER': return markDirty({ orders: state.orders.filter(o => o.id !== action.payload) });

        case 'UPDATE_CUSTOMER': return markDirty({ customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) });
        case 'ADD_CUSTOMER': return markDirty({ customers: [action.payload, ...state.customers] });
        case 'DELETE_CUSTOMER': return markDirty({ customers: state.customers.filter(c => c.id !== action.payload) });

        case 'UPDATE_SUPPLIER': return markDirty({ suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SUPPLIER': return markDirty({ suppliers: [action.payload, ...state.suppliers] });
        case 'DELETE_SUPPLIER': return markDirty({ suppliers: state.suppliers.filter(s => s.id !== action.payload) });

        case 'UPDATE_TASK': return markDirty({ tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) });
        case 'ADD_TASK': return markDirty({ tasks: [action.payload, ...state.tasks] });
        case 'DELETE_TASK': return markDirty({ tasks: state.tasks.filter(t => t.id !== action.payload) });

        case 'HYDRATE_STATE': return { ...state, ...action.payload, isDemoMode: false };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, syncAllowed: false, saveStatus: 'idle' };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
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
    const isSyncingRef = useRef(false);
    // Fix: Using ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser environment compatibility
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const bootLean = async (appId: string, appKey: string, serverURL: string) => {
        if (!appId || !appKey || !serverURL) return;
        try {
            AV.init({ appId, appKey, serverURL: serverURL.trim().replace(/\/$/, "") });
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        } catch (e: any) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
            throw e;
        }
    };

    useEffect(() => {
        const startup = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                try {
                    await bootLean(config.appId, config.appKey, config.serverURL);
                    await pullFromCloud(true);
                } catch (e) {}
            } else if (savedDb) {
                dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
            } else {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }
            dispatch({ type: 'INITIALIZED_SUCCESS' });
        };
        startup();
    }, []);

    // 自动持久化与智能同步
    useEffect(() => {
        if (!state.isInitialized) return;
        
        // 本地快照持久化
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        if (!isInternalUpdate) {
            const slim = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus, isInitialized: false, syncAllowed: false };
            try { localStorage.setItem(DB_KEY, JSON.stringify(slim)); } catch(e) {}
        }

        // 智能同步逻辑：仅在数据脏且连接正常时触发
        if (state.connectionStatus === 'connected' && state.syncAllowed && !isSyncingRef.current) {
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
            // 缩短反馈时间至 5 秒
            syncTimerRef.current = setTimeout(() => syncToCloud(), 5000);
        }
        setIsInternalUpdate(false);
    }, [
        state.products, state.orders, state.shipments, state.tasks, 
        state.customers, state.suppliers, state.syncAllowed, state.isInitialized
    ]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (!state.syncAllowed && !isForce) return false;
        if (state.connectionStatus !== 'connected') return false;
        if (isSyncingRef.current) return false;

        isSyncingRef.current = true;
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });

        try {
            const payloadData = {
                products: state.products, orders: state.orders, transactions: state.transactions,
                customers: state.customers, shipments: state.shipments, tasks: state.tasks,
                suppliers: state.suppliers, influencers: state.influencers,
                inboundShipments: state.inboundShipments,
                lastSyncTime: new Date().toISOString(), session: SESSION_ID
            };
            const jsonPayload = JSON.stringify(payloadData);
            const payloadSize = new Blob([jsonPayload]).size;

            let backupObj;
            const Backup = AV.Object.extend('Backup');
            
            // 优先使用缓存的对象ID更新，极大减少请求开销
            if (state.leanConfig.cloudObjectId) {
                backupObj = AV.Object.createWithoutData('Backup', state.leanConfig.cloudObjectId);
            } else {
                const query = new AV.Query('Backup');
                query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
                backupObj = await query.first();
                if (!backupObj) {
                    backupObj = new Backup();
                    backupObj.set('uniqueId', 'GLOBAL_BACKUP_NODE');
                }
            }

            backupObj.set('payload', jsonPayload);
            backupObj.set('session', SESSION_ID);
            
            const saved = await backupObj.save();
            
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { 
                lastSync: new Date().toLocaleTimeString(), 
                payloadSize,
                cloudObjectId: saved.id // 存下 ID 供下次直连
            } });
            
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false, saveStatus: 'saved' } });
            
            // 3秒后将状态切回 idle
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 3000);
            return true;
        } catch (e: any) {
            console.error("[Sync Engine Error]", e);
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            if (!e.message.includes('terminated')) {
                showToast(`云端同步链路受阻: ${e.message}`, 'error');
            }
            return false;
        } finally {
            isSyncingRef.current = false;
        }
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => {
        try {
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            const backupObj = await query.first();
            if (backupObj) {
                const rawPayload = backupObj.get('payload');
                const data = JSON.parse(rawPayload);
                const payloadSize = new Blob([rawPayload]).size;
                setIsInternalUpdate(true);
                dispatch({ type: 'HYDRATE_STATE', payload: { ...data, syncAllowed: false, saveStatus: 'idle' } });
                dispatch({ type: 'SET_LEAN_CONFIG', payload: { payloadSize, cloudObjectId: backupObj.id } });
                if (!isSilent) showToast('已从云端拉取最新镜像', 'success');
                return true;
            }
            return false;
        } catch (e: any) {
            if (!isSilent) showToast(`拉取失败: ${e.message}`, 'error');
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
