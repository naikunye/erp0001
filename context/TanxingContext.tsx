
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import PocketBase from 'pocketbase';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AutomationRule, Supplier, Influencer, AutomationLog, Theme
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';

const DB_NAME = 'TANXING_V6_CORE';
const STORE_NAME = 'GLOBAL_STATE';
const CONFIG_KEY = 'PB_URL_NODE'; 
const PAGE_CACHE_KEY = 'TX_ACTIVE_PAGE';
const THEME_CACHE_KEY = 'TX_ACTIVE_THEME';
export const SESSION_ID = 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 7);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                    request.result.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => { this.db = request.result; resolve(request.result); };
            request.onerror = () => reject(request.error);
        });
    },
    async set(val: any) {
        try {
            const db = await this.init();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const cleanData = JSON.parse(JSON.stringify(val));
            store.put({ ...cleanData, lastLocalUpdate: Date.now() }, 'LATEST');
        } catch (e) { console.warn("IDB Cache Ignored", e); }
    },
    async get() {
        try {
            const db = await this.init();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get('LATEST');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    }
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface AppState {
    activePage: Page;
    theme: Theme;
    pbUrl: string;
    connectionStatus: ConnectionStatus;
    saveStatus: SaveStatus;
    exchangeRate: number;
    products: Product[];
    transactions: Transaction[];
    customers: Customer[];
    orders: Order[];
    shipments: Shipment[];
    tasks: Task[];
    inboundShipments: InboundShipment[];
    suppliers: Supplier[];
    influencers: Influencer[];
    toasts: Toast[];
    automationRules: AutomationRule[];
    automationLogs: AutomationLog[];
    isMobileMenuOpen: boolean;
    isInitialized: boolean;
    navParams?: any;
    remoteVersion: number;
    lastSyncTime?: number;
    cloudRecordId?: string;
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
    theme: (localStorage.getItem(THEME_CACHE_KEY) as Theme) || 'quantum',
    pbUrl: '',
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], transactions: [], customers: [], orders: [], shipments: [], 
    tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
    automationRules: [], automationLogs: [], isMobileMenuOpen: false, isInitialized: false,
    remoteVersion: 0
};

type Action =
    | { type: 'BOOT'; payload: Partial<AppState> }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: any } }
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'SET_CONN'; payload: ConnectionStatus }
    | { type: 'UPDATE_DATA'; payload: Partial<AppState> }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER'; payload: Order }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'UPDATE_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'DELETE_AUTOMATION_RULE'; payload: string }
    | { type: 'ADD_AUTOMATION_LOG'; payload: AutomationLog }
    | { type: 'CLEAR_NAV_PARAMS' };

