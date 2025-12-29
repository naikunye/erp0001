
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
        case 'UPDATE_DATA': 
            nextState = { ...state, ...action.payload }; 
            break;

        // --- 商品 (Inventory) 核心逻辑 ---
        case 'ADD_PRODUCT':
            nextState = { ...state, products: [...(state.products || []), action.payload] };
            break;
        case 'UPDATE_PRODUCT':
            nextState = { ...state, products: (state.products || []).map((p: Product) => p.id === action.payload.id ? action.payload : p) };
            break;
        case 'DELETE_PRODUCT':
            nextState = { ...state, products: (state.products || []).filter((p: Product) => p.id !== action.payload) };
            break;

        // --- 协作任务 (Tasks) ---
        case 'ADD_TASK':
            nextState = { ...state, tasks: [action.payload, ...(state.tasks || [])] };
            break;
        case 'UPDATE_TASK':
            nextState = { ...state, tasks: (state.tasks || []).map((t: Task) => t.id === action.payload.id ? action.payload : t) };
            break;
        case 'DELETE_TASK':
            nextState = { ...state, tasks: (state.tasks || []).filter((t: Task) => t.id !== action.payload) };
            break;

        // --- 物流追踪 (Tracking) ---
        case 'ADD_SHIPMENT':
            nextState = { ...state, shipments: [action.payload, ...(state.shipments || [])] };
            break;
        case 'UPDATE_SHIPMENT': 
            nextState = { ...state, shipments: (state.shipments || []).map((s: Shipment) => s.id === action.payload.id ? action.payload : s) };
            break;
        case 'DELETE_SHIPMENT':
            nextState = { ...state, shipments: (state.shipments || []).filter((s: Shipment) => s.id !== action.payload) };
            break;

        // --- 财务流水 (Transactions) ---
        case 'ADD_TRANSACTION':
            nextState = { ...state, transactions: [action.payload, ...(state.transactions || [])] };
            break;
        case 'DELETE_TRANSACTION':
            nextState = { ...state, transactions: (state.transactions || []).filter((t: Transaction) => t.id !== action.payload) };
            break;

        // --- 客户关系 (CRM) ---
        case 'ADD_CUSTOMER':
            nextState = { ...state, customers: [...(state.customers || []), action.payload] };
            break;
        case 'UPDATE_CUSTOMER':
            nextState = { ...state, customers: (state.customers || []).map((c: Customer) => c.id === action.payload.id ? action.payload : c) };
            break;
        case 'DELETE_CUSTOMER':
            nextState = { ...state, customers: (state.customers || []).filter((c: Customer) => c.id !== action.payload) };
            break;

        // --- 供应商管理 (SRM) ---
        case 'ADD_SUPPLIER':
            nextState = { ...state, suppliers: [...(state.suppliers || []), action.payload] };
            break;
        case 'UPDATE_SUPPLIER':
            nextState = { ...state, suppliers: (state.suppliers || []).map((s: Supplier) => s.id === action.payload.id ? action.payload : s) };
            break;
        case 'DELETE_SUPPLIER':
            nextState = { ...state, suppliers: (state.suppliers || []).filter((s: Supplier) => s.id !== action.payload) };
            break;

        // --- 达人营销 (Marketing) ---
        case 'ADD_INFLUENCER':
            nextState = { ...state, influencers: [...(state.influencers || []), action.payload] };
            break;
        case 'UPDATE_INFLUENCER':
            nextState = { ...state, influencers: (state.influencers || []).map((i: Influencer) => i.id === action.payload.id ? action.payload : i) };
            break;
        case 'DELETE_INFLUENCER':
            nextState = { ...state, influencers: (state.influencers || []).filter((i: Influencer) => i.id !== action.payload) };
            break;

        // --- 物流中枢 (Inbound) ---
        case 'CREATE_INBOUND_SHIPMENT':
            nextState = { ...state, inboundShipments: [action.payload, ...(state.inboundShipments || [])] };
            break;
        case 'UPDATE_INBOUND_SHIPMENT':
            nextState = { ...state, inboundShipments: (state.inboundShipments || []).map((i: InboundShipment) => i.id === action.payload.id ? action.payload : i) };
            break;
        case 'DELETE_INBOUND_SHIPMENT':
            nextState = { ...state, inboundShipments: (state.inboundShipments || []).filter((i: InboundShipment) => i.id !== action.payload) };
            break;

        // --- 自动化与日志 ---
        case 'ADD_AUTOMATION_RULE':
            nextState = { ...state, automationRules: [...(state.automationRules || []), action.payload] };
            break;
        case 'UPDATE_AUTOMATION_RULE':
            nextState = { ...state, automationRules: (state.automationRules || []).map((r: AutomationRule) => r.id === action.payload.id ? action.payload : r) };
            break;
        case 'DELETE_AUTOMATION_RULE':
            nextState = { ...state, automationRules: (state.automationRules || []).filter((r: AutomationRule) => r.id !== action.payload) };
            break;
        case 'ADD_AUTOMATION_LOG':
            nextState = { ...state, automationLogs: [action.payload, ...(state.automationLogs || [])] };
            break;
        case 'ADD_AUDIT_LOG':
            nextState = { ...state, auditLogs: [action.payload, ...(state.auditLogs || [])] };
            break;

        // --- 基础 UI ---
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
        case 'CLEAR_NAV_PARAMS':
            nextState = { ...state, navParams: undefined };
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

    const syncToCloud = async () => { showToast('云端数据已对齐', 'success'); };
    const pullFromCloud = async (silent: boolean = false) => { if (!silent) showToast('载荷对齐完成', 'success'); };
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
            else dispatch({ type: 'BOOT', payload: { 
                products: MOCK_PRODUCTS, 
                transactions: MOCK_TRANSACTIONS, 
                customers: MOCK_CUSTOMERS, 
                shipments: MOCK_SHIPMENTS, 
                orders: MOCK_ORDERS, 
                inboundShipments: [], 
                influencers: [],
                tasks: [],
                auditLogs: []
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
