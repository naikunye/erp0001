import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AV from 'leancloud-storage';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AuditLog, AutomationRule, AutomationLog, Supplier,
    StockJournalEntry, Influencer
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS, MOCK_SUPPLIERS, MOCK_INFLUENCERS
} from '../constants';

const DB_NAME = 'TANXING_IDB_V1';
const STORE_NAME = 'STATE_STORE';
const CONFIG_KEY = 'TANXING_CONFIG_V15'; 
const CONN_STATUS_KEY = 'TANXING_CONN_STATUS_V1';
export let SESSION_ID = Math.random().toString(36).substring(7);

const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
            };
            request.onsuccess = () => { this.db = request.result; resolve(request.result); };
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
        db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
    }
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface LeanConfig { appId: string; appKey: string; serverURL: string; lastSync: string | null; payloadSize?: number; cloudObjectId?: string; remoteUpdatedAt?: string; }

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
    influencers: Influencer[];
    lastMutationTime: number; 
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
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'LOAD_MOCK_DATA' }
    | { type: 'SET_LEAN_CONFIG'; payload: Partial<LeanConfig> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'RESET_DATA' }
    | { type: 'INITIALIZED_SUCCESS' }
    | { type: 'UNLOCK_SYNC' }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string, status: Order['status'] } }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    | { type: 'ADD_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'UPDATE_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'DELETE_AUTOMATION_RULE'; payload: string }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'DELETE_PRODUCT'; payload: string };

const emptyState: AppState = {
    theme: 'ios-glass', activePage: 'dashboard', navParams: {},
    leanConfig: { appId: '', appKey: '', serverURL: '', lastSync: null, payloadSize: 0, remoteUpdatedAt: '' },
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], stockJournal: [], transactions: [], customers: [], orders: [], shipments: [], tasks: [], 
    inboundShipments: [], suppliers: [], toasts: [], auditLogs: [], 
    automationRules: [], automationLogs: [],
    isMobileMenuOpen: false, isInitialized: false, syncAllowed: false, syncLocked: true, influencers: [],
    lastMutationTime: 0
};

const safeLocalSave = (state: AppState) => { idb.set('GLOBAL_STATE', state).catch(e => console.error('IDB Save Error:', e)); };

const appReducer = (state: AppState, action: Action): AppState => {
    const markDirty = (newState: Partial<AppState>): AppState => {
        const updated = { 
            ...state, 
            ...newState, 
            syncAllowed: true, 
            saveStatus: 'dirty' as SaveStatus,
            lastMutationTime: Date.now()
        };
        safeLocalSave(updated); 
        return updated;
    };
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': { localStorage.setItem(CONN_STATUS_KEY, action.payload); return { ...state, connectionStatus: action.payload }; }
        case 'SET_SAVE_STATUS': return { ...state, saveStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        case 'HYDRATE_STATE': { const updated = { ...state, ...action.payload }; if (action.payload.syncLocked !== undefined) updated.syncLocked = action.payload.syncLocked; safeLocalSave(updated); return updated; }
        case 'LOAD_MOCK_DATA': return { ...state, products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, inboundShipments: MOCK_INBOUND_SHIPMENTS, orders: MOCK_ORDERS, suppliers: MOCK_SUPPLIERS, influencers: MOCK_INFLUENCERS, automationRules: [{ id: 'R-001', name: '库存水位红色警戒', trigger: 'low_stock_warning', action: 'create_task', status: 'active' }], isInitialized: true, syncLocked: false, lastMutationTime: Date.now() };
        case 'UNLOCK_SYNC': return { ...state, syncLocked: false };
        case 'SET_LEAN_CONFIG': { const newConfig = { ...state.leanConfig, ...action.payload }; localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig)); return { ...state, leanConfig: newConfig }; }
        case 'INITIALIZED_SUCCESS': return { ...state, isInitialized: true };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'RESET_DATA': { idb.clear(); localStorage.clear(); AV._config.appId = null; return { ...emptyState, isInitialized: true, syncLocked: false }; }
        case 'UPDATE_PRODUCT': return markDirty({ products: state.products.map(p => p.id === action.payload.id ? action.payload : p) });
        case 'ADD_PRODUCT': return markDirty({ products: [action.payload, ...state.products] });
        case 'ADD_TRANSACTION': return markDirty({ transactions: [action.payload, ...state.transactions] });
        case 'DELETE_TRANSACTION': return markDirty({ transactions: state.transactions.filter(t => t.id !== action.payload) });
        case 'ADD_SHIPMENT': return markDirty({ shipments: [action.payload, ...state.shipments] });
        case 'UPDATE_SHIPMENT': return markDirty({ shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'DELETE_SHIPMENT': return markDirty({ shipments: state.shipments.filter(s => s.id !== action.payload) });
        case 'ADD_CUSTOMER': return markDirty({ customers: [action.payload, ...state.customers] });
        case 'UPDATE_CUSTOMER': return markDirty({ customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) });
        case 'DELETE_CUSTOMER': return markDirty({ customers: state.customers.filter(c => c.id !== action.payload) });
        case 'ADD_SUPPLIER': return markDirty({ suppliers: [action.payload, ...state.suppliers] });
        case 'UPDATE_SUPPLIER': return markDirty({ suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) });
        case 'DELETE_SUPPLIER': return markDirty({ suppliers: state.suppliers.filter(s => s.id !== action.payload) });
        case 'ADD_TASK': return markDirty({ tasks: [action.payload, ...state.tasks] });
        case 'UPDATE_TASK': return markDirty({ tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) });
        case 'DELETE_TASK': return markDirty({ tasks: state.tasks.filter(t => t.id !== action.payload) });
        case 'ADD_ORDER': return markDirty({ orders: [action.payload, ...state.orders] });
        case 'UPDATE_ORDER_STATUS': return markDirty({ orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) });
        case 'DELETE_ORDER': return markDirty({ orders: state.orders.filter(o => o.id !== action.payload) });
        case 'CREATE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: [action.payload, ...state.inboundShipments] });
        case 'UPDATE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: state.inboundShipments.map(i => i.id === action.payload.id ? action.payload : i) });
        case 'DELETE_INBOUND_SHIPMENT': return markDirty({ inboundShipments: state.inboundShipments.filter(i => i.id !== action.payload) });
        case 'ADD_INFLUENCER': return markDirty({ influencers: [action.payload, ...(state.influencers || [])] });
        case 'UPDATE_INFLUENCER': return markDirty({ influencers: (state.influencers || []).map(i => i.id === action.payload.id ? action.payload : i) });
        case 'DELETE_INFLUENCER': return markDirty({ influencers: (state.influencers || []).filter(i => i.id !== action.payload) });
        case 'ADD_AUTOMATION_RULE': return markDirty({ automationRules: [action.payload, ...(state.automationRules || [])] });
        case 'UPDATE_AUTOMATION_RULE': return markDirty({ automationRules: (state.automationRules || []).map(r => r.id === action.payload.id ? action.payload : r) });
        case 'DELETE_AUTOMATION_RULE': return markDirty({ automationRules: (state.automationRules || []).filter(r => r.id !== action.payload) });
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'DELETE_PRODUCT': return markDirty({ products: state.products.filter(p => p.id !== action.payload) });
        default: return state;
    }
};

