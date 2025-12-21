import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import AV from 'leancloud-storage';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AuditLog, AutomationRule, AutomationLog, Supplier
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS, MOCK_SUPPLIERS
} from '../constants';

const DB_KEY = 'TANXING_DB_V13'; 
const CONFIG_KEY = 'TANXING_CONFIG_V13'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface LeanConfig {
    appId: string; appKey: string; serverURL: string; lastSync: string | null;
    payloadSize?: number; cloudObjectId?: string;
}

interface AppState {
    theme: 'ios-glass' | 'cyber-neon' | 'midnight-dark';
    activePage: Page;
    navParams: { searchQuery?: string };
    leanConfig: LeanConfig;
    connectionStatus: ConnectionStatus;
    saveStatus: SaveStatus;
    products: Product[];
    transactions: Transaction[];
    customers: Customer[];
    orders: Order[];
    shipments: Shipment[];
    tasks: Task[];
    inboundShipments: InboundShipment[];
    suppliers: Supplier[];
    toasts: Toast[];
    auditLogs: AuditLog[];
    automationRules: AutomationRule[];
    automationLogs: AutomationLog[];
    isMobileMenuOpen: boolean;
    isInitialized: boolean; 
    syncAllowed: boolean; 
    influencers: any[];
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
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_LEAN_CONFIG'; payload: Partial<LeanConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'LOG_AUTOMATION'; payload: AutomationLog }
    | { type: 'RESET_DATA' }
    | { type: 'INITIALIZED_SUCCESS' }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: any }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string };

const INITIAL_RULES: AutomationRule[] = [
    { id: 'rule-1', name: '物流异常自动分派', trigger: 'logistics_exception', action: 'create_task', status: 'active' },
    { id: 'rule-2', name: '库存破位预警', trigger: 'low_stock_warning', action: 'create_task', status: 'active' }
];

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null },
    connectionStatus: 'disconnected', saveStatus: 'idle', 
    products: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], 
    inboundShipments: [], suppliers: [], toasts: [], auditLogs: [], 
    automationRules: INITIAL_RULES, automationLogs: [],
    isMobileMenuOpen: false, isInitialized: false, syncAllowed: false, influencers: []
};

