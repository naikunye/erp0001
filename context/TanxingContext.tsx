
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
            const request = indexedDB.open(DB_NAME, 11);
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
            tx.objectStore(STORE_NAME).put(JSON.parse(JSON.stringify(val)), 'LATEST');
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

function appReducer(state: any, action: any): any {
    let nextState = { ...state };
    switch (action.type) {
        case 'BOOT': nextState = { ...state, ...action.payload, isInitialized: true }; break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, isMobileMenuOpen: false };
            break;
        case 'UPDATE_DATA': nextState = { ...state, ...action.payload }; break;
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
        pbUrl: '', connectionStatus: 'disconnected', saveStatus: 'idle',
        products: [], transactions: [], customers: [], orders: [], shipments: [], 
        tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
        automationRules: [], automationLogs: [], auditLogs: [], isMobileMenuOpen: false, isInitialized: false
    });

    // 核心功能：物流单号清单推送 (仅同步名称与单号，方便手机端复制查询)
    const pushTrackingToFeishu = async (manual: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl) {
            if (manual) showToast('请先配置飞书 Webhook 节点', 'warning');
            return;
        }

        const activeShipments = (state.shipments || []).filter((s: any) => s.status !== '已送达');
        
        if (activeShipments.length === 0) {
            if (manual) showToast('当前物流矩阵中无正在运输的货件', 'info');
            return;
        }

        const messageContent = activeShipments.map((s: any, idx: number) => 
            `${idx + 1}. 📦 ${s.productName || '未知载荷'}\n单号: ${s.trackingNo}\n承运: ${s.carrier || 'UPS'}`
        ).join('\n\n');

        const finalMessage = `探行 ERP 物流单号清单\n----------------\n${messageContent}\n----------------\n更新时间: ${new Date().toLocaleString()}`;

        try {
            const res = await sendMessageToBot(webhookUrl, '物流单号同步', finalMessage);
            if (res.success) {
                if (manual) showToast('物流清单已同步至飞书', 'success');
            } else {
                if (manual) showToast('飞书发送失败，请检查 Webhook 状态', 'error');
            }
        } catch (e) {
            if (manual) showToast('通讯链路异常', 'error');
        }
    };

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            if (cached) dispatch({ type: 'BOOT', payload: cached });
            else dispatch({ type: 'BOOT', payload: { products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, orders: MOCK_ORDERS } });
        };
        startup();
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, pushTrackingToFeishu }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
