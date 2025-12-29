
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import PocketBase from 'pocketbase';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AutomationRule, Supplier, Influencer, AutomationLog
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';

const DB_NAME = 'TANXING_V6_CORE';
const STORE_NAME = 'GLOBAL_STATE';
const CONFIG_KEY = 'PB_URL_NODE'; 
const PAGE_CACHE_KEY = 'TX_ACTIVE_PAGE';
// SESSION_ID 用于区分更新源，避免本地回环。如果是手动粘贴或刷新，SESSION_ID 会变，代表新的会话节点。
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
    automationLogs: AutomationLog[];
    isMobileMenuOpen: boolean;
    isInitialized: boolean;
    navParams?: any;
    remoteVersion: number;
    lastSyncTime?: number;
    cloudRecordId?: string; // 记录云端物理记录的内部 ID
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
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
    | { type: 'SET_CONN'; payload: ConnectionStatus }
    | { type: 'UPDATE_DATA'; payload: Partial<AppState> }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
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
    switch (action.type) {
        case 'BOOT':
            // 收到 BOOT 信号时，强制覆盖除了连接信息以外的所有业务数据
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
        case 'ADD_TASK':
            nextState = { ...state, tasks: [action.payload, ...state.tasks], saveStatus: 'dirty' };
            break;
        case 'UPDATE_TASK':
            nextState = { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t), saveStatus: 'dirty' };
            break;
        case 'DELETE_TASK':
            nextState = { ...state, tasks: state.tasks.filter(t => t.id !== action.payload), saveStatus: 'dirty' };
            break;
        case 'ADD_AUTOMATION_RULE':
            nextState = { ...state, automationRules: [action.payload, ...state.automationRules], saveStatus: 'dirty' };
            break;
        case 'UPDATE_AUTOMATION_RULE':
            nextState = { ...state, automationRules: state.automationRules.map(r => r.id === action.payload.id ? action.payload : r), saveStatus: 'dirty' };
            break;
        case 'DELETE_AUTOMATION_RULE':
            nextState = { ...state, automationRules: state.automationRules.filter(r => r.id !== action.payload), saveStatus: 'dirty' };
            break;
        case 'ADD_AUTOMATION_LOG':
            nextState = { ...state, automationLogs: [action.payload, ...(state.automationLogs || [])], saveStatus: 'dirty' };
            break;
        case 'ADD_TOAST':
            return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) };
    }
    if (nextState !== state) idb.set(nextState);
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
                // 如果本地存有 URL，在稍后自动尝试连接
                setTimeout(() => connectToPb(lastUrl), 800);
            }
        };
        startup();
        return () => { if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*'); };
    }, []);

    // 脏数据自动同步监听 (防抖 2s)
    useEffect(() => {
        if (state.saveStatus === 'dirty' && state.connectionStatus === 'connected') {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(() => {
                syncToCloud(false);
            }, 2000);
        }
    }, [state.products, state.transactions, state.customers, state.shipments, state.orders, state.saveStatus, state.tasks, state.automationRules]);

    const connectToPb = async (url: string): Promise<boolean> => {
        if (!url) return false;
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        
        // 自动纠正协议格式
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = `http://${cleanUrl}`;
        }

        try {
            const pb = new PocketBase(cleanUrl);
            
            // 健康检查，超时 3s
            await Promise.race([
                pb.health.check(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Node Offline")), 3000))
            ]);

            pbRef.current = pb;
            localStorage.setItem(CONFIG_KEY, cleanUrl);
            dispatch({ type: 'SET_CONN', payload: 'connected' });
            
            // 1. 订阅实时更新
            pb.collection('backups').subscribe('*', (e) => {
                if (e.action === 'update' || e.action === 'create') {
                    try {
                        const remote = JSON.parse(e.record.payload);
                        // 核心：如果是别的设备推来的更新（ID不同），或者版本号更高，则接受
                        if (remote.lastUpdatedBy !== SESSION_ID) {
                            console.log("Receiving remote sync package...", remote.remoteVersion);
                            dispatch({ 
                                type: 'BOOT', 
                                payload: { 
                                    ...remote, 
                                    saveStatus: 'idle', 
                                    lastSyncTime: Date.now(),
                                    cloudRecordId: e.record.id 
                                } 
                            });
                        }
                    } catch (err) { console.warn("Malformed sync packet ignored"); }
                }
            });

            // 2. 连接后立即尝试拉取一次
            await pullFromCloud(false);
            
            return true;
        } catch (e: any) {
            console.error("Connection link failed:", e);
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') {
            if (force) showToast('同步链路未就绪', 'error');
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

            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"').catch(() => null);
            
            if (record) {
                await pbRef.current.collection('backups').update(record.id, { payload });
            } else {
                await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload });
            }
            
            dispatch({ 
                type: 'UPDATE_DATA', 
                payload: { 
                    saveStatus: 'idle', 
                    remoteVersion: newVersion, 
                    lastSyncTime: Date.now(),
                    cloudRecordId: record?.id 
                } as any 
            });
            
            if (force) showToast('资产快照已广播至全球节点', 'success');
        } catch (e: any) {
            console.error("Push failed:", e);
            if (force) showToast(`广播失败: ${e.message}`, 'error');
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            // 获取全球唯一的资产记录
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"');
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ 
                    type: 'BOOT', 
                    payload: { 
                        ...data, 
                        saveStatus: 'idle', 
                        lastSyncTime: Date.now(),
                        cloudRecordId: record.id 
                    } 
                });
                if (manual) showToast('已强制同步云端资产', 'success');
            }
        } catch (e: any) {
            if (manual) showToast('云端尚无资产记录，请由拥有数据的电脑执行“推送”', 'warning');
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
