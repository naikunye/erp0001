
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
            const request = indexedDB.open(DB_NAME, 8);
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

function appReducer(state: AppState, action: any): AppState {
    let nextState = { ...state };
    const updateInArray = (arr: any[], item: any) => (arr || []).map(i => i.id === item.id ? item : i);
    const deleteInArray = (arr: any[], id: string) => (arr || []).filter(i => i.id !== id);

    switch (action.type) {
        case 'BOOT':
            nextState = { 
                ...state, 
                ...action.payload, 
                isInitialized: true 
            };
            break;
        case 'NAVIGATE':
            localStorage.setItem(PAGE_CACHE_KEY, action.payload.page);
            nextState = { ...state, activePage: action.payload.page, navParams: action.payload.params, isMobileMenuOpen: false };
            break;
        case 'SET_CONN':
            nextState = { ...state, connectionStatus: action.payload };
            break;
        case 'UPDATE_DATA':
            nextState = { ...state, ...action.payload };
            break;
        case 'ADD_SHIPMENT': nextState = { ...state, shipments: [action.payload, ...(state.shipments || [])], saveStatus: 'dirty' }; break;
        case 'UPDATE_SHIPMENT': nextState = { ...state, shipments: updateInArray(state.shipments, action.payload), saveStatus: 'dirty' }; break;
        case 'ADD_AUDIT_LOG': nextState = { ...state, auditLogs: [action.payload, ...(state.auditLogs || [])], saveStatus: 'dirty' }; break;
        case 'ADD_TOAST': nextState = { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] }; break;
        case 'REMOVE_TOAST': nextState = { ...state, toasts: (state.toasts || []).filter(t => t.id !== action.payload) }; break;
        case 'TOGGLE_MOBILE_MENU': nextState = { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen }; break;
        default: return state;
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
    performLogisticsSentry: (manual?: boolean) => Promise<void>;
} | undefined>(undefined);

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const pbRef = useRef<PocketBase | null>(null);
    const sentryTimerRef = useRef<any>(null);

    // --- 全维度探测 aistudio 对象 ---
    const getAiStudio = () => {
        let curr: any = window;
        try {
            while (curr) {
                if (curr.aistudio) return curr.aistudio;
                if (curr === curr.parent) break;
                curr = curr.parent;
            }
        } catch (e) {}
        return (globalThis as any).aistudio;
    };

    const performLogisticsSentry = async (manual: boolean = false) => {
        const webhookUrl = localStorage.getItem('TX_FEISHU_URL');
        if (!webhookUrl && manual) return showToast('请先在“通讯矩阵”配置飞书 Webhook 节点', 'warning');

        const targets = (state.shipments || []).filter(s => 
            s.status !== '已送达' && s.trackingNo && !['AWAITING', 'PENDING', ''].includes(s.trackingNo)
        );

        if (targets.length === 0) {
            if (manual) showToast('物流矩阵中未发现待对账单据', 'error');
            return;
        }

        const aistudio = getAiStudio();
        
        // --- 核心优化：检测授权并强制继续 ---
        if (aistudio) {
            try {
                const hasKey = await aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    if (manual) showToast('未发现 API 授权，正在调起密钥选择器...', 'info');
                    await aistudio.openSelectKey();
                    // 规范：Assume success and proceed
                }
            } catch (err) {}
        }

        if (manual) showToast(`正在尝试通过量子链路检索 ${targets.length} 个单据...`, 'info');

        try {
            // 每次调用都重新实例化以确保获取最新的 process.env.API_KEY
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const context = targets.map(s => `[${s.carrier || '未知'}] 单号: ${s.trackingNo}`).join('\n');
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: `请利用 Google Search 联网检索以下单据的最新物流轨迹，并评估滞留风险。必须用中文回答。单据列表：\n${context}`,
                config: { tools: [{ googleSearch: {} }] }
            });

            const aiText = response.text;
            if (aiText) {
                let links = "";
                const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (grounding) {
                    links = "\n\n🔗 物理数据来源:\n" + grounding
                        .map((c: any) => c.web ? `- ${c.web.title}: ${c.web.uri}` : null)
                        .filter(Boolean)
                        .join('\n');
                }

                const res = await sendMessageToBot(webhookUrl!, '全球轨迹对账报告', aiText + links);
                if (res.success) {
                    dispatch({ type: 'UPDATE_DATA', payload: { lastLogisticsCheck: Date.now() } });
                    if (manual) showToast('对账完成，报告已推送到飞书', 'success');
                } else {
                    if (manual) showToast('飞书机器人拒绝了消息，请检查安全关键词（探行 ERP）', 'error');
                }
            }
        } catch (e: any) {
            console.error("AI Logistics Exception:", e);
            const msg = e.message || '';
            if (msg.includes("API key") || msg.includes("entity was not found")) {
                if (manual) showToast('授权链路失效，请重新点击并选择 API Key', 'error');
                if (aistudio) aistudio.openSelectKey();
            } else if (manual) {
                showToast(`对账中断: ${msg || 'AI 引擎无响应'}`, 'error');
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

    const connectToPb = async (url: string): Promise<boolean> => {
        dispatch({ type: 'SET_CONN', payload: 'connecting' });
        try {
            const pb = new PocketBase(url);
            await pb.health.check();
            pbRef.current = pb;
            dispatch({ type: 'SET_CONN', payload: 'connected' });
            return true;
        } catch (e) {
            dispatch({ type: 'SET_CONN', payload: 'error' });
            return false;
        }
    };

    const syncToCloud = async () => {}; // 占位
    const pullFromCloud = async () => {}; // 占位
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
