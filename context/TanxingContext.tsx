
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
const PAGE_CACHE_KEY = 'TX_ACTIVE_PAGE';
// 唯一的会话 ID，用于识别是谁更新了数据
export const SESSION_ID = 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 6);
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
    lastUpdatedBy?: string; // 记录最后一次是谁更新的
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
    pbUrl: '',
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

    switch (action.type) {
        case 'BOOT': {
            const currentCachePage = localStorage.getItem(PAGE_CACHE_KEY) as Page;
            return { 
                ...state, 
                ...ensureArrays(action.payload), 
                activePage: currentCachePage || state.activePage || 'dashboard',
                isInitialized: true 
            };
        }
        case 'NAVIGATE': {
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            const nextState = { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
            idb.set(nextState);
            return nextState;
        }
        case 'SET_CONN': return { ...state, connectionStatus: action.payload };
        case 'UPDATE_DATA': {
            const next = { 
                ...state, 
                ...ensureArrays(action.payload), 
                activePage: state.activePage,
                saveStatus: 'dirty' as SaveStatus
            };
            idb.set(next);
            return next;
        }
        case 'ADD_TOAST': return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        default: {
            if (action.type.includes('ADD_') || action.type.includes('UPDATE_') || action.type.includes('DELETE_')) {
                // 处理具体的 CRUD 操作，确保不丢失 activePage
                const s = { ...state, activePage: state.activePage };
                idb.set(s);
                return s;
            }
            return state;
        }
    }
}

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    syncToCloud: (force?: boolean) => Promise<void>;
    pullFromCloud: (manual?: boolean) => Promise<void>;
    connectToPb: (url: string) => Promise<boolean>;
    showToast: (m: string, t: Toast['type']) => void;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);

    // 启动初始化逻辑
    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            const lastUrl = localStorage.getItem(CONFIG_KEY) || '';
            const lastPage = localStorage.getItem(PAGE_CACHE_KEY) as Page;
            
            if (cached) {
                dispatch({ type: 'BOOT', payload: { ...cached as any, pbUrl: lastUrl, activePage: lastPage || (cached as any).activePage } });
            } else {
                dispatch({ 
                    type: 'BOOT', 
                    payload: { 
                        products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, 
                        customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, 
                        orders: MOCK_ORDERS, pbUrl: lastUrl,
                        activePage: lastPage || 'dashboard'
                    } 
                });
            }
            if (lastUrl) {
                connectToPb(lastUrl).catch(() => {});
            }
        };
        startup();

        // 组件销毁时取消订阅
        return () => {
            if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*');
        };
    }, []);

    // 核心功能：建立连接并开启实时监听
    const connectToPb = async (url: string): Promise<boolean> => {
        if (!url) return false;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `http://${url.trim()}`;

        try {
            const pb = new PocketBase(cleanUrl);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connect Timeout')), 5000));
            
            await Promise.race([pb.health.check(), timeoutPromise]);
            
            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'UPDATE_DATA', payload: { pbUrl: cleanUrl } });
            dispatch({ type: 'SET_CONN', payload: 'connected' });

            // --- 实时订阅核心：一旦连上，就开始听 ---
            pb.collection('backups').subscribe('*', (e) => {
                if (e.action === 'update' || e.action === 'create') {
                    const record = e.record;
                    const remotePayload = JSON.parse(record.payload);
                    
                    // 只有当这条数据的 sessionId 不是我自己时，才强制拉取（防止无限循环）
                    if (remotePayload.lastUpdatedBy !== SESSION_ID) {
                        console.log("检测到远程同步信号，正在对齐网格...");
                        dispatch({ type: 'BOOT', payload: { ...remotePayload, activePage: state.activePage } });
                    }
                }
            });

            // 连上后立刻拉取一次最新数据，确保开机同步
            pullFromCloud(false);

            return true;
        } catch (e: any) {
            console.error("Link Failed:", e);
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    // 核心功能：推送到云端（带上会话 ID）
    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') return;
        try {
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules,
                lastUpdatedBy: SESSION_ID // 盖上戳，告诉别人是我更新的
            });

            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"').catch(() => null);
            if (record) {
                await pbRef.current.collection('backups').update(record.id, { payload });
            } else {
                await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
            }
            if (force) showToast('量子云端镜像已固化', 'success');
        } catch (e: any) {
            if (force) showToast('同步链路故障', 'error');
        }
    };

    // 核心功能：主动从云端拉取
    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ type: 'BOOT', payload: { ...data, activePage: state.activePage } });
                if (manual) showToast('已从云端拉取最新快照', 'success');
            }
        } catch (e: any) {
            if (manual) showToast('获取失败：云端尚无资产快照', 'warning');
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