const appReducer = (state: AppState, action: Action): AppState => {
    const markDirty = (newState: Partial<AppState>): AppState => ({ 
        ...state, ...newState, syncAllowed: true, saveStatus: 'dirty'
    });

    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'SET_SAVE_STATUS': return { ...state, saveStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        
        case 'UPDATE_PRODUCT': return markDirty({ products: (state.products || []).map(p => p.id === action.payload.id ? action.payload : p) });
        case 'ADD_PRODUCT': return markDirty({ products: [action.payload, ...(state.products || [])] });
        case 'DELETE_PRODUCT': return markDirty({ products: (state.products || []).filter(p => p.id !== action.payload) });

        case 'UPDATE_SHIPMENT': return markDirty({ shipments: (state.shipments || []).map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SHIPMENT': return markDirty({ shipments: [action.payload, ...(state.shipments || [])] });
        case 'DELETE_SHIPMENT': return markDirty({ shipments: (state.shipments || []).filter(s => s.id !== action.payload) });

        case 'CREATE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: [action.payload, ...(state.inboundShipments || [])] });
        case 'UPDATE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: (state.inboundShipments || []).map(s => s.id === action.payload.id ? action.payload : s) });
        case 'DELETE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: (state.inboundShipments || []).filter(s => s.id !== action.payload) });

        case 'UPDATE_TASK': return markDirty({ tasks: (state.tasks || []).map(t => t.id === action.payload.id ? action.payload : t) });
        case 'ADD_TASK': return markDirty({ tasks: [action.payload, ...(state.tasks || [])] });
        case 'DELETE_TASK': return markDirty({ tasks: (state.tasks || []).filter(t => t.id !== action.payload) });

        case 'ADD_TRANSACTION': return markDirty({ transactions: [action.payload, ...(state.transactions || [])] });
        case 'DELETE_TRANSACTION': return markDirty({ transactions: (state.transactions || []).filter(t => t.id !== action.payload) });
        
        case 'UPDATE_CUSTOMER': return markDirty({ customers: (state.customers || []).map(c => c.id === action.payload.id ? action.payload : c) });
        case 'ADD_CUSTOMER': return markDirty({ customers: [action.payload, ...(state.customers || [])] });
        case 'DELETE_CUSTOMER': return markDirty({ customers: (state.customers || []).filter(c => c.id !== action.payload) });
        case 'ADD_INFLUENCER': return markDirty({ influencers: [action.payload, ...(state.influencers || [])] });

        case 'UPDATE_SUPPLIER': return markDirty({ suppliers: (state.suppliers || []).map(s => s.id === action.payload.id ? action.payload : s) });
        case 'ADD_SUPPLIER': return markDirty({ suppliers: [action.payload, ...(state.suppliers || [])] });
        case 'DELETE_SUPPLIER': return markDirty({ suppliers: (state.suppliers || []).filter(s => s.id !== action.payload) });

        case 'LOG_AUTOMATION': return { ...state, automationLogs: [action.payload, ...(state.automationLogs || [])].slice(0, 50) };
        
        case 'HYDRATE_STATE': 
            return { 
                ...state, 
                ...action.payload,
                products: Array.isArray(action.payload.products) ? action.payload.products : (state.products || []),
                transactions: Array.isArray(action.payload.transactions) ? action.payload.transactions : (state.transactions || []),
                customers: Array.isArray(action.payload.customers) ? action.payload.customers : (state.customers || []),
                orders: Array.isArray(action.payload.orders) ? action.payload.orders : (state.orders || []),
                shipments: Array.isArray(action.payload.shipments) ? action.payload.shipments : (state.shipments || []),
                tasks: Array.isArray(action.payload.tasks) ? action.payload.tasks : (state.tasks || []),
                inboundShipments: Array.isArray(action.payload.inboundShipments) ? action.payload.inboundShipments : (state.inboundShipments || []),
                suppliers: Array.isArray(action.payload.suppliers) ? action.payload.suppliers : (state.suppliers || []),
                toasts: Array.isArray(action.payload.toasts) ? action.payload.toasts : (state.toasts || []),
                auditLogs: Array.isArray(action.payload.auditLogs) ? action.payload.auditLogs : (state.auditLogs || []),
                automationRules: Array.isArray(action.payload.automationRules) ? action.payload.automationRules : (state.automationRules || INITIAL_RULES),
                automationLogs: Array.isArray(action.payload.automationLogs) ? action.payload.automationLogs : (state.automationLogs || []),
                influencers: Array.isArray(action.payload.influencers) ? action.payload.influencers : (state.influencers || [])
            };

        case 'LOAD_MOCK_DATA': return { 
            ...state, 
            products: MOCK_PRODUCTS, 
            transactions: MOCK_TRANSACTIONS, 
            customers: MOCK_CUSTOMERS, 
            orders: MOCK_ORDERS, 
            shipments: MOCK_SHIPMENTS, 
            inboundShipments: MOCK_INBOUND_SHIPMENTS,
            suppliers: MOCK_SUPPLIERS,
            isInitialized: true 
        };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'INITIALIZED_SUCCESS': return { ...state, isInitialized: true };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true };
        default: return state;
    }
};

interface TanxingContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (isForce?: boolean) => Promise<boolean>;
    pullFromCloud: (isSilent?: boolean) => Promise<boolean>;
    bootLean: (appId: string, appKey: string, serverURL: string) => Promise<void>;
}

