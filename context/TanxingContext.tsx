
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
            const request = indexedDB.open(DB_NAME, 10);
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

interface AppState {
    activePage: Page;
    theme: Theme;
    pbUrl: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    saveStatus: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
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
    lastLogisticsCheck?: number;
}

const initialState: AppState = {
    activePage: (localStorage.getItem(PAGE_CACHE_KEY) as Page) || 'dashboard', 
    theme: (localStorage.getItem(THEME_CACHE_KEY) as Theme) || 'quantum',
    pbUrl: '',
    connectionStatus: 'disconnected', saveStatus: 'idle',
    products: [], transactions: [], customers: [], orders: [], shipments: [], 
    tasks: [], inboundShipments: [], suppliers: [], influencers: [], toasts: [],
    automationRules: [], automationLogs: [], auditLogs: [], isMobileMenuOpen: false, isInitialized: false
};

function appReducer(state: AppState, action: any): AppState {
    let nextState = { ...state };
    switch (action.type) {
        case 'BOOT': nextState = { ...state, ...action.payload, isInitialized: true }; break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, isMobileMenuOpen: false };
            break;
        case 'UPDATE_DATA': nextState = { ...state, ...action.payload }; break;
        case 'ADD_TOAST': nextState = { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] }; break;
        case 'REMOVE_TOAST': nextState = { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) }; break;
        default: return state;
    }
    if (nextState !== state) idb.set(nextState);
    return nextState;
}

const TanxingContext = createContext<any>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const sentryTimerRef = useRef<any>(null);

    const getAiStudio = () => {
        try {
            let win = window as any;
            while (win) {
                if (win.aistudio) return win.aistudio;
                if (win === win.parent) break;
                win = win.parent;
            }
        } catch (e) {}
        return (globalThis as any).aistudio;
    };

    const performLogisticsSentry = async (manual: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl) {
            if (manual) showToast('请先配置并保存飞书 Webhook 地址', 'warning');
            return;
        }

        const targets = (state.shipments || []).filter(s => 
            s.status !== '已送达' && s.trackingNo && !['AWAITING', 'PENDING', ''].includes(s.trackingNo)
        );

        if (targets.length === 0) {
            if (manual) showToast('当前物流矩阵中无活动单号', 'error');
            return;
        }

        if (manual) showToast(`量子引擎启动：正在对齐 ${targets.length} 个单据的物理位面信息...`, 'info');

        try {
            // 每次调用必须使用最新注入的 API_KEY
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const model = ai.models.get('gemini-3-flash-preview');
            const context = targets.map(s => `[${s.carrier}] 单号: ${s.trackingNo}, 货品: ${s.productName || '未知'}`).join('\n');
            
            let finalReport = "";
            let groundingLinks = "";

            try {
                // 尝试方案 A：Google Search 联网核账 (需要 Paid Key)
                const res = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `你现在是探行 ERP 物流对账专家。请联网搜索以下单号的最新状态并评估异常风险：\n${context}\n\n要求：中文回答，简洁。` }] }],
                    config: { tools: [{ googleSearch: {} }] }
                });
                
                finalReport = res.text;
                const grounding = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (grounding) {
                    groundingLinks = "\n\n🔗 实时物理数据来源:\n" + grounding.map((c: any) => c.web ? `- ${c.web.title}: ${c.web.uri}` : null).filter(Boolean).join('\n');
                }
            } catch (searchErr: any) {
                console.warn("Search Grounding failed, switching to local inference mode.", searchErr);
                // 方案 B：降级逻辑对账 (不需要 Google Search，兼容所有 Key)
                const fallbackRes = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: `[系统降级提示：联网搜索不可用，执行逻辑诊断]\n以下是物流资产清单：\n${context}\n\n请根据单号编码特征提供预计到达时间估算和日常维护建议。` }] }]
                });
                finalReport = `⚠️ [AI 审计模式: 逻辑推演]\n注：由于 API 权限限制，当前已自动切换至本地诊断模式。\n\n${fallbackRes.text}`;
            }

            if (finalReport) {
                const feishuRes = await sendMessageToBot(webhookUrl, '全球轨迹对账快照', finalReport + groundingLinks);
                if (feishuRes.success) {
                    dispatch({ type: 'UPDATE_DATA', payload: { lastLogisticsCheck: Date.now() } });
                    if (manual) showToast('对账报文已精准同步至飞书', 'success');
                } else if (manual) {
                    showToast('飞书节点拒绝了请求，请检查安全关键字配置', 'error');
                }
            }
        } catch (globalErr: any) {
            console.error("Critical AI Error:", globalErr);
            const msg = globalErr.message || '';
            const aistudio = getAiStudio();
            
            if (msg.includes("API key") || msg.includes("entity was not found")) {
                if (manual) showToast('AI 授权已过期或权限不足，正在重新激活授权窗口...', 'warning');
                if (aistudio) aistudio.openSelectKey();
            } else if (manual) {
                showToast(`链路中断: ${msg || '网络连接超时'}`, 'error');
            }
        }
    };

    useEffect(() => {
        const startup = async () => {
            const cached = await idb.get();
            if (cached) dispatch({ type: 'BOOT', payload: cached });
            else dispatch({ type: 'BOOT', payload: { products: MOCK_PRODUCTS, transactions: MOCK_TRANSACTIONS, customers: MOCK_CUSTOMERS, shipments: MOCK_SHIPMENTS, orders: MOCK_ORDERS } });
        };
        startup();
        sentryTimerRef.current = setInterval(() => performLogisticsSentry(false), 10800000); 
        return () => clearInterval(sentryTimerRef.current);
    }, []);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, performLogisticsSentry }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