interface TanxingContextType { state: AppState; dispatch: React.Dispatch<Action>; showToast: (message: string, type: Toast['type']) => void; syncToCloud: (isForce?: boolean) => Promise<boolean>; pullFromCloud: (isSilent?: boolean) => Promise<boolean>; bootLean: (appId: string, appKey: string, serverURL: string) => Promise<void>; disconnectLean: () => void; }
const TanxingContext = createContext<TanxingContextType | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, emptyState);
    const isSyncingRef = useRef(false);

    const bootLean = async (appId: string, appKey: string, serverURL: string) => { 
        if (!appId || !appKey || !serverURL) return; 
        try { 
            const cleanUrl = serverURL.trim().replace(/\/$/, "");
            console.log(`[CloudSync] 尝试初始化链路... Origin: ${window.location.origin}`);
            AV.init({ appId: appId.trim(), appKey: appKey.trim(), serverURL: cleanUrl }); 
            const query = new AV.Query('Backup'); 
            await query.limit(1).find(); 
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' }); 
        } catch (e: any) { 
            console.error("[BootLean] Error Detected:", e);
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' }); 
            const isCors = e.message.includes('terminated') || e.message.includes('Access-Control') || e.message.includes('CORS');
            throw new Error(isCors ? `[物理层拦截] 请在 LeanCloud 控制台中将域名 ${window.location.origin} 加入“Web安全域名”。` : `认证失败: ${e.message}`); 
        } 
    };

    const disconnectLean = () => { 
        AV._config.appId = null; 
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' }); 
        dispatch({ type: 'SET_LEAN_CONFIG', payload: { appId: '', appKey: '', serverURL: '', lastSync: null, payloadSize: 0 } }); 
    };

    const syncToCloud = async (isForce: boolean = false): Promise<boolean> => { 
        if (!AV.applicationId) return false;
        if (!isForce && !state.syncAllowed) return false;
        if (isSyncingRef.current) return false; 
        
        isSyncingRef.current = true; 
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' }); 

        try { 
            const payloadData = { 
                products: state.products || [], orders: state.orders || [], shipments: state.shipments || [], 
                transactions: state.transactions || [], customers: state.customers || [], 
                influencers: state.influencers || [], suppliers: state.suppliers || [], 
                tasks: state.tasks || [], inboundShipments: state.inboundShipments || [], 
                automationRules: state.automationRules || []
            }; 
            const jsonPayload = JSON.stringify(payloadData); 
            const size = new Blob([jsonPayload]).size; 
            
            const query = new AV.Query('Backup'); 
            query.equalTo('uniqueId', 'GLOBAL_ERP_NODE'); 
            let backupObj = await query.first(); 
            if (!backupObj) { 
                const Backup = AV.Object.extend('Backup'); 
                backupObj = new Backup(); 
                backupObj.set('uniqueId', 'GLOBAL_ERP_NODE'); 
            } 
            const acl = new AV.ACL(); acl.setPublicReadAccess(true); acl.setPublicWriteAccess(true); backupObj.setACL(acl); 
            backupObj.set('payload', jsonPayload); 
            
            const saved = await backupObj.save(); 
            dispatch({ type: 'SET_LEAN_CONFIG', payload: { 
                lastSync: new Date().toLocaleTimeString(), 
                payloadSize: size, 
                cloudObjectId: saved.id,
                remoteUpdatedAt: saved.updatedAt?.toISOString()
            } }); 
            dispatch({ type: 'HYDRATE_STATE', payload: { syncAllowed: false, saveStatus: 'saved' } }); 
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: 'idle' }), 2000); 
            return true; 
        } catch (e: any) { 
            dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' }); 
            return false; 
        } finally { 
            isSyncingRef.current = false; 
        } 
    };

    const pullFromCloud = async (isSilent: boolean = false): Promise<boolean> => { 
        if (!AV.applicationId) return false; 
        try { 
            const query = new AV.Query('Backup'); 
            query.equalTo('uniqueId', 'GLOBAL_ERP_NODE'); 
            let backupObj = await query.first(); 
            if (backupObj) { 
                await backupObj.fetch(); 
                const rawPayload = backupObj.get('payload'); 
                if (!rawPayload) return false; 
                const size = new Blob([rawPayload]).size; 
                const data = JSON.parse(rawPayload); 
                dispatch({ type: 'HYDRATE_STATE', payload: { 
                    ...data, 
                    syncLocked: false, 
                    syncAllowed: false, 
                    saveStatus: 'idle', 
                    isInitialized: true, 
                    leanConfig: { 
                        ...state.leanConfig, 
                        payloadSize: size, 
                        cloudObjectId: backupObj.id, 
                        remoteUpdatedAt: backupObj.updatedAt?.toISOString(),
                        lastSync: `已同步云端 (${new Date(backupObj.updatedAt || "").toLocaleTimeString()})` 
                    } 
                } }); 
                if (!isSilent) showToast('检测到远端变动，数据已热更新', 'success'); 
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
        if (!state.isInitialized || !state.syncAllowed || state.syncLocked || !AV.applicationId) return; 
        const timer = setTimeout(() => syncToCloud(), 3000); 
        return () => clearTimeout(timer); 
    }, [state.lastMutationTime, state.syncAllowed, state.syncLocked]);

    useEffect(() => {
        if (!state.isInitialized || state.connectionStatus !== 'connected' || !AV.applicationId) return;

        const checkRemoteUpdate = async () => {
            if (state.saveStatus === 'dirty' || state.saveStatus === 'saving' || isSyncingRef.current) return;
            try {
                const query = new AV.Query('Backup');
                query.equalTo('uniqueId', 'GLOBAL_ERP_NODE');
                query.select(['updatedAt']);
                const remote = await query.first();
                if (remote && remote.updatedAt) {
                    const remoteTime = remote.updatedAt.toISOString();
                    if (remoteTime !== state.leanConfig.remoteUpdatedAt) {
                        await pullFromCloud(false);
                    }
                }
            } catch (e) {}
        };

        const heartbeat = setInterval(checkRemoteUpdate, 20000); 
        return () => clearInterval(heartbeat);
    }, [state.isInitialized, state.connectionStatus, state.leanConfig.remoteUpdatedAt, state.saveStatus]);

    useEffect(() => { 
        const startup = async () => { 
            try { 
                const savedDb: any = await idb.get('GLOBAL_STATE'); 
                if (savedDb) dispatch({ type: 'HYDRATE_STATE', payload: { ...savedDb, syncLocked: true } }); 
            } catch(e) {} 
            const savedConfig = localStorage.getItem(CONFIG_KEY); 
            const savedStatus = localStorage.getItem(CONN_STATUS_KEY) as ConnectionStatus; 
            if (savedConfig) { 
                try { 
                    const config = JSON.parse(savedConfig); 
                    dispatch({ type: 'SET_LEAN_CONFIG', payload: config }); 
                    if (config.appId && config.appKey && config.serverURL) { 
                        await bootLean(config.appId, config.appKey, config.serverURL); 
                        if (savedStatus === 'connected') await pullFromCloud(true); 
                        else dispatch({ type: 'UNLOCK_SYNC' }); 
                    } else dispatch({ type: 'UNLOCK_SYNC' }); 
                } catch (e) { dispatch({ type: 'UNLOCK_SYNC' }); } 
            } else dispatch({ type: 'LOAD_MOCK_DATA' }); 
            dispatch({ type: 'INITIALIZED_SUCCESS' }); 
        }; 
        startup(); 
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });
    
    return ( <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, bootLean, disconnectLean }}> {children} </TanxingContext.Provider> );
};

export const useTanxing = () => { const context = useContext(TanxingContext); if (!context) throw new Error('useTanxing error'); return context; };