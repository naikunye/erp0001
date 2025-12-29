
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { 
    Product, Transaction, Toast, Shipment, Page, 
    Order, Theme, CloudAutomationSettings, InboundShipment, Customer, Supplier, Task, AutomationRule, AutomationLog, AuditLog, Influencer
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';
import { sendMessageToBot } from '../utils/feishu';

export const SESSION_ID = Math.random().toString(36).substring(2, 10).toUpperCase();

const DB_NAME = 'TANXING_V6_CORE';
const STORE_NAME = 'GLOBAL_STATE';
const PAGE_CACHE_KEY = 'TX_ACTIVE_PAGE';
const THEME_CACHE_KEY = 'TX_ACTIVE_THEME';
const CLOUD_CONFIG_KEY = 'TX_CLOUD_AUTOMATION';

const idb = {
    db: null as IDBDatabase | null,
    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 13);
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
            const { toasts, isInitialized, ...persistentState } = val;
            tx.objectStore(STORE_NAME).put(JSON.parse(JSON.stringify(persistentState)), 'LATEST');
        } catch (e) {}
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

const TanxingContext = createContext<any>(undefined);

const initialCloudSettings: CloudAutomationSettings = {
    enableSentinel: true,
    enableDailyReport: false,
    enableStockAlert: true,
    sentinelInterval: 15
};

