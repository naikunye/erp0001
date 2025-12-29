
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import PocketBase from 'pocketbase';
import { 
    Product, Transaction, Toast, Customer, Shipment, Task, Page, 
    InboundShipment, Order, AutomationRule, Supplier, Influencer, AutomationLog, Theme, AuditLog
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';
import { GoogleGenAI } from "@google/genai";
import { sendMessageToBot } from '../utils/feishu';

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
    auditLogs: AuditLog[];
    isMobileMenuOpen: boolean;
    isInitialized: boolean;
    navParams?: any;
    remoteVersion: number;
    lastSyncTime?: number;
    cloudRecordId?: string;
    lastLogisticsCheck?: number;
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
    theme: (localStorage.getItem(THEME_CACHE_KEY) as Theme) || 'quantum',
    pbUrl: '',
    connectionStatus: 'disconnected', saveStatus: 'idle', exchangeRate: 7.2,
    products: [], transactions: [], customers: [], orders: [], shipments: [], 
    tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
    automationRules: [], automationLogs: [], auditLogs: [], isMobileMenuOpen: false, isInitialized: false,
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
    | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
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
                auditLogs: action.payload.auditLogs || state.auditLogs || [],
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
        case 'ADD_AUDIT_LOG': nextState = { ...state, auditLogs: [action.payload, ...(state.auditLogs || [])], saveStatus: 'dirty' }; break;
        
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
    performLogisticsSentry: (manual?: boolean) => Promise<void>;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);
    const syncTimerRef = useRef<any>(null);
    const sentryTimerRef = useRef<any>(null);

    // --- 核心：物理哨兵逻辑（已升级 Google Search 工具） ---
    const performLogisticsSentry = async (manual: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        const autoEnabled = localStorage.getItem('TX_FEISHU_AUTO') === 'true';
        
        if (!webhookUrl && !manual) return;
        if (!webhookUrl && manual) {
            showToast('请先配置飞书 Webhook 接收节点', 'warning');
            return;
        }

        // 查找待处理、运输中、异常的单据，不再严格限制 UPS，让 AI 决定是否能查
        const targets = (state.shipments || []).filter(s => 
            s.status === '运输中' || s.status === '异常' || s.status === '待同步' || s.status === '待处理'
        );

        if (targets.length === 0) {
            if (manual) showToast('当前对账矩阵中未发现活动单据', 'info');
            return;
        }

        if (manual) showToast('正在启动 AI 引擎并接入 Google Search 实时链路...', 'info');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = targets.map(s => `[${s.carrier || '未知'}] 单号: ${s.trackingNo}`).join(', ');
            
            const prompt = `
                你现在是探行 ERP 全球物流哨兵。
                请利用 Google Search 联网查询以下单据的最新物流轨迹状态：
                ${context}

                要求：
                1. 优先核实 UPS (1Z开头) 的状态。
                2. 总结每个单据的当前地理位置和最后动作（如：Arrival Scan, Out for Delivery）。
                3. 用中文输出精简报文。
                4. 如果查询不到，请基于系统中已有的 events 描述给出预测。
            `;

            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }] // 开启搜索能力，无需 UPS API Key
                }
            });

            if (response.text) {
                const sendRes = await sendMessageToBot(webhookUrl!, '全球轨迹巡检报告', response.text);
                if (sendRes.success) {
                    dispatch({ type: 'UPDATE_DATA', payload: { lastLogisticsCheck: Date.now() } as any });
                    if (manual) showToast('实时对账报文已同步至移动端', 'success');
                } else {
                    if (manual) showToast('飞书机器人拒收报文，请检查 URL', 'error');
                }
            }
        } catch (e: any) {
            console.error("Logistics Sentry Error:", e);
            if (manual) showToast(`对账中断: ${e.message || 'AI 引擎响应异常'}`, 'error');
        }
    };

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

        sentryTimerRef.current = setInterval(() => { performLogisticsSentry(false); }, 10800000); 

        return () => { 
            if (pbRef.current) pbRef.current.collection('backups').unsubscribe('*'); 
            clearInterval(sentryTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (state.saveStatus === 'dirty' && state.connectionStatus === 'connected') {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(() => { syncToCloud(false); }, 2000);
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
                    } catch (err) { console.warn("Live sync error"); }
                }
            }, { requestKey: null }); 
            
            await pullFromCloud(false);
            return true;
        } catch (e: any) {
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    const syncToCloud = async (force: boolean = false) => {
        if (!pbRef.current || state.connectionStatus !== 'connected') {
            if (force) showToast('同步失败：量子链路未连接', 'error');
            return;
        }
        try {
            const newVersion = (state.remoteVersion || 0) + 1;
            const payload = JSON.stringify({
                products: state.products, transactions: state.transactions,
                customers: state.customers, orders: state.orders, shipments: state.shipments,
                influencers: state.influencers, tasks: state.tasks, suppliers: state.suppliers,
                inboundShipments: state.inboundShipments, automationRules: state.automationRules,
                automationLogs: state.automationLogs, auditLogs: state.auditLogs,
                lastUpdatedBy: SESSION_ID,
                remoteVersion: newVersion,
                timestamp: Date.now()
            });

            let record = null;
            try {
                record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"', { requestKey: null });
            } catch (err: any) {}
            
            let finalId = "";
            if (record) {
                const updated = await pbRef.current.collection('backups').update(record.id, { payload }, { requestKey: null });
                finalId = updated.id;
            } else {
                const created = await pbRef.current.collection('backups').create({ unique_id: 'GLOBAL_V1', payload }, { requestKey: null });
                finalId = created.id;
            }
            
            dispatch({ type: 'UPDATE_DATA', payload: { saveStatus: 'idle', remoteVersion: newVersion, lastSyncTime: Date.now(), cloudRecordId: finalId } as any });
            if (force) showToast('全域资产协议已激活并同步至云端', 'success');
        } catch (e: any) {
            console.error("Cloud push error:", e);
            if (force) showToast(`资产对齐失败: ${e.message}`, 'error');
        }
    };

    const pullFromCloud = async (manual: boolean = false) => {
        if (!pbRef.current) return;
        try {
            const record = await pbRef.current.collection('backups').getFirstListItem('unique_id="GLOBAL_V1"', { requestKey: null });
            if (record?.payload) {
                const data = JSON.parse(record.payload);
                dispatch({ type: 'BOOT', payload: { ...data, saveStatus: 'idle', lastSyncTime: Date.now(), cloudRecordId: record.id } });
                if (manual) showToast('云端协议已成功加载', 'success');
            }
        } catch (e: any) {
            if (manual) showToast(`拉取失败: ${e.message}`, 'error');
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, syncToCloud, pullFromCloud, connectToPb, showToast, performLogisticsSentry }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => {
    const context = useContext(TanxingContext);
    if (!context) throw new Error('useTanxing must be used within Provider');
    return context;
};
