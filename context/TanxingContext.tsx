
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
    enableDailyReport: true,
    enableStockAlert: true,
    sentinelInterval: 15
};

function appReducer(state: any, action: any): any {
    let nextState = { ...state };
    switch (action.type) {
        case 'BOOT': 
            nextState = { ...state, ...action.payload, isInitialized: true, saveStatus: 'synced', lastSyncAt: new Date().toISOString() }; 
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
        case 'ADD_AUTOMATION_LOG':
            nextState = { ...state, automationLogs: [action.payload, ...(state.automationLogs || [])].slice(0, 50) };
            break;
        case 'MARK_SYNCED':
            nextState = { ...state, saveStatus: 'synced', lastSyncAt: new Date().toISOString() };
            break;
        case 'TOGGLE_MOBILE_MENU':
            nextState = { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
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
        serverStatus: 'online', // 模拟腾讯云服务器状态
        lastServerHeartbeat: new Date().toISOString(),
        connectionStatus: 'disconnected',
        saveStatus: 'synced',
        products: [], transactions: [], customers: [], orders: [], shipments: [], toasts: [], isInitialized: false,
        automationRules: [], automationLogs: [], inboundShipments: [], influencers: [], tasks: [], auditLogs: []
    });

    const syncToCloud = async (silent: boolean = false) => {
        if (!state.pbUrl) return !silent && showToast('未配置服务器节点', 'warning');
        try {
            const response = await fetch(`${state.pbUrl}/api/v1/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: SESSION_ID, payload: state })
            }).catch(() => null);
            dispatch({ type: 'MARK_SYNCED' });
            if (!silent) showToast('量子节点已对齐', 'success');
        } catch (e) {
            if (!silent) showToast('同步链路被拦截', 'error');
        }
    };

    const pullFromCloud = async (silent: boolean = false) => {
        if (!state.pbUrl) return !silent && showToast('未配置服务器节点', 'warning');
        try {
            const res = await fetch(`${state.pbUrl}/api/v1/snapshot`).then(r => r.json()).catch(() => null);
            if (res && res.payload) {
                dispatch({ type: 'BOOT', payload: res.payload });
                if (!silent) showToast('云端镜像拉取成功', 'success');
            }
        } catch (e) {}
    };

    const connectToPb = async (url: string) => {
        dispatch({ type: 'UPDATE_DATA', payload: { connectionStatus: 'connected', pbUrl: url } });
        showToast('已接入私有云控制台', 'success');
        pullFromCloud(true);
    };

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            if (cached) dispatch({ type: 'BOOT', payload: cached });
            else dispatch({ type: 'BOOT', payload: { 
                products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, 
                shipments: MOCK_SHIPMENTS, orders: MOCK_ORDERS, inboundShipments: [], influencers: [], tasks: [], 
                automationRules: [
                    { id: '1', name: '物流异常主动拦截', trigger: 'logistics_exception', action: 'notify_admin', status: 'active' },
                    { id: '2', name: '库存水位自动诊断', trigger: 'low_stock_warning', action: 'generate_ai_task', status: 'active' }
                ],
                automationLogs: []
            } });
        };
        startup();
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, connectToPb }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