function appReducer(state: AppState, action: Action): AppState {
    let nextState = { ...state };
    const updateInArray = (arr: any[], item: any) => (arr || []).map(i => i.id === item.id ? item : i);
    const deleteInArray = (arr: any[], id: string) => (arr || []).filter(i => i.id !== id);

    switch (action.type) {
        case 'BOOT':
            nextState = { 
                ...state, 
                ...action.payload, 
                products: action.payload.products || state.products || [],
                transactions: action.payload.transactions || state.transactions || [],
                customers: action.payload.customers || state.customers || [],
                orders: action.payload.orders || state.orders || [],
                shipments: action.payload.shipments || state.shipments || [],
                isInitialized: true 
            };
            break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
            break;
        case 'SET_THEME':
            localStorage.setItem(THEME_CACHE_KEY, action.payload);
            nextState = { ...state, theme: action.payload };
            break;
        case 'SET_CONN':
            nextState = { ...state, connectionStatus: action.payload };
            break;
        case 'UPDATE_DATA':
            nextState = { ...state, ...action.payload };
            break;
        
        case 'ADD_PRODUCT': nextState = { ...state, products: [action.payload, ...(state.products || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_PRODUCT': nextState = { ...state, products: updateInArray(state.products, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_PRODUCT': nextState = { ...state, products: deleteInArray(state.products, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_TRANSACTION': nextState = { ...state, transactions: [action.payload, ...(state.transactions || [])], saveStatus: 'dirty' }; break;
        case 'DELETE_TRANSACTION': nextState = { ...state, transactions: deleteInArray(state.transactions, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_CUSTOMER': nextState = { ...state, customers: [action.payload, ...(state.customers || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_CUSTOMER': nextState = { ...state, customers: updateInArray(state.customers, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_CUSTOMER': nextState = { ...state, customers: deleteInArray(state.customers, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_SHIPMENT': nextState = { ...state, shipments: [action.payload, ...(state.shipments || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_SHIPMENT': nextState = { ...state, shipments: updateInArray(state.shipments, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_SHIPMENT': nextState = { ...state, shipments: deleteInArray(state.shipments, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_ORDER': nextState = { ...state, orders: [action.payload, ...(state.orders || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_ORDER': nextState = { ...state, orders: updateInArray(state.orders, action.payload), saveStatus: 'dirty' }; break;
        
        case 'CREATE_INBOUND_SHIPMENT': nextState = { ...state, inboundShipments: [action.payload, ...(state.inboundShipments || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_INBOUND_SHIPMENT': nextState = { ...state, inboundShipments: updateInArray(state.inboundShipments, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_INBOUND_SHIPMENT': nextState = { ...state, inboundShipments: deleteInArray(state.inboundShipments, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_SUPPLIER': nextState = { ...state, suppliers: [action.payload, ...(state.suppliers || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_SUPPLIER': nextState = { ...state, suppliers: updateInArray(state.suppliers, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_SUPPLIER': nextState = { ...state, suppliers: deleteInArray(state.suppliers, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_INFLUENCER': nextState = { ...state, influencers: [action.payload, ...(state.influencers || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_INFLUENCER': nextState = { ...state, influencers: updateInArray(state.influencers, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_INFLUENCER': nextState = { ...state, influencers: deleteInArray(state.influencers, action.payload), saveStatus: 'dirty' }; break;

        case 'ADD_TASK': nextState = { ...state, tasks: [action.payload, ...(state.tasks || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_TASK': nextState = { ...state, tasks: updateInArray(state.tasks, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_TASK': nextState = { ...state, tasks: deleteInArray(state.tasks, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_AUTOMATION_RULE': nextState = { ...state, automationRules: [action.payload, ...(state.automationRules || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_AUTOMATION_RULE': nextState = { ...state, automationRules: updateInArray(state.automationRules, action.payload), saveStatus: 'dirty' }; break;
        case 'DELETE_AUTOMATION_RULE': nextState = { ...state, automationRules: deleteInArray(state.automationRules, action.payload), saveStatus: 'dirty' }; break;
        
        case 'ADD_AUTOMATION_LOG': nextState = { ...state, automationLogs: [action.payload, ...(state.automationLogs || [])], saveStatus: 'dirty' }; break;
        
        case 'ADD_TOAST': nextState = { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] }; break;
        case 'REMOVE_TOAST': nextState = { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) }; break;
        case 'TOGGLE_MOBILE_MENU': nextState = { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen }; break;
        case 'CLEAR_NAV_PARAMS': nextState = { ...state, navParams: undefined }; break;
        default: return state;
    }
    
    if (nextState !== state) {
        idb.set(nextState);
    }
    return nextState;
}

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<any>;
    syncToCloud: (force?: boolean) => Promise<void>;
    pullFromCloud: (manual?: boolean) => Promise<void>;
    connectToPb: (url: string) => Promise<boolean>;
    showToast: (m: string, t: Toast['type']) => void;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);
    const syncTimerRef = useRef<any>(null);

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            const lastUrl = localStorage.getItem(CONFIG_KEY) || '';
            const lastTheme = localStorage.getItem(THEME_CACHE_KEY) || 'quantum';
            if (cached) {
                dispatch({ type: 'BOOT', payload: { ...cached as any, pbUrl: lastUrl, theme: lastTheme as Theme } });
            } else {
                dispatch({ 
                    type: 'BOOT', 
                    payload: { 
                        products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, 
                        customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, 
                        orders: MOCK_ORDERS, pbUrl: lastUrl, theme: lastTheme as Theme
                    } 
                });
            }
            if (lastUrl) setTimeout(() => connectToPb(lastUrl), 800);
        };
        startup();
        return () => { if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*'); };
    }, []);

    useEffect(() => {
        if (state.saveStatus === 'dirty' && state.connectionStatus === 'connected') {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(() => {
                syncToCloud(false);
            }, 2000);
        }
    }, [state.products, state.transactions, state.customers, state.orders, state.shipments, state.saveStatus]);

    const connectToPb = async (url: string): Promise<boolean> => {
        if (!url) return false;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        let cleanUrl = url.trim().startsWith('http') ? url.trim() : `http://${url.trim()}`;
        try {
            const pb = new PocketBase(cleanUrl);
            await pb.health.check();
            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'SET_CONN', payload: 'connected' });
            
            pb.collection('backups').subscribe('*', (e) => {
                if (e.action === 'update' || e.action === 'create') {
                    try {
                        const remote = JSON.parse(e.record.payload);
                        if (remote.lastUpdatedBy !== SESSION_ID) {
                            dispatch({ type: 'BOOT', payload: { ...remote, saveStatus: 'idle', lastSyncTime: Date.now(), cloudRecordId: e.record.id } });
                        }
                    } catch (err) { console.warn("Live sync payload parsing error"); }
                }
            });
            
            await pullFromCloud(false);
            return true;
        } catch (e: any) {
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') {
            if (force) showToast('同步失败：未连接云端', 'error');
            return;
        }
        try {
            const newVersion = (state.remoteVersion || 0) + 1;
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules,
                automationLogs: state.automationLogs,
                lastUpdatedBy: SESSION_ID,
                remoteVersion: newVersion,
                timestamp: Date.now()
            });

            let record = null;
            try {
                record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            } catch (err: any) {}
            
            let finalId = "";
            if (record) {
                const updated = await pbRef.current.collection('backups').update(record.id, { payload });
                finalId = updated.id;
            } else {
                const created = await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
                finalId = created.id;
            }
            
            dispatch({ type: 'UPDATE_DATA', payload: { saveStatus: 'idle', remoteVersion: newVersion, lastSyncTime: Date.now(), cloudRecordId: finalId } as any });
            if (force) showToast('资产快照已同步至云端', 'success');
        } catch (e: any) {
            console.error("Cloud push error:", e);
            if (force) showToast(`同步失败: ${e.message}`, 'error');
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ type: 'BOOT', payload: { ...data, saveStatus: 'idle', lastSyncTime: Date.now(), cloudRecordId: record.id } });
                if (manual) showToast('云端数据已成功对齐', 'success');
            }
        } catch (e: any) {
            if (manual) showToast(`拉取失败: ${e.message}`, 'error');
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, syncToCloud, pullFromCloud, connectToPb, showToast }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => {
    const context = useContext(TanxingContext);
    if (!context) throw new Error('useTanxing must be used within Provider');
    return context;
};
