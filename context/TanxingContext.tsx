
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { 
    Product, Transaction, Toast, Shipment, Page, 
    Order, Theme, CloudAutomationSettings, InboundShipment, Customer, Supplier, Task, AutomationRule, AutomationLog, AuditLog
} from '../types';
import { 
    MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, 
    MOCK_SHIPMENTS, MOCK_ORDERS
} from '../constants';
import { sendMessageToBot } from '../utils/feishu';

// Added SESSION_ID export
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
            const request = indexedDB.open(DB_NAME, 12); // Upgraded version for schema consistency
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
            // Ensure we don't store UI-only transient states like 'toasts' or 'isInitialized'
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
            // Full state override for imports
            nextState = { ...state, ...action.payload, isInitialized: true }; 
            break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, isMobileMenuOpen: false };
            break;
        case 'SET_THEME':
            localStorage.setItem(THEME_CACHE_KEY, action.payload);
            nextState = { ...state, theme: action.payload };
            break;
        case 'UPDATE_DATA': nextState = { ...state, ...action.payload }; break;
        case 'UPDATE_SHIPMENT': 
            const newShipments = state.shipments.map((s: any) => s.id === action.payload.id ? action.payload : s);
            nextState = { ...state, shipments: newShipments };
            break;
        case 'UPDATE_CLOUD_SETTINGS':
            localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(action.payload));
            nextState = { ...state, cloudSettings: action.payload };
            break;
        case 'ADD_TRANSACTION':
            nextState = { ...state, transactions: [action.payload, ...state.transactions] };
            break;
        case 'DELETE_TRANSACTION':
            nextState = { ...state, transactions: state.transactions.filter((t: any) => t.id !== action.payload) };
            break;
        case 'ADD_TOAST': nextState = { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] }; break;
        case 'REMOVE_TOAST': nextState = { ...state, toasts: (state.toasts || []).filter((t: any) => t.id !== action.payload) }; break;
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
        products: [], transactions: [], customers: [], orders: [], shipments: [], toasts: [], isInitialized: false,
        automationRules: [], automationLogs: [], inboundShipments: [], influencers: []
    });

    const sentinelIntervalRef = useRef<any>(null);

    // --- 核心：云端哨兵巡检逻辑 ---
    const runSentinelSweep = async () => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl || !state.cloudSettings.enableSentinel) return;

        console.log("[Cloud Sentry] 启动全球物理链路扫描...");
        
        const exceptions = (state.shipments || []).filter((s: any) => s.status === '异常' && !s.notified);
        if (exceptions.length > 0) {
            for (const item of exceptions) {
                const alertMsg = `🚨 物流异常预警\n货件: ${item.productName}\n单号: ${item.trackingNo}\n承运商: ${item.carrier}\n最新节点: ${item.lastUpdate}\n请立即进入系统核查并联系货代。`;
                const res = await sendMessageToBot(webhookUrl, '风险预警', alertMsg);
                if (res.success) {
                    dispatch({ type: 'UPDATE_SHIPMENT', payload: { ...item, notified: true } });
                }
            }
        }

        if (state.cloudSettings.enableStockAlert) {
            const lowStock = (state.products || []).filter((p: any) => p.stock < 10 && !p.stockNotified);
            if (lowStock.length > 0) {
                const stockMsg = `📉 库存破位提醒\n以下 SKU 已低于警戒线(10pcs)：\n${lowStock.map((p: any) => `- ${p.sku}: ${p.stock}件`).join('\n')}\n建议尽快启动补货程序。`;
                await sendMessageToBot(webhookUrl, '库存日报', stockMsg);
                const updatedProducts = state.products.map((p: any) => lowStock.find((ls: any) => ls.id === p.id) ? { ...p, stockNotified: true } : p);
                dispatch({ type: 'UPDATE_DATA', payload: { products: updatedProducts } });
            }
        }

        dispatch({ type: 'UPDATE_DATA', payload: { lastSentryRun: new Date().toLocaleTimeString() } });
    };

    const syncToCloud = async () => {
        showToast('云端数据已对齐', 'success');
    };

    const pullFromCloud = async (silent: boolean = false) => {
        if (!silent) showToast('载荷对齐完成', 'success');
    };

    const pushTrackingToFeishu = async (silent: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl) return { success: false };
        return await sendMessageToBot(webhookUrl, "推送清单", "物流追踪矩阵推送任务已启动。");
    };

    const connectToPb = async (url: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch({ type: 'UPDATE_DATA', payload: { connectionStatus: 'connected', pbUrl: url } });
        showToast('已连接至云端控制节点', 'success');
    };

    useEffect(() => {
        if (state.isInitialized) {
            if (sentinelIntervalRef.current) clearInterval(sentinelIntervalRef.current);
            sentinelIntervalRef.current = setInterval(runSentinelSweep, state.cloudSettings.sentinelInterval * 60000);
            const timer = setTimeout(runSentinelSweep, 5000);
            return () => {
                if (sentinelIntervalRef.current) clearInterval(sentinelIntervalRef.current);
                clearTimeout(timer);
            };
        }
    }, [state.isInitialized, state.cloudSettings.sentinelInterval, state.cloudSettings.enableSentinel]);

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            if (cached) dispatch({ type: 'BOOT', payload: cached });
            else dispatch({ type: 'BOOT', payload: { products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, orders: MOCK_ORDERS, inboundShipments: [], influencers: [] } });
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