const TanxingContext = createContext<TanxingContextType | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const isSyncingRef = useRef(false);

    useEffect(() => {
        if (!state.isInitialized) return;
        const checkAutomations = () => {
            const shipments = state.shipments || [];
            const tasks = state.tasks || [];
            const rules = state.automationRules || [];
            const products = state.products || [];

            shipments.forEach(ship => {
                if (ship.status === '异常') {
                    const taskExists = tasks.some(t => t.title.includes(ship.trackingNo));
                    if (!taskExists && rules.find(r => r.trigger === 'logistics_exception')?.status === 'active') {
                        const newTask: Task = { id: `AUTO-LOG-${Date.now()}`, title: `🔴 物流异常介入: ${ship.trackingNo}`, priority: 'urgent', status: 'todo', assignee: '物流专员', dueDate: new Date().toISOString().split('T')[0], category: 'logistics', autoGenerated: true };
                        dispatch({ type: 'ADD_TASK', payload: newTask });
                        dispatch({ type: 'LOG_AUTOMATION', payload: { id: `L-${Date.now()}`, timestamp: new Date().toISOString(), ruleName: '物流异常自动分派', details: `单号 ${ship.trackingNo} 触发异常，已创建紧急任务。`, status: 'success' } });
                        showToast(`触发自动化: 已为异常运单 ${ship.trackingNo} 分派任务`, 'warning');
                    }
                }
            });
            products.forEach(p => {
                const dos = (p.stock || 0) / (p.dailyBurnRate || 1);
                if (dos < 15) {
                    const taskExists = tasks.some(t => t.title.includes(p.sku) && t.title.includes('补货'));
                    if (!taskExists && rules.find(r => r.trigger === 'low_stock_warning')?.status === 'active') {
                        const newTask: Task = { id: `AUTO-STK-${Date.now()}`, title: `⚡ 紧急补货预警: SKU ${p.sku}`, priority: 'high', status: 'todo', assignee: '运营主管', dueDate: new Date().toISOString().split('T')[0], category: 'procurement', autoGenerated: true };
                        dispatch({ type: 'ADD_TASK', payload: newTask });
                        dispatch({ type: 'LOG_AUTOMATION', payload: { id: `L-${Date.now()}`, timestamp: new Date().toISOString(), ruleName: '库存破位预警', details: `SKU ${p.sku} 可售天数仅剩 ${dos.toFixed(1)} 天，已触发补货任务。`, status: 'success' } });
                        showToast(`触发自动化: SKU ${p.sku} 触达安全库存红线`, 'error');
                    }
                }
            });
        };
        const timer = setTimeout(checkAutomations, 2000);
        return () => clearTimeout(timer);
    }, [state.shipments, state.products, state.tasks, state.isInitialized]);

    useEffect(() => {
        if (!state.isInitialized) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        if (state.connectionStatus === 'connected' && state.syncAllowed && !isSyncingRef.current) {
            setTimeout(() => syncToCloud(), 5000);
        }
    }, [state.products, state.orders, state.shipments, state.tasks, state.suppliers, state.isInitialized]);

    const bootLean = async (appId: string, appKey: string, serverURL: string) => {
        try { AV.init({ appId, appKey, serverURL: serverURL.trim().replace(/\/$/, "") }); dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' }); }
        catch (e) { dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); throw e; }
    };

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (!state.syncAllowed && !isForce) return false;
        if (state.connectionStatus !== 'connected' || isSyncingRef.current) return false;
        isSyncingRef.current = true;
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
        try {
            const payloadData = { 
                products: state.products || [], 
                orders: state.orders || [], 
                shipments: state.shipments || [], 
                tasks: state.tasks || [], 
                inboundShipments: state.inboundShipments || [], 
                transactions: state.transactions || [], 
                influencers: state.influencers || [],
                suppliers: state.suppliers || [],
                timestamp: new Date().toISOString() 
            };
            const jsonPayload = JSON.stringify(payloadData);
            let backupObj;
            if (state.leanConfig.cloudObjectId) { backupObj = AV.Object.createWithoutData('Backup', state.leanConfig.cloudObjectId); }
            else {
                const query = new AV.Query('Backup'); query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
                backupObj = await query.first();
                if (!backupObj) { const Backup = AV.Object.extend('Backup'); backupObj = new Backup(); backupObj.set('uniqueId', 'GLOBAL_ERP_NODE'); }
            }
            backupObj.set('payload', jsonPayload);
            const saved = await backupObj.save();
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { lastSync: new Date().toLocaleTimeString(), payloadSize: new Blob([jsonPayload]).size, cloudObjectId: saved.id } });
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false, saveStatus: 'saved' } });
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2000);
            return true;
        } catch (e) { dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' }); return false; }
        finally { isSyncingRef.current = false; }
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => {
        try {
            const query = new AV.Query('Backup'); query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
            const backupObj = await query.first();
            if (backupObj) {
                const data = JSON.parse(backupObj.get('payload'));
                dispatch({ type: 'HYDRATE_STATE', payload: { ...data, syncAllowed: false, saveStatus: 'idle', isInitialized: true } });
                return true;
            }
            return false;
        } catch (e) { return false; }
    };

    useEffect(() => {
        const startup = async () => {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            const savedDb = localStorage.getItem(DB_KEY);
            if (savedConfig) {
                try {
                  const config = JSON.parse(savedConfig);
                  dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                  await bootLean(config.appId, config.appKey, config.serverURL);
                  await pullFromCloud(true); 
                } catch (e) {}
            } else if (savedDb) {
                try {
                   dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) });
                } catch(e) {}
            } else { dispatch({ type: 'LOAD_MOCK_DATA' }); }
            dispatch({ type: 'INITIALIZED_SUCCESS' });
        };
        startup();
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => {
    const context = useContext(TanxingContext);
    if (!context) throw new Error('useTanxing must be used within a TanxingProvider');
    return context;
};