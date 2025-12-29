
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
            const request = indexedDB.open(DB_NAME, 11); // Bump version
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

    // 核心功能：全盘业务审计与飞书推送 (不再使用 Google Search)
    const performOperationalAudit = async (manual: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl) {
            if (manual) showToast('请先配置飞书 Webhook 节点', 'warning');
            return;
        }

        if (manual) showToast('正在解析 ERP 经营矩阵数据...', 'info');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

            // 构建核心经营上下文
            const lowStock = state.products.filter((p: any) => p.stock < 15).map((p: any) => `${p.sku}(剩${p.stock})`);
            const pendingTasks = state.tasks.filter((t: any) => t.status !== 'done').slice(0, 3).map((t: any) => t.title);
            const totalCash = state.transactions.reduce((acc: number, t: any) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

            const prompt = `
                你现在是探行 ERP 的高级业务助理。请根据以下经营数据，生成一份极其精炼的飞书“指挥官简报”：
                1. 库存告急：${lowStock.length > 0 ? lowStock.join(', ') : '全部充足'}
                2. 关键任务：${pendingTasks.length > 0 ? pendingTasks.join(' | ') : '今日无紧急任务'}
                3. 预估可用头寸：¥${totalCash.toLocaleString()}
                
                要求：
                - 用中文，语气专业、利落。
                - 包含一个针对今日运营的“核心建议”。
                - 不超过 100 字。不要使用联网搜索。
            `;

            // 修正：直接使用 ai.models.generateContent 并在内部指定 model 名
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            const report = response.text;

            if (report) {
                const res = await sendMessageToBot(webhookUrl, '探行经营·中枢快报', report);
                if (res.success) {
                    dispatch({ type: 'UPDATE_DATA', payload: { lastOperationalAudit: Date.now() } });
                    if (manual) showToast('AI 指挥官报文已同步至飞书', 'success');
                } else if (manual) {
                    showToast('飞书节点连接失败，请检查关键字设置', 'error');
                }
            }
        } catch (e: any) {
            if (manual) showToast(`中枢响应异常: ${e.message}`, 'error');
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
        <TanxingContext.Provider value={{ state, dispatch, showToast, performOperationalAudit }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
