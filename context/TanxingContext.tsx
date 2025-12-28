
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
// 唯一的会话 ID
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
    remoteVersion?: number; // 远程版本号，用于防止旧数据覆盖新数据
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
    pbUrl: '',
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], transactions: [], customers: [], orders: [], shipments: [], 
    tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
    automationRules: [], isMobileMenuOpen: false, isInitialized: false,
    remoteVersion: 0
};

type Action =
    | { type: 'BOOT'; payload: Partial<AppState> }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: any } }
    | { type: 'SET_CONN'; payload: ConnectionStatus }
    | { type: 'UPDATE_DATA'; payload: Partial<AppState> }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    // 基础 CRUD 动作 (这些动作会触发自动云同步)
    | { type: 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT' | 'ADD_TRANSACTION' | 'DELETE_TRANSACTION' | 'ADD_CUSTOMER' | 'UPDATE_CUSTOMER' | 'DELETE_CUSTOMER' | 'ADD_SHIPMENT' | 'UPDATE_SHIPMENT' | 'DELETE_SHIPMENT' | 'ADD_INFLUENCER' | 'UPDATE_INFLUENCER' | 'DELETE_INFLUENCER' | 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'UPDATE_INBOUND_SHIPMENT' | 'CREATE_INBOUND_SHIPMENT' | 'DELETE_INBOUND_SHIPMENT' | 'ADD_SUPPLIER' | 'UPDATE_SUPPLIER' | 'DELETE_SUPPLIER' | 'ADD_AUTOMATION_RULE' | 'UPDATE_AUTOMATION_RULE' | 'DELETE_AUTOMATION_RULE', payload: any }
    | { type: 'CLEAR_NAV_PARAMS' };

function appReducer(state: AppState, action: Action): AppState {
    const ensureArrays = (s: Partial<AppState>): Partial<AppState> => {
        const keys: (keyof AppState)[] = ['products', 'transactions', 'customers', 'orders', 'shipments', 'tasks', 'inboundShipments', 'suppliers', 'influencers', 'toasts', 'automationRules'];
        keys.forEach(k => { 
            if (!s[k] || !Array.isArray(s[k])) (s as any)[k] = (state[k] && Array.isArray(state[k])) ? state[k] : []; 
        });
        return s;
    };

    let nextState = { ...state };

    switch (action.type) {
        case 'BOOT':
            return { ...state, ...ensureArrays(action.payload), isInitialized: true };
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
            break;
        case 'SET_CONN':
            return { ...state, connectionStatus: action.payload };
        case 'UPDATE_DATA':
            nextState = { ...state, ...ensureArrays(action.payload), saveStatus: 'dirty' };
            break;
        case 'ADD_TOAST':
            return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        case 'TOGGLE_MOBILE_MENU':
            return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'CLEAR_NAV_PARAMS':
            return { ...state, navParams: undefined };
        
        // 动态处理所有增删改动作
        default:
            // Fix: Narrow action type before accessing payload to satisfy TS compiler
            const crudAction = action as { type: string; payload: any };
            if (crudAction.type.includes('ADD_')) {
                const key = (crudAction.type.split('_')[1].toLowerCase() + 's').replace('influencerss', 'influencers').replace('shipmentss', 'shipments').replace('automation_rules', 'automationRules') as keyof AppState;
                if (Array.isArray(state[key])) {
                    (nextState as any)[key] = [crudAction.payload, ...(state[key] as any[])];
                    nextState.saveStatus = 'dirty';
                }
            } else if (crudAction.type.includes('UPDATE_')) {
                const key = (crudAction.type.split('_')[1].toLowerCase() + 's').replace('influencerss', 'influencers').replace('shipmentss', 'shipments').replace('inbounds', 'inboundShipments').replace('automation_rules', 'automationRules') as keyof AppState;
                if (Array.isArray(state[key])) {
                    (nextState as any)[key] = (state[key] as any[]).map(i => i.id === crudAction.payload.id ? crudAction.payload : i);
                    nextState.saveStatus = 'dirty';
                }
            } else if (crudAction.type.includes('DELETE_')) {
                const key = (crudAction.type.split('_')[1].toLowerCase() + 's').replace('influencerss', 'influencers').replace('shipmentss', 'shipments').replace('automation_rules', 'automationRules') as keyof AppState;
                if (Array.isArray(state[key])) {
                    (nextState as any)[key] = (state[key] as any[]).filter(i => i.id !== crudAction.payload);
                    nextState.saveStatus = 'dirty';
                }
            }
            break;
    }

    if (nextState !== state) {
        idb.set(nextState);
    }
    return nextState;
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
    const syncTimerRef = useRef<any>(null);

    // 1. 启动初始化
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
            if (lastUrl) connectToPb(lastUrl);
        };
        startup();
        return () => { if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*'); };
    }, []);

    // 2. 核心：动作监听与自动同步 (像飞书一样自动保存)
    useEffect(() => {
        if (state.saveStatus === 'dirty' && state.connectionStatus === 'connected') {
            // 防抖处理：停止操作 1 秒后自动同步
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(() => {
                syncToCloud(false);
            }, 1000);
        }
    }, [state.products, state.transactions, state.customers, state.shipments, state.influencers, state.orders, state.tasks]);

    const connectToPb = async (url: string): Promise<boolean> => {
        if (!url) return false;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `http://${url.trim()}`;
        
        try {
            const pb = new PocketBase(cleanUrl);
            await pb.health.check();
            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'SET_CONN', payload: 'connected' });

            // 订阅逻辑：监听他人修改
            pb.collection('backups').subscribe('*', (e) => {
                if (e.action === 'update' || e.action === 'create') {
                    try {
                        const remoteData = JSON.parse(e.record.payload);
                        // 关键：如果更新源不是我自己，立刻热更新视图
                        if (remoteData.lastUpdatedBy !== SESSION_ID) {
                            console.log("接收到来自另一台设备的同步信号...");
                            dispatch({ type: 'BOOT', payload: { ...remoteData, pbUrl: cleanUrl } });
                        }
                    } catch (err) { console.error("解析远程协议失败", err); }
                }
            });

            // 连上后先拉一次
            pullFromCloud(false);
            return true;
        } catch (e) {
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') return;
        try {
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules,
                lastUpdatedBy: SESSION_ID,
                timestamp: Date.now()
            });

            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"').catch(() => null);
            if (record) {
                await pbRef.current.collection('backups').update(record.id, { payload });
            } else {
                await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
            }
            if (force) showToast('量子云端镜像已固化', 'success');
            // 同步完后标记为已保存
            dispatch({ type: 'BOOT', payload: { saveStatus: 'idle' } as any });
        } catch (e) {
            if (force) showToast('同步链路故障', 'error');
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ type: 'BOOT', payload: { ...data, saveStatus: 'idle' } });
                if (manual) showToast('已从云端拉取最新快照', 'success');
            }
        } catch (e) {
            if (manual) showToast('云端尚无资产快照', 'warning');
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
