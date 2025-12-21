import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AV from 'leancloud-storage';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AuditLog, AutomationRule, AutomationLog, Supplier,
    StockJournalEntry
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS, MOCK_SUPPLIERS
} from '../constants';

const DB_KEY = 'TANXING_DB_V14'; 
const CONFIG_KEY = 'TANXING_CONFIG_V14'; 
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
    exchangeRate: number;
    products: Product[];
    stockJournal: StockJournalEntry[];
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
    | { type: 'SET_EXCHANGE_RATE'; payload: number }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'UPDATE_PRODUCT'; payload: Product; reason?: string }
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
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], stockJournal: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], 
    inboundShipments: [], suppliers: [], toasts: [], auditLogs: [], 
    automationRules: INITIAL_RULES, automationLogs: [],
    isMobileMenuOpen: false, isInitialized: false, syncAllowed: false, influencers: []
};

const appReducer = (state: AppState, action: Action): AppState => {
    const markDirty = (newState: Partial<AppState>): AppState => {
        const updated = { ...state, ...newState, syncAllowed: true, saveStatus: 'dirty' as SaveStatus };
        // 实时备份至本地 localStorage 防丢
        localStorage.setItem(DB_KEY, JSON.stringify(updated));
        return updated;
    };

    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'SET_SAVE_STATUS': return { ...state, saveStatus: action.payload };
        case 'SET_EXCHANGE_RATE': return markDirty({ exchangeRate: action.payload });
        case 'ADD_TOAST': return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        
        case 'UPDATE_PRODUCT': {
            const oldProduct = (state.products || []).find(p => p.id === action.payload.id);
            const stockJournal = [...(state.stockJournal || [])];
            if (oldProduct && oldProduct.stock !== action.payload.stock) {
                stockJournal.unshift({ id: `SJ-${Date.now()}`, timestamp: new Date().toISOString(), sku: action.payload.sku, change: action.payload.stock - oldProduct.stock, previousStock: oldProduct.stock, newStock: action.payload.stock, reason: action.reason || '手动更新', operator: 'Admin' });
            }
            return markDirty({ products: (state.products || []).map(p => p.id === action.payload.id ? action.payload : p), stockJournal: stockJournal.slice(0, 500) });
        }
        case 'ADD_PRODUCT': return markDirty({ products: [action.payload, ...(state.products || [])] });
        case 'DELETE_PRODUCT': return markDirty({ products: (state.products || []).filter(p => p.id !== action.payload) });
        case 'ADD_TRANSACTION': return markDirty({ transactions: [action.payload, ...(state.transactions || [])] });
        case 'DELETE_TRANSACTION': return markDirty({ transactions: (state.transactions || []).filter(t => t.id !== action.payload) });
        case 'HYDRATE_STATE': 
            return { 
                ...state, ...action.payload,
                products: Array.isArray(action.payload.products) ? action.payload.products : (state.products || []),
                stockJournal: Array.isArray(action.payload.stockJournal) ? action.payload.stockJournal : (state.stockJournal || []),
                transactions: Array.isArray(action.payload.transactions) ? action.payload.transactions : (state.transactions || []),
                customers: Array.isArray(action.payload.customers) ? action.payload.customers : (state.customers || []),
                orders: Array.isArray(action.payload.orders) ? action.payload.orders : (state.orders || []),
                shipments: Array.isArray(action.payload.shipments) ? action.payload.shipments : (state.shipments || []),
                tasks: Array.isArray(action.payload.tasks) ? action.payload.tasks : (state.tasks || []),
                inboundShipments: Array.isArray(action.payload.inboundShipments) ? action.payload.inboundShipments : (state.inboundShipments || []),
                suppliers: Array.isArray(action.payload.suppliers) ? action.payload.suppliers : (state.suppliers || []),
                influencers: Array.isArray(action.payload.influencers) ? action.payload.influencers : (state.influencers || []),
                exchangeRate: action.payload.exchangeRate ?? state.exchangeRate ?? 7.2
            };
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, orders: MOCK_ORDERS, shipments: MOCK_SHIPMENTS, inboundShipments: MOCK_INBOUND_SHIPMENTS, suppliers: MOCK_SUPPLIERS, isInitialized: true };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'INITIALIZED_SUCCESS': return { ...state, isInitialized: true };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
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
                stockJournal: state.stockJournal || [],
                orders: state.orders || [], 
                shipments: state.shipments || [], 
                tasks: state.tasks || [], 
                inboundShipments: state.inboundShipments || [], 
                transactions: state.transactions || [], 
                influencers: state.influencers || [],
                suppliers: state.suppliers || [],
                exchangeRate: state.exchangeRate || 7.2,
                timestamp: new Date().toISOString() 
            };
            
            const jsonPayload = JSON.stringify(payloadData);
            let backupObj;

            // 修复：双向检索逻辑
            if (state.leanConfig.cloudObjectId) {
                backupObj = AV.Object.createWithoutData('Backup', state.leanConfig.cloudObjectId);
            } else {
                const query = new AV.Query('Backup'); query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
                backupObj = await query.first();
            }

            if (!backupObj) {
                const Backup = AV.Object.extend('Backup');
                backupObj = new Backup();
                backupObj.set('uniqueId', 'GLOBAL_ERP_NODE');
            }

            backupObj.set('payload', jsonPayload);
            const saved = await backupObj.save();
            
            dispatch({ 
                type: 'SET_LEAN_CONFIG', 
                payload: { 
                    lastSync: new Date().toLocaleTimeString(), 
                    payloadSize: new Blob([jsonPayload]).size, 
                    cloudObjectId: saved.id 
                } 
            });
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false, saveStatus: 'saved' } });
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2000);
            return true;
        } catch (e: any) { 
            console.error('Cloud Sync Failed:', e);
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            showToast(`同步失败: ${e.message}`, 'error');
            return false; 
        } finally { 
            isSyncingRef.current = false; 
        }
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => {
        if (state.connectionStatus !== 'connected') return false;
        try {
            const query = new AV.Query('Backup'); query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
            const backupObj = await query.first();
            if (backupObj) {
                const data = JSON.parse(backupObj.get('payload'));
                dispatch({ type: 'HYDRATE_STATE', payload: { ...data, leanConfig: { ...state.leanConfig, cloudObjectId: backupObj.id }, syncAllowed: false, saveStatus: 'idle', isInitialized: true } });
                if (!isSilent) showToast('云端镜像同步成功', 'success');
                return true;
            }
            return false;
        } catch (e: any) { 
            if (!isSilent) showToast(`拉取失败: ${e.message}`, 'error');
            return false; 
        }
    };

    useEffect(() => {
        if (!state.isInitialized) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        if (state.connectionStatus === 'connected' && state.syncAllowed && !isSyncingRef.current) {
            const timer = setTimeout(() => syncToCloud(), 3000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.transactions, state.exchangeRate, state.syncAllowed, state.isInitialized]);

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
                try { dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(savedDb) }); } catch(e) {}
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