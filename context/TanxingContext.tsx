
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import PocketBase from 'pocketbase';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AutomationRule, Supplier, Influencer
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';

const DB_NAME = 'TANXING_V6_CORE';
const STORE_NAME = 'GLOBAL_STATE';
const CONFIG_KEY = 'PB_URL_NODE'; 
export const SESSION_ID = 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 5);
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
            store.put(cleanData, 'LATEST');
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
    isMobileMenuOpen: boolean;
    isInitialized: boolean;
    navParams?: any;
}

const initialState: AppState = {
    activePage: 'dashboard', pbUrl: '',
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], transactions: [], customers: [], orders: [], shipments: [], 
    tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
    automationRules: [], isMobileMenuOpen: false, isInitialized: false
};

type Action =
    | { type: 'BOOT'; payload: Partial<AppState> }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: any } }
    | { type: 'SET_CONN'; payload: ConnectionStatus }
    | { type: 'UPDATE_DATA'; payload: Partial<AppState> }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTION'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'UPDATE_AUTOMATION_RULE'; payload: AutomationRule }
    | { type: 'DELETE_AUTOMATION_RULE'; payload: string }
    | { type: 'CLEAR_NAV_PARAMS' };

function appReducer(state: AppState, action: Action): AppState {
    const ensureArrays = (s: Partial<AppState>): Partial<AppState> => {
        const keys: (keyof AppState)[] = ['products', 'transactions', 'customers', 'orders', 'shipments', 'tasks', 'inboundShipments', 'suppliers', 'influencers', 'toasts', 'automationRules'];
        keys.forEach(k => { 
            if (!s[k] || !Array.isArray(s[k])) (s as any)[k] = (state[k] && Array.isArray(state[k])) ? state[k] : []; 
        });
        return s;
    };

    const safeUpdate = (updates: Partial<AppState>): AppState => {
        const next = { ...state, ...ensureArrays(updates), isInitialized: true };
        idb.set(next);
        return next;
    };

    switch (action.type) {
        case 'BOOT': return safeUpdate(action.payload);
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
        case 'SET_CONN': return { ...state, connectionStatus: action.payload };
        case 'UPDATE_DATA': return safeUpdate({ ...action.payload, saveStatus: 'dirty' });
        case 'ADD_TOAST': return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'ADD_PRODUCT': return safeUpdate({ products: [action.payload, ...(state.products || [])] });
        case 'UPDATE_PRODUCT': return safeUpdate({ products: (state.products || []).map(p => p.id === action.payload.id ? action.payload : p) });
        case 'DELETE_PRODUCT': return safeUpdate({ products: (state.products || []).filter(p => p.id !== action.payload) });
        case 'ADD_TRANSACTION': return safeUpdate({ transactions: [action.payload, ...(state.transactions || [])] });
        case 'DELETE_TRANSACTION': return safeUpdate({ transactions: (state.transactions || []).filter(t => t.id !== action.payload) });
        case 'ADD_SHIPMENT': return safeUpdate({ shipments: [action.payload, ...(state.shipments || [])] });
        case 'UPDATE_SHIPMENT': return safeUpdate({ shipments: (state.shipments || []).map(s => s.id === action.payload.id ? action.payload : s) });
        case 'DELETE_SHIPMENT': return safeUpdate({ shipments: (state.shipments || []).filter(s => s.id !== action.payload) });
        case 'ADD_CUSTOMER': return safeUpdate({ customers: [action.payload, ...(state.customers || [])] });
        case 'UPDATE_CUSTOMER': return safeUpdate({ customers: (state.customers || []).map(c => c.id === action.payload.id ? action.payload : c) });
        case 'DELETE_CUSTOMER': return safeUpdate({ customers: (state.customers || []).filter(c => c.id !== action.payload) });
        case 'ADD_INFLUENCER': return safeUpdate({ influencers: [action.payload, ...(state.influencers || [])] });
        case 'UPDATE_INFLUENCER': return safeUpdate({ influencers: (state.influencers || []).map(i => i.id === action.payload.id ? action.payload : i) });
        case 'DELETE_INFLUENCER': return safeUpdate({ influencers: (state.influencers || []).filter(i => i.id !== action.payload) });
        case 'ADD_TASK': return safeUpdate({ tasks: [action.payload, ...(state.tasks || [])] });
        case 'UPDATE_TASK': return safeUpdate({ tasks: (state.tasks || []).map(t => t.id === action.payload.id ? action.payload : t) });
        case 'DELETE_TASK': return safeUpdate({ tasks: (state.tasks || []).filter(t => t.id !== action.payload) });
        case 'CREATE_INBOUND_SHIPMENT': return safeUpdate({ inboundShipments: [action.payload, ...(state.inboundShipments || [])] });
        case 'UPDATE_INBOUND_SHIPMENT': return safeUpdate({ inboundShipments: (state.inboundShipments || []).map(i => i.id === action.payload.id ? action.payload : i) });
        case 'DELETE_INBOUND_SHIPMENT': return safeUpdate({ inboundShipments: (state.inboundShipments || []).filter(i => i.id !== action.payload) });
        case 'ADD_SUPPLIER': return safeUpdate({ suppliers: [action.payload, ...(state.suppliers || [])] });
        case 'UPDATE_SUPPLIER': return safeUpdate({ suppliers: (state.suppliers || []).map(s => s.id === action.payload.id ? action.payload : s) });
        case 'DELETE_SUPPLIER': return safeUpdate({ suppliers: (state.suppliers || []).filter(s => s.id !== action.payload) });
        case 'ADD_AUTOMATION_RULE': return safeUpdate({ automationRules: [action.payload, ...(state.automationRules || [])] });
        case 'UPDATE_AUTOMATION_RULE': return safeUpdate({ automationRules: (state.automationRules || []).map(r => r.id === action.payload.id ? action.payload : r) });
        case 'DELETE_AUTOMATION_RULE': return safeUpdate({ automationRules: (state.automationRules || []).filter(r => r.id !== action.payload) });
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: undefined };
        default: return state;
    }
}

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    syncToCloud: (force?: boolean) => Promise<void>;
    pullFromCloud: (manual?: boolean) => Promise<void>;
    connectToPb: (url: string) => Promise<void>;
    showToast: (m: string, t: Toast['type']) => void;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);
    const healthCheckInterval = useRef<any>(null);

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            const lastUrl = localStorage.getItem(CONFIG_KEY) || '';
            
            if (cached) {
                dispatch({ type: 'BOOT', payload: { ...cached as any, pbUrl: lastUrl } });
            } else {
                dispatch({ 
                    type: 'BOOT', 
                    payload: { 
                        products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, 
                        customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, 
                        orders: MOCK_ORDERS, pbUrl: lastUrl
                    } 
                });
            }
            if (lastUrl) {
                connectToPb(lastUrl).catch(() => console.log("Init node offline."));
            }
        };
        startup();
        
        healthCheckInterval.current = setInterval(() => {
            if (pbRef.current) {
                pbRef.current.health.check()
                    .then(() => { if(state.connectionStatus !== 'connected') dispatch({type: 'SET_CONN', payload: 'connected'}); })
                    .catch(() => { if(state.connectionStatus === 'connected') dispatch({type: 'SET_CONN', payload: 'error'}); });
            }
        }, 30000);

        return () => clearInterval(healthCheckInterval.current);
    }, [state.connectionStatus]);

    const connectToPb = async (url: string) => {
        if (!url) return;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        try {
            const cleanUrl = url.trim().startsWith('http') ? url.trim() : `http://${url.trim()}`;
            const pb = new PocketBase(cleanUrl);
            
            // 检查 HTTPS 页面连接 HTTP 服务器的问题 (Mixed Content)
            if (window.location.protocol === 'https:' && cleanUrl.startsWith('http:')) {
                showToast('安全冲突：HTTPS 网页无法连接 HTTP 数据库。请尝试使用 HTTP 访问 ERP 或为数据库配置 SSL。', 'error');
                dispatch({ type: 'SET_CONN', payload: 'error' });
                return;
            }

            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connect Timeout')), 5000));
            await Promise.race([pb.health.check(), timeoutPromise]);
            
            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'UPDATE_DATA', payload: { pbUrl: cleanUrl } });
            dispatch({ type: 'SET_CONN', payload: 'connected' });
        } catch (e: any) {
            dispatch({ type: 'SET_CONN', payload: 'error' });
            if (e.message.includes('Failed to fetch')) {
                showToast('连接失败：网络无法连通或 CORS 跨域被拦截。请检查 8090 端口和防火墙。', 'error');
            } else {
                showToast(`连接异常: ${e.message}`, 'error');
            }
            throw e;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') {
            if (force) showToast('量子链路断开，无法同步', 'error');
            return;
        }
        try {
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules
            });
            
            // 尝试获取现有记录
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"').catch(() => null);
            
            if (record) {
                await pbRef.current.collection('backups').update(record.id, { payload });
            } else {
                await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
            }
            if (force) showToast('云端同步成功', 'success');
        } catch (e: any) {
            console.error("Sync Error", e);
            if (e.status === 404 || e.status === 400) {
                showToast('同步失败：请确认已在数据库创建 backups 集合', 'error');
            } else if (e.status === 403) {
                showToast('权限拒绝：请在 backups 集合中清空 API Rules 规则', 'error');
            } else if (force) {
                showToast('同步失败：链路不稳定', 'error');
            }
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record && record.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ type: 'BOOT', payload: data });
                if (manual) showToast('已从云端拉取最新快照', 'success');
            }
        } catch (e: any) {
            if (manual) {
                if (e.status === 404) showToast('获取失败：数据库 backups 表不存在', 'error');
                else if (e.status === 403) showToast('获取失败：请检查 backups 表的 List 权限', 'error');
                else showToast('云端暂无存档', 'warning');
            }
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
