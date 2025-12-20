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
    payloadSize?: number;
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
    | { type: 'ALLOW_SYNC' }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'INITIALIZED_SUCCESS' };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null },
    connectionStatus: 'disconnected', products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], calendarEvents: [], suppliers: [], adCampaigns: [], influencers: [], inboundShipments: [], toasts: [], auditLogs: [], exportTasks: [], isMobileMenuOpen: false, isInitialized: false, isDemoMode: false, syncAllowed: false
};

const appReducer = (state: AppState, action: Action): AppState => {
    // 统一标记任何业务改动为“允许同步”
    const withSync = (newState: Partial<AppState>): AppState => ({ ...state, ...newState, syncAllowed: true, isDemoMode: false });

    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        
        case 'UPDATE_PRODUCT': return withSync({ products: state.products.map(p => p.id === action.payload.id ? action.payload : p) });
        case 'ADD_PRODUCT': return withSync({ products: [action.payload, ...state.products] });
        case 'DELETE_PRODUCT': return withSync({ products: state.products.filter(p => p.id !== action.payload) });

        case 'UPDATE_SHIPMENT': return withSync({ shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SHIPMENT': return withSync({ shipments: [action.payload, ...state.shipments] });
        case 'DELETE_SHIPMENT': return withSync({ shipments: state.shipments.filter(s => s.id !== action.payload) });

        case 'UPDATE_ORDER_STATUS': return withSync({ orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) });
        case 'ADD_ORDER': return withSync({ orders: [action.payload, ...state.orders] });
        case 'DELETE_ORDER': return withSync({ orders: state.orders.filter(o => o.id !== action.payload) });

        case 'UPDATE_CUSTOMER': return withSync({ customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) });
        case 'ADD_CUSTOMER': return withSync({ customers: [action.payload, ...state.customers] });
        case 'DELETE_CUSTOMER': return withSync({ customers: state.customers.filter(c => c.id !== action.payload) });

        case 'UPDATE_SUPPLIER': return withSync({ suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SUPPLIER': return withSync({ suppliers: [action.payload, ...state.suppliers] });
        case 'DELETE_SUPPLIER': return withSync({ suppliers: state.suppliers.filter(s => s.id !== action.payload) });

        case 'UPDATE_TASK': return withSync({ tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) });
        case 'ADD_TASK': return withSync({ tasks: [action.payload, ...state.tasks] });
        case 'DELETE_TASK': return withSync({ tasks: state.tasks.filter(t => t.id !== action.payload) });

        case 'CREATE_INBOUND_SHIPMENT': return withSync({ inboundShipments: [action.payload, ...state.inboundShipments] });

        case 'HYDRATE_STATE': return { ...state, ...action.payload, isDemoMode: false };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, suppliers: MOCK_SUPPLIERS, adCampaigns: MOCK_AD_CAMPAIGNS, influencers: MOCK_INFLUENCERS, inboundShipments: MOCK_INBOUND_SHIPMENTS, isDemoMode: true, syncAllowed: false };
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
    const isSyncingRef = useRef(false); // 物理锁，彻底解决 Request Terminated 问题

    const bootLean = async (appId: string, appKey: string, serverURL: string) => {
        if (!appId || !appKey || !serverURL) return;
        try {
            const cleanUrl = serverURL.trim().replace(/\/$/, "");
            AV.init({ appId, appKey, serverURL: cleanUrl });
            const query = new AV.Query('Backup');
            query.limit(1);
            try { await query.find(); } catch (e: any) { if (e.code === 401) throw e; }
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
                    const pullSuccess = await pullFromCloud(true);
                    if (pullSuccess) hasAttemptedPullRef.current = true;
                } catch (e) {}
            }
            if (!hasAttemptedPullRef.current) {
                if (savedDb) dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
                else dispatch({ type: 'LOAD_MOCK_DATA' });
            }
            dispatch({ type: 'INITIALIZED_SUCCESS' });
        };
        startup();
    }, []);

    // 自动持久化与背景同步
    useEffect(() => {
        if (!state.isInitialized) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        
        if (!isInternalUpdate) {
            const slim = { ...state, toasts: [], exportTasks: [], connectionStatus: 'disconnected' as ConnectionStatus, isInitialized: false, syncAllowed: false };
            try { localStorage.setItem(DB_KEY, JSON.stringify(slim)); } catch(e) {}
        }

        // 修改触发同步的阈值：仅在有 syncAllowed 且未处于同步状态时触发
        if (state.connectionStatus === 'connected' && state.syncAllowed && !isInternalUpdate && !isSyncingRef.current) {
            const timer = setTimeout(() => syncToCloud(), 8000);
            return () => clearTimeout(timer);
        }
        setIsInternalUpdate(false);
    }, [
        state.products, state.orders, state.shipments, state.tasks, 
        state.customers, state.suppliers, state.syncAllowed, state.isInitialized
    ]);

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (!state.syncAllowed && !isForce) return false;
        if (state.connectionStatus !== 'connected') return false;
        if (isSyncingRef.current) return false; // 锁住物理连接

        isSyncingRef.current = true;
        try {
            const payloadData = {
                products: state.products, orders: state.orders, transactions: state.transactions,
                customers: state.customers, shipments: state.shipments, tasks: state.tasks,
                suppliers: state.suppliers, influencers: state.influencers,
                inboundShipments: state.inboundShipments,
                timestamp: new Date().toISOString(), session: SESSION_ID
            };
            const jsonPayload = JSON.stringify(payloadData);
            const payloadBytes = new Blob([jsonPayload]).size;

            const Backup = AV.Object.extend('Backup');
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_BACKUP_NODE');
            let backupObj = await query.first();

            if (!backupObj) {
                backupObj = new Backup();
                backupObj.set('uniqueId', 'GLOBAL_BACKUP_NODE');
            }

            backupObj.set('payload', jsonPayload);
            backupObj.set('lastSyncTime', new Date().toISOString());
            backupObj.set('session', SESSION_ID);

            await backupObj.save();
            
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { lastSync: new Date().toLocaleTimeString(), payloadSize: payloadBytes } });
            // 同步成功后，重置 syncAllowed 标志位
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false } });
            return true;
        } catch (e: any) {
            console.error("[Node Sync Failed]", e);
            if (e.message.includes('terminated')) {
                // 如果是终止错误，说明链路拥塞，静默重试而不弹窗
            } else {
                showToast(`同步链路中断: ${e.message}`, 'error');
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
            let backupObj = await query.first();
            if (backupObj) {
                const rawPayload = backupObj.get('payload');
                const data = JSON.parse(rawPayload);
                const payloadBytes = new Blob([rawPayload]).size;
                setIsInternalUpdate(true);
                dispatch({ type: 'HYDRATE_STATE', payload: { ...data, syncAllowed: false } });
                dispatch({ type: 'SET_LEAN_CONFIG', payload: { payloadSize: payloadBytes } });
                if (!isSilent) showToast('云端镜像同步至本地节点', 'success');
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
