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

const DB_NAME = 'TANXING_IDB';
const STORE_NAME = 'STATE_STORE';
const CONFIG_KEY = 'TANXING_CONFIG_V14'; 
export let SESSION_ID = Math.random().toString(36).substring(7);

/**
 * IndexedDB 极简异步包装器
 */
const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(STORE_NAME);
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    },
    async set(key: string, val: any) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(val, key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    },
    async get(key: string) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    async clear() {
        const db = await this.init();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
    }
};

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
    | { type: 'ADD_INFLUENCER'; payload: any }
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
    | { type: 'DELETE_TASK'; payload: string };

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
 * 现在使用 IndexedDB 保存，支持大容量数据
 */
const safeLocalSave = (state: AppState) => {
    idb.set('GLOBAL_STATE', state).catch(err => console.error('IndexedDB Save Error:', err));
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
            const mergedProducts = incomingProducts.map(newP => {
                const existingP = state.products.find(p => p.id === newP.id);
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
        case 'RESET_DATA': idb.clear(); localStorage.clear(); return { ...emptyState, isInitialized: true, syncLocked: false };
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
                if (!isSilent) showToast('云端数据同步完成', 'success');
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
            // 首先从 IndexedDB 读取（没有 5MB 限制）
            const savedDb: any = await idb.get('GLOBAL_STATE');
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            
            if (savedDb) {
                try { 
                    // 核心改进：本地数据现在完整包含图片，秒级加载
                    dispatch({ type: 'HYDRATE_STATE', payload: { ...savedDb, syncLocked: true } }); 
                } catch(e) {}
            }

            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    dispatch({ type: 'SET_LEAN_CONFIG', payload: config });
                    await bootLean(config.appId, config.appKey, config.serverURL);
                    // 后台静默对账
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