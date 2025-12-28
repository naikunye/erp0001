
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
// 唯一的会话 ID，每次刷新都会变，用于识别“是谁发起的更新”
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
    remoteVersion: number; // 增加逻辑版本号
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
    | { type: 'CRUD_ACTION'; payload: Partial<AppState> } // 统一的 CRUD 动作
    | { type: 'CLEAR_NAV_PARAMS' };

function appReducer(state: AppState, action: Action): AppState {
    let nextState = { ...state };

    switch (action.type) {
        case 'BOOT':
            return { ...state, ...action.payload, isInitialized: true };
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
            break;
        case 'SET_CONN':
            return { ...state, connectionStatus: action.payload };
        case 'UPDATE_DATA':
            nextState = { ...state, ...action.payload };
            break;
        case 'CRUD_ACTION':
            // 只要发生了增删改，就把状态标记为 dirty，触发自动上传
            nextState = { ...state, ...action.payload, saveStatus: 'dirty' };
            break;
        case 'ADD_TOAST':
            return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
        default:
            // 劫持所有的 ADD/UPDATE/DELETE 动作
            if (action.type.startsWith('ADD_') || action.type.startsWith('UPDATE_') || action.type.startsWith('DELETE_')) {
                // @ts-ignore
                nextState = { ...state, saveStatus: 'dirty' };
            }
            break;
    }

    if (nextState !== state) idb.set(nextState);
    return nextState;
}

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<any>; // 简化 dispatch 类型以支持动态 action
    syncToCloud: (force?: boolean) => Promise<void>;
    pullFromCloud: (manual?: boolean) => Promise<void>;
    connectToPb: (url: string) => Promise<boolean>;
    showToast: (m: string, t: Toast['type']) => void;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);
    const syncTimerRef = useRef<any>(null);

    // 1. 初始化系统
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
            // 延迟连接，确保初始化完成
            if (lastUrl) setTimeout(() => connectToPb(lastUrl), 500);
        };
        startup();
        return () => { if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*'); };
    }, []);

    // 2. 像飞书一样自动同步：只要数据变了（dirty），就推送到云端
    useEffect(() => {
        if (state.saveStatus === 'dirty' && state.connectionStatus === 'connected') {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(() => {
                syncToCloud(false);
            }, 1500); // 停止操作 1.5 秒后同步
        }
    }, [state.products, state.transactions, state.customers, state.shipments, state.orders, state.tasks, state.saveStatus]);

    const connectToPb = async (url: string): Promise<boolean> => {
        if (!url) return false;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `http://${url.trim()}`;
        
        try {
            const pb = new PocketBase(cleanUrl);
            // 5秒强制超时，防止一直转圈
            const health = await Promise.race([
                pb.health.check(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
            ]);

            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'SET_CONN', payload: 'connected' });

            // 监听远程广播
            pb.collection('backups').subscribe('*', (e) => {
                if (e.action === 'update' || e.action === 'create') {
                    try {
                        const remote = JSON.parse(e.record.payload);
                        // 关键：只有当远程版本比我新，且更新者不是我时，才更新本地
                        if (remote.lastUpdatedBy !== SESSION_ID) {
                            console.log("收到远程节点指令，正在执行原子对齐...");
                            dispatch({ type: 'BOOT', payload: { ...remote, saveStatus: 'idle' } });
                        }
                    } catch (err) { console.warn("协议解析异常"); }
                }
            }, { /* realtime options */ });

            pullFromCloud(false);
            return true;
        } catch (e: any) {
            console.error("Link Failed:", e);
            dispatch({ type: 'SET_CONN', payload: 'error' });
            showToast('无法连接到腾讯云节点：请检查防火墙端口(8090)或允许浏览器访问不安全内容', 'error');
            return false;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') return;
        try {
            const newVersion = state.remoteVersion + 1;
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules,
                lastUpdatedBy: SESSION_ID,
                remoteVersion: newVersion,
                timestamp: Date.now()
            });

            // 查找或创建同步记录
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"').catch(() => null);
            if (record) {
                await pbRef.current.collection('backups').update(record.id, { payload });
            } else {
                await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
            }
            
            dispatch({ type: 'UPDATE_DATA', payload: { saveStatus: 'idle', remoteVersion: newVersion } as any });
            if (force) showToast('量子快照已广播至全网', 'success');
        } catch (e) {
            console.error("Sync Failed", e);
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                if (data.remoteVersion >= state.remoteVersion) {
                    dispatch({ type: 'BOOT', payload: { ...data, saveStatus: 'idle' } });
                    if (manual) showToast('数据已与云端同步', 'success');
                }
            }
        } catch (e) {
            if (manual) showToast('云端尚无同步协议', 'warning');
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