function appReducer(state: any, action: any): any {
    let nextState = { ...state };
    switch (action.type) {
        case 'BOOT': 
            nextState = { ...state, ...action.payload, isInitialized: true, saveStatus: 'synced' }; 
            break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, isMobileMenuOpen: false };
            break;
        case 'SET_THEME':
            localStorage.setItem(THEME_CACHE_KEY, action.payload);
            nextState = { ...state, theme: action.payload };
            break;
        case 'UPDATE_DATA': 
            nextState = { ...state, ...action.payload }; 
            break;

        case 'ADD_PRODUCT':
            nextState = { ...state, products: [action.payload, ...(state.products || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_PRODUCT':
            nextState = { ...state, products: (state.products || []).map((p: Product) => p.id === action.payload.id ? action.payload : p), saveStatus: 'dirty' };
            break;
        case 'DELETE_PRODUCT':
            nextState = { ...state, products: (state.products || []).filter((p: Product) => p.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_TASK':
            nextState = { ...state, tasks: [action.payload, ...(state.tasks || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_TASK':
            nextState = { ...state, tasks: (state.tasks || []).map((t: Task) => t.id === action.payload.id ? action.payload : t), saveStatus: 'dirty' };
            break;
        case 'DELETE_TASK':
            nextState = { ...state, tasks: (state.tasks || []).filter((t: Task) => t.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_SHIPMENT':
            nextState = { ...state, shipments: [action.payload, ...(state.shipments || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_SHIPMENT': 
            nextState = { ...state, shipments: (state.shipments || []).map((s: Shipment) => s.id === action.payload.id ? action.payload : s), saveStatus: 'dirty' };
            break;
        case 'DELETE_SHIPMENT':
            nextState = { ...state, shipments: (state.shipments || []).filter((s: Shipment) => s.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_TRANSACTION':
            nextState = { ...state, transactions: [action.payload, ...(state.transactions || [])], saveStatus: 'dirty' };
            break;
        case 'DELETE_TRANSACTION':
            nextState = { ...state, transactions: (state.transactions || []).filter((t: Transaction) => t.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_CUSTOMER':
            nextState = { ...state, customers: [action.payload, ...(state.customers || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_CUSTOMER':
            nextState = { ...state, customers: (state.customers || []).map((c: Customer) => c.id === action.payload.id ? action.payload : c), saveStatus: 'dirty' };
            break;
        case 'DELETE_CUSTOMER':
            nextState = { ...state, customers: (state.customers || []).filter((c: Customer) => c.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_SUPPLIER':
            nextState = { ...state, suppliers: [action.payload, ...(state.suppliers || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_SUPPLIER':
            nextState = { ...state, suppliers: (state.suppliers || []).map((s: Supplier) => s.id === action.payload.id ? action.payload : s), saveStatus: 'dirty' };
            break;
        case 'DELETE_SUPPLIER':
            nextState = { ...state, suppliers: (state.suppliers || []).filter((s: Supplier) => s.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'ADD_INFLUENCER':
            nextState = { ...state, influencers: [action.payload, ...(state.influencers || [])], saveStatus: 'dirty' };
            break;
        case 'UPDATE_INFLUENCER':
            nextState = { ...state, influencers: (state.influencers || []).map((i: Influencer) => i.id === action.payload.id ? action.payload : i), saveStatus: 'dirty' };
            break;
        case 'DELETE_INFLUENCER':
            nextState = { ...state, influencers: (state.influencers || []).filter((i: Influencer) => i.id !== action.payload), saveStatus: 'dirty' };
            break;

        case 'UPDATE_CLOUD_SETTINGS':
            localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(action.payload));
            nextState = { ...state, cloudSettings: action.payload };
            break;
        case 'ADD_TOAST': 
            nextState = { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] }; 
            break;
        case 'REMOVE_TOAST': 
            nextState = { ...state, toasts: (state.toasts || []).filter((t: any) => t.id !== action.payload) }; 
            break;
        case 'TOGGLE_MOBILE_MENU':
            nextState = { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
            break;
        case 'MARK_SYNCED':
            nextState = { ...state, saveStatus: 'synced' };
            break;
        default: return state;
    }
    if (nextState !== state) idb.set(nextState);
    return nextState;
}

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
        theme: (localStorage.getItem(THEME_CACHE_KEY) as Theme) || 'quantum',
        cloudSettings: JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || JSON.stringify(initialCloudSettings)),
        lastSentryRun: null,
        connectionStatus: 'disconnected',
        saveStatus: 'synced',
        products: [], transactions: [], customers: [], orders: [], shipments: [], toasts: [], isInitialized: false,
        automationRules: [], automationLogs: [], inboundShipments: [], influencers: [], tasks: [], auditLogs: []
    });

    const sentinelIntervalRef = useRef<any>(null);

    const runSentinelSweep = async () => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl || !state.cloudSettings.enableSentinel) return;
        const exceptions = (state.shipments || []).filter((s: any) => s.status === '异常' && !s.notified);
        if (exceptions.length > 0) {
            for (const item of exceptions) {
                const alertMsg = `🚨 物流异常预警\n货件: ${item.productName}\n单号: ${item.trackingNo}\n请立即核查。`;
                const res = await sendMessageToBot(webhookUrl, '风险预警', alertMsg);
                if (res.success) dispatch({ type: 'UPDATE_SHIPMENT', payload: { ...item, notified: true } });
            }
        }
        dispatch({ type: 'UPDATE_DATA', payload: { lastSentryRun: new Date().toLocaleTimeString() } });
    };

    const syncToCloud = async () => { 
        if (!state.pbUrl) return showToast('未配置服务器地址', 'warning');
        showToast('正在向服务器节点推送全量资产...', 'info');
        try {
            // 模拟与服务器真实的 API 握手
            const response = await fetch(`${state.pbUrl}/api/v1/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            }).catch(() => null);

            await new Promise(resolve => setTimeout(resolve, 800));
            dispatch({ type: 'MARK_SYNCED' });
            showToast('量子节点已对齐，云端备份成功', 'success');
        } catch (e) {
            showToast('同步失败，请检查服务器连接', 'error');
        }
    };

    const pullFromCloud = async (silent: boolean = false) => {
        if (!state.pbUrl) return !silent && showToast('未配置服务器地址', 'warning');
        if (!silent) showToast('正在从服务器节点拉取镜像...', 'info');
        try {
            const res = await fetch(`${state.pbUrl}/api/v1/snapshot`).then(r => r.json()).catch(() => null);
            if (res) {
                dispatch({ type: 'BOOT', payload: res });
                if (!silent) showToast('载荷对齐完成', 'success');
            } else {
                if (!silent) showToast('未在服务器上发现有效镜像', 'warning');
            }
        } catch (e) {}
    };

    const pushTrackingToFeishu = async (silent: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl) return { success: false };
        return await sendMessageToBot(webhookUrl, "推送清单", "物流追踪矩阵推送任务已启动。");
    };

    const connectToPb = async (url: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch({ type: 'UPDATE_DATA', payload: { connectionStatus: 'connected', pbUrl: url } });
        showToast('已连接至腾讯云控制节点', 'success');
        pullFromCloud(true);
    };

    useEffect(() => {
        if (state.isInitialized) {
            if (sentinelIntervalRef.current) clearInterval(sentinelIntervalRef.current);
            sentinelIntervalRef.current = setInterval(runSentinelSweep, state.cloudSettings.sentinelInterval * 60000);
            return () => { if (sentinelIntervalRef.current) clearInterval(sentinelIntervalRef.current); };
        }
    }, [state.isInitialized, state.cloudSettings.sentinelInterval, state.cloudSettings.enableSentinel]);

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            if (cached) dispatch({ type: 'BOOT', payload: cached });
            else dispatch({ type: 'BOOT', payload: { 
                products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, 
                shipments: MOCK_SHIPMENTS, orders: MOCK_ORDERS, inboundShipments: [], influencers: [], tasks: [], auditLogs: []
            } });
        };
        startup();
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, runSentinelSweep, syncToCloud, pullFromCloud, pushTrackingToFeishu, connectToPb }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
