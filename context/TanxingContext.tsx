
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, Order, AuditLog, ExportTask } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

const DB_KEY = 'TANXING_DB_V4';

/* Exported Theme type as required by Settings.tsx */
export type Theme = 'ios-glass' | 'ios-depth' | 'ios-titanium';

interface AppState {
    theme: Theme;
    activePage: Page;
    navParams: { searchQuery?: string };
    supabaseConfig: { url: string; key: string; lastSync: string | null };
    products: Product[];
    transactions: Transaction[];
    customers: Customer[];
    orders: Order[];
    shipments: Shipment[];
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

/* Expanded Action union to include all actions used in components */
type Action =
    | { type: 'SET_THEME'; payload: AppState['theme'] }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: { searchQuery?: string } } }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'ADD_AUDIT_LOG'; payload: Omit<AuditLog, 'id' | 'timestamp'> }
    | { type: 'START_EXPORT'; payload: { id: string; fileName: string } }
    | { type: 'UPDATE_EXPORT_PROGRESS'; payload: { id: string; progress: number } }
    | { type: 'COMPLETE_EXPORT'; payload: string }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'RESTORE_PRODUCT'; payload: string }
    | { type: 'PERMANENT_DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'RESTORE_ORDER'; payload: string }
    | { type: 'PERMANENT_DELETE_ORDER'; payload: string }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
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
    | { type: 'SET_SUPABASE_CONFIG'; payload: { url: string; key: string; lastSync?: string | null } }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'RESET_DATA' };

