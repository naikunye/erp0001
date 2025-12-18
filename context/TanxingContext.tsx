
import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask, Task } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V4';
export const SESSION_ID = Math.random().toString(36).substring(7);

export type Theme = 'ios-glass' | 'cyber-neon' | 'paper-minimal';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    supabaseConfig: { url: string; key: string; lastSync: string | null; isRealTime: boolean };
    connectionStatus: ConnectionStatus;
    products: Product[];
    transactions: Transaction[];
    customers: Customer[];
    orders: Order[];
    shipments: Shipment[];
    tasks: Task[];
    calendarEvents: CalendarEvent[];
    suppliers: Supplier[];
    adCampaigns: AdCampaign[];
    influencers: Influencer[];
    inboundShipments: InboundShipment[];
    toasts: Toast[];
    auditLogs: AuditLog[];
    exportTasks: ExportTask[];
    isMobileMenuOpen: boolean;
}

type Action =
    | { type: 'SET_THEME'; payload: AppState['theme'] }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: { searchQuery?: string } } }
    | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'CREATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'SET_SUPABASE_CONFIG'; payload: Partial<AppState['supabaseConfig']> }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'FULL_RESTORE'; payload: Partial<AppState> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' };

const mockState: AppState = {
    theme: 'ios-glass',
    activePage: 'dashboard',
    navParams: {},
    supabaseConfig: { url: '', key: '', lastSync: null, isRealTime: true },
    connectionStatus: 'disconnected',
    products: MOCK_PRODUCTS,
    transactions: MOCK_TRANSACTIONS,
    customers: MOCK_CUSTOMERS,
    orders: MOCK_ORDERS,
    shipments: MOCK_SHIPMENTS,
    tasks: [
        { id: 'T-1', title: 'SKU-MA001 紧急补货申请', priority: 'urgent', status: 'in_progress', assignee: '张伟', dueDate: '2023-11-05', relatedSku: 'MA-001', category: 'procurement' },
        { id: 'T-2', title: '美西仓库入库异常申诉', priority: 'high', status: 'todo', assignee: '李芳', dueDate: '2023-11-04', category: 'logistics' },
    ],
    calendarEvents: [],
    suppliers: MOCK_SUPPLIERS,
    adCampaigns: MOCK_AD_CAMPAIGNS,
    influencers: MOCK_INFLUENCERS,
    inboundShipments: MOCK_INBOUND_SHIPMENTS,
    toasts: [],
    auditLogs: [],
    exportTasks: [],
    isMobileMenuOpen: false
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.payload };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products] };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
        case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks] };
        case 'UPDATE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] };
        case 'UPDATE_ORDER_STATUS': return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) };
        case 'DELETE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers] };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments] };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload) };
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers] };
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [action.payload, ...state.adCampaigns] };
        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers] };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments] };
        case 'HYDRATE_STATE': return { ...state, ...action.payload };
        case 'FULL_RESTORE': 
            // 极强鲁棒性的全量数据恢复逻辑：先解构 mockState 确保所有 key 存在
            return { 
                ...mockState, 
                ...action.payload, 
                // 特别加固子对象，防止 payload 中 supabaseConfig 为 null 或 undefined
                supabaseConfig: { 
                    ...mockState.supabaseConfig, 
                    ...(action.payload?.supabaseConfig || {}) 
                },
                navParams: action.payload?.navParams || {},
                toasts: [], 
                exportTasks: [],
                connectionStatus: 'disconnected' 
            };
        case 'SET_SUPABASE_CONFIG': return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'RESET_DATA': return mockState;
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: () => Promise<void>;
}>({ state: mockState, dispatch: () => null, showToast: () => null, syncToCloud: async () => {} });

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, mockState, (initial) => {
        try {
            const saved = localStorage.getItem(DB_KEY);
            if (!saved) return initial;
            const parsed = JSON.parse(saved);
            // 增强型初始化：合并默认值以防本地缓存版本过旧
            return { 
                ...initial, 
                ...parsed, 
                supabaseConfig: { ...initial.supabaseConfig, ...(parsed.supabaseConfig || {}) },
                toasts: [], 
                exportTasks: [], 
                connectionStatus: 'disconnected' 
            };
        } catch { return initial; }
    });

    const isInternalUpdate = useRef(false);
    const lastSyncDataRef = useRef<string>('');

    // --- 核心实时订阅逻辑 ---
    useEffect(() => {
        // 安全读取配置，使用可选链
        const config = state.supabaseConfig || { url: '', key: '', isRealTime: false };
        if (!config.url || !config.key || !config.isRealTime) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
            return;
        }

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        
        try {
            const supabase = createClient(config.url, config.key, {
                realtime: { params: { eventsPerSecond: 10 } }
            });

            const channel = supabase.channel('tanxing_realtime_v4')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'app_backups' 
                }, (payload) => {
                    const incoming = payload.new;
                    if (incoming && incoming.data && incoming.data.source_session !== SESSION_ID) {
                        const incomingPayload = incoming.data.payload;
                        const payloadString = JSON.stringify(incomingPayload);
                        if (payloadString !== lastSyncDataRef.current) {
                            isInternalUpdate.current = true;
                            lastSyncDataRef.current = payloadString;
                            dispatch({ type: 'HYDRATE_STATE', payload: incomingPayload });
                        }
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (e) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        }
    }, [state.supabaseConfig?.url, state.supabaseConfig?.key, state.supabaseConfig?.isRealTime]);

    // --- 自动持久化 ---
    useEffect(() => {
        localStorage.setItem(DB_KEY, JSON.stringify({ ...state, toasts: [], exportTasks: [] }));
        document.body.className = `theme-${state.theme}`;

        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        if (state.connectionStatus === 'connected' && state.supabaseConfig?.isRealTime) {
            const timer = setTimeout(() => syncToCloud(), 3000); 
            return () => clearTimeout(timer);
        }
    }, [state.products, state.orders, state.tasks, state.customers, state.shipments, state.theme, state.connectionStatus]);

    const syncToCloud = async () => {
        if (!state.supabaseConfig?.url || !state.supabaseConfig?.key) return;
        
        const payloadToSync = {
            products: state.products,
            orders: state.orders,
            tasks: state.tasks,
            customers: state.customers,
            shipments: state.shipments,
            suppliers: state.suppliers,
            transactions: state.transactions,
            adCampaigns: state.adCampaigns,
            influencers: state.influencers,
            inboundShipments: state.inboundShipments
        };

        const payloadString = JSON.stringify(payloadToSync);
        if (payloadString === lastSyncDataRef.current) return; 

        try {
            const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
            const { error } = await supabase.from('app_backups').insert([{
                data: {
                    source_session: SESSION_ID,
                    payload: payloadToSync
                }
            }]);
            
            if (error) throw error;
            lastSyncDataRef.current = payloadString;
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { lastSync: new Date().toLocaleTimeString() } });
        } catch (e) {
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        }
    };

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
