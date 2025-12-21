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
    syncLocked: boolean; 
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
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_LEAN_CONFIG'; payload: Partial<LeanConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' }
    | { type: 'INITIALIZED_SUCCESS' }
    | { type: 'UNLOCK_SYNC' }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: any };

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
    isMobileMenuOpen: false, isInitialized: false, syncAllowed: false, syncLocked: true, influencers: []
};

/**
 * 核心优化：智能本地存储机制
 * 5MB 限制内，优先保护图片，清理非必要日志
 */
const safeLocalSave = (state: AppState) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(state));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.warn('LocalStorage Quota Exceeded. Pruning non-essential logs to keep images...');
            
            // 减重策略 1：清理冗余历史记录
            const step1 = {
                ...state,
                auditLogs: [], // 清空审计日志
                automationLogs: [], // 清空自动日志
                stockJournal: (state.stockJournal || []).slice(0, 5), // 只留5条库存变动
                transactions: (state.transactions || []).slice(0, 20) // 只留最近20条流水
            };
            
            try {
                localStorage.setItem(DB_KEY, JSON.stringify(step1));
                console.log('Cache saved after pruning logs.');
            } catch (innerE) {
                // 减重策略 2：如果还是存不下（图片太多），则清理图片
                console.warn('Still exceeds quota. Pruning images from local cache as last resort.');
                const step2 = {
                    ...step1,
                    products: (state.products || []).map(p => ({ ...p, image: undefined, images: [] }))
                };
                localStorage.setItem(DB_KEY, JSON.stringify(step2));
            }
        }
    }
};

const appReducer = (state: AppState, action: Action): AppState => {
    const markDirty = (newState: Partial<AppState>): AppState => {
        const updated = { ...state, ...newState, syncAllowed: !state.syncLocked, saveStatus: 'dirty' as SaveStatus };
        safeLocalSave(updated);
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
            const products = (state.products || []).map(p => p.id === action.payload.id ? action.payload : p);
            return markDirty({ products });
        }
        case 'ADD_PRODUCT': return markDirty({ products: [action.payload, ...(state.products || [])] });
        case 'DELETE_PRODUCT': return markDirty({ products: (state.products || []).filter(p => p.id !== action.payload) });

        case 'HYDRATE_STATE': {
            const incomingProducts = Array.isArray(action.payload.products) ? action.payload.products : [];
            
            // 深度合并策略：如果云端拉回来的数据里没图，但本地内存已经有图了，不要用空值覆盖
            const mergedProducts = incomingProducts.map(newP => {
                const existingP = state.products.find(p => p.id === newP.id);
                // 仅当新数据完全没有图片字段时，保留内存中的图片
                if (existingP && existingP.image && (!newP.image || newP.image === "")) {
                    return { ...newP, image: existingP.image, images: existingP.images };
                }
                return newP;
            });

            const updated = { 
                ...state, 
                ...action.payload,
                products: mergedProducts.length > 0 ? mergedProducts : (state.products || []),
                syncLocked: action.payload.syncLocked ?? state.syncLocked
            };
            safeLocalSave(updated);
            return updated;
        }
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, isInitialized: true, syncLocked: false };
        case 'UNLOCK_SYNC': return { ...state, syncLocked: false };
        case 'SET_LEAN_CONFIG': return { ...state, leanConfig: { ...state.leanConfig, ...action.payload } };
        case 'INITIALIZED_SUCCESS': return { ...state, isInitialized: true };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': localStorage.clear(); return { ...emptyState, isInitialized: true, syncLocked: false };
        case 'ADD_INFLUENCER': return markDirty({ influencers: [action.payload, ...(state.influencers || [])] });
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
        try { 
            AV.init({ appId, appKey, serverURL: serverURL.trim().replace(/\/$/, "") }); 
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' }); 
        } catch (e) { 
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); 
            throw e; 
        }
    };

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => {
        if (state.syncLocked && !isForce) return false;
        if (!state.syncAllowed && !isForce) return false;
        if (!AV.applicationId || isSyncingRef.current) return false;
        
        isSyncingRef.current = true;
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
        
        try {
            const payloadData = { 
                products: state.products || [], 
                orders: state.orders || [], 
                shipments: state.shipments || [], 
                transactions: state.transactions || [], 
                customers: state.customers || [],
                influencers: state.influencers || [],
                suppliers: state.suppliers || [],
                tasks: state.tasks || [],
                timestamp: new Date().toISOString() 
            };
            
            const jsonPayload = JSON.stringify(payloadData);
            let backupObj;
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
            
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { lastSync: new Date().toLocaleTimeString(), payloadSize: new Blob([jsonPayload]).size, cloudObjectId: saved.id } });
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false, saveStatus: 'saved' } });
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2000);
            return true;
        } catch (e: any) { 
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
            return false; 
        } finally { isSyncingRef.current = false; }
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => {
        if (!AV.applicationId) return false;
        try {
            const query = new AV.Query('Backup');
            query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
            let backupObj = await query.first();
            
            if (backupObj) {
                const data = JSON.parse(backupObj.get('payload'));
                dispatch({ 
                    type: 'HYDRATE_STATE', 
                    payload: { 
                        ...data, 
                        syncLocked: false, 
                        syncAllowed: false, 
                        saveStatus: 'idle', 
                        isInitialized: true 
                    } 
                });
                if (!isSilent) showToast('云端镜像同步完成', 'success');
                return true;
            }
            dispatch({ type: 'UNLOCK_SYNC' });
            return false;
        } catch (e: any) { 
            dispatch({ type: 'UNLOCK_SYNC' });
            return false; 
        }
    };

    useEffect(() => {
        if (!state.isInitialized) return;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(state.leanConfig));
        if (AV.applicationId && state.syncAllowed && !isSyncingRef.current && !state.syncLocked) {
            const timer = setTimeout(() => syncToCloud(), 3000);
            return () => clearTimeout(timer);
        }
    }, [state.products, state.transactions, state.syncAllowed, state.syncLocked]);

    useEffect(() => {
        const startup = async () => {
            const savedDb = localStorage.getItem(DB_KEY);
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            
            if (savedDb) {
                try { 
                    const localData = JSON.parse(savedDb);
                    dispatch({ type: 'HYDRATE_STATE', payload: { ...localData, syncLocked: true } }); 
                } catch(e) {}
            }

            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                    await bootLean(config.appId, config.appKey, config.serverURL);
                    // 重要：这里不 await，让 UI 先加载本地数据
                    pullFromCloud(true); 
                } catch (e) { dispatch({ type: 'UNLOCK_SYNC' }); }
            } else {
                dispatch({ type: 'LOAD_MOCK_DATA' });
            }
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