const mockState: AppState = {
    theme: 'ios-glass',
    activePage: 'dashboard',
    navParams: {},
    supabaseConfig: { url: '', key: '', lastSync: null },
    products: MOCK_PRODUCTS,
    transactions: MOCK_TRANSACTIONS,
    customers: MOCK_CUSTOMERS,
    orders: MOCK_ORDERS,
    shipments: MOCK_SHIPMENTS,
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
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        
        case 'ADD_AUDIT_LOG': {
            const newLog: AuditLog = {
                ...action.payload,
                id: `LOG-${Date.now()}`,
                timestamp: new Date().toISOString()
            };
            return { ...state, auditLogs: [newLog, ...state.auditLogs].slice(0, 100) };
        }

        case 'START_EXPORT': return {
            ...state,
            exportTasks: [{ id: action.payload.id, fileName: action.payload.fileName, progress: 0, status: 'processing', timestamp: new Date().toISOString() }, ...state.exportTasks]
        };
        case 'UPDATE_EXPORT_PROGRESS': return {
            ...state,
            exportTasks: state.exportTasks.map(t => t.id === action.payload.id ? { ...t, progress: action.payload.progress } : t)
        };
        case 'COMPLETE_EXPORT': return {
            ...state,
            exportTasks: state.exportTasks.map(t => t.id === action.payload ? { ...t, progress: 100, status: 'completed' } : t)
        };

        case 'UPDATE_PRODUCT': {
            const oldProduct = state.products.find(p => p.id === action.payload.id);
            const changes = [];
            if (oldProduct) {
                if (oldProduct.stock !== action.payload.stock) changes.push(`库存: ${oldProduct.stock} -> ${action.payload.stock}`);
                if (oldProduct.price !== action.payload.price) changes.push(`单价: ${oldProduct.price} -> ${action.payload.price}`);
            }
            
            const newLog: AuditLog = {
                id: `LOG-${Date.now()}`,
                timestamp: new Date().toISOString(),
                userId: 'root',
                userName: '管理员',
                action: 'update',
                entityType: 'product',
                entityId: action.payload.sku,
                details: changes.length > 0 ? `修改了属性: ${changes.join(', ')}` : '保存了商品资料'
            };

            return { 
                ...state, 
                products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
                auditLogs: [newLog, ...state.auditLogs]
            };
        }
        case 'ADD_PRODUCT': return { ...state, products: [...state.products, action.payload] };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: new Date().toISOString() } : p) };
        case 'RESTORE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: undefined } : p) };
        case 'PERMANENT_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };

        case 'ADD_ORDER': return { ...state, orders: [...state.orders, action.payload] };
        case 'DELETE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: new Date().toISOString() } : o) };
        case 'RESTORE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: undefined } : o) };
        case 'PERMANENT_DELETE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        case 'UPDATE_ORDER_STATUS': return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) };

        case 'ADD_CUSTOMER': return { ...state, customers: [...state.customers, action.payload] };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };

        case 'ADD_SHIPMENT': return { ...state, shipments: [...state.shipments, action.payload] };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload) };

        case 'ADD_INFLUENCER': return { ...state, influencers: [...state.influencers, action.payload] };
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [...state.adCampaigns, action.payload] };

        case 'ADD_SUPPLIER': return { ...state, suppliers: [...state.suppliers, action.payload] };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };

        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [...state.inboundShipments, action.payload] };

        case 'HYDRATE_STATE': return { ...state, ...action.payload };
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
    /* Added missing cloud sync methods to context */
    syncToCloud: () => Promise<void>;
    pullFromCloud: () => Promise<void>;
    checkCloudVersion: () => Promise<string | null>;
}>({ 
    state: mockState, 
    dispatch: () => null, 
    showToast: () => null,
    syncToCloud: async () => {},
    pullFromCloud: async () => {},
    checkCloudVersion: async () => null 
});

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, mockState, (initial) => {
        try {
            const saved = localStorage.getItem(DB_KEY);
            return saved ? { ...initial, ...JSON.parse(saved), toasts: [], exportTasks: [] } : initial;
        } catch { return initial; }
    });

    useEffect(() => {
        localStorage.setItem(DB_KEY, JSON.stringify({ ...state, toasts: [], exportTasks: [] }));
        document.body.className = `theme-${state.theme}`;
    }, [state]);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    /* Implemented cloud sync logic for Supabase */
    const syncToCloud = async () => {
        if (!state.supabaseConfig.url || !state.supabaseConfig.key) return;
        const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        const { error } = await supabase.from('app_backups').insert([{
            data: {
                products: state.products,
                orders: state.orders,
                transactions: state.transactions,
                customers: state.customers,
                shipments: state.shipments,
                suppliers: state.suppliers,
                inboundShipments: state.inboundShipments,
                adCampaigns: state.adCampaigns,
                influencers: state.influencers,
                calendarEvents: state.calendarEvents,
            }
        }]);
        if (error) {
            console.error(error);
            showToast(`同步失败: ${error.message}`, 'error');
        } else {
            const now = new Date().toLocaleString();
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { url: state.supabaseConfig.url, key: state.supabaseConfig.key, lastSync: now } });
            showToast('数据已成功同步至云端', 'success');
        }
    };

    const pullFromCloud = async () => {
        if (!state.supabaseConfig.url || !state.supabaseConfig.key) return;
        const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        const { data, error } = await supabase.from('app_backups').select('data, created_at').order('created_at', { ascending: false }).limit(1);
        if (error) {
            showToast(`恢复失败: ${error.message}`, 'error');
            return;
        }
        if (data && data.length > 0) {
            dispatch({ type: 'HYDRATE_STATE', payload: data[0].data });
            const now = new Date(data[0].created_at).toLocaleString();
            dispatch({ type: 'SET_SUPABASE_CONFIG', payload: { url: state.supabaseConfig.url, key: state.supabaseConfig.key, lastSync: now } });
            showToast('数据已从云端成功恢复', 'success');
        }
    };

    const checkCloudVersion = async () => {
        if (!state.supabaseConfig.url || !state.supabaseConfig.key) return null;
        const supabase = createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        const { data, error } = await supabase.from('app_backups').select('created_at').order('created_at', { ascending: false }).limit(1);
        if (error || !data || data.length === 0) return null;
        return data[0].created_at;
    };

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, checkCloudVersion }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
