
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Order, Transaction, PurchaseOrder, Toast, Customer, Shipment, CalendarEvent, Supplier, InboundShipment, AdCampaign, Influencer } from '../types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SHIPMENTS, MOCK_SUPPLIERS, MOCK_INBOUND_SHIPMENTS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS } from '../constants';

// --- Theme Types ---
export type Theme = 'ios-glass' | 'ios-depth' | 'ios-titanium' | 'light';

const DB_KEY = 'TANXING_DB_V2'; // Version bump

// --- State Interface ---
interface AppState {
    theme: Theme;
    // Integrations Config
    supabaseConfig: {
        url: string;
        key: string;
        lastSync: string | null;
    };
    echotikConfig: {
        username: string; // Changed from apiKey
        password: string; // Added password
        region: 'US' | 'UK' | 'SEA';
    };
    // Data
    products: Product[];
    orders: Order[];
    transactions: Transaction[];
    purchaseOrders: PurchaseOrder[];
    customers: Customer[];
    shipments: Shipment[];
    calendarEvents: CalendarEvent[];
    suppliers: Supplier[];
    inboundShipments: InboundShipment[]; 
    adCampaigns: AdCampaign[];
    influencers: Influencer[];
    toasts: Toast[];
    isMobileMenuOpen: boolean;
}

// --- Action Types ---
type Action =
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    // Config Actions
    | { type: 'SET_SUPABASE_CONFIG'; payload: { url: string; key: string } }
    | { type: 'SET_ECHOTIK_CONFIG'; payload: { username: string; password: string; region: 'US' | 'UK' | 'SEA' } }
    | { type: 'SET_LAST_SYNC'; payload: string }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    // Product Actions
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'RESTORE_PRODUCT'; payload: string }
    | { type: 'PERMANENT_DELETE_PRODUCT'; payload: string }
    // Order Actions
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'SHIP_ORDER'; payload: { orderId: string; shippingMethod: string; trackingNumber: string } }
    | { type: 'PAY_ORDER'; payload: string }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'RESTORE_ORDER'; payload: string }
    | { type: 'PERMANENT_DELETE_ORDER'; payload: string }
    // Cleanup
    | { type: 'CLEANUP_TRASH' }
    // Other Actions
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'CREATE_PO'; payload: PurchaseOrder }
    | { type: 'RECEIVE_PO'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'CREATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'DELETE_AD_CAMPAIGN'; payload: string }
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    | { type: 'RESET_DATA' };

// --- Initial State (Mock) ---
const mockState: AppState = {
    theme: 'ios-glass',
    supabaseConfig: { url: '', key: '', lastSync: null },
    echotikConfig: { username: '', password: '', region: 'US' },
    products: MOCK_PRODUCTS,
    orders: MOCK_ORDERS.map(o => ({
        ...o,
        itemsCount: o.itemsCount || 0,
        lineItems: o.lineItems || [] 
    })),
    transactions: MOCK_TRANSACTIONS,
    purchaseOrders: [],
    customers: MOCK_CUSTOMERS,
    shipments: MOCK_SHIPMENTS,
    calendarEvents: [],
    suppliers: MOCK_SUPPLIERS,
    inboundShipments: MOCK_INBOUND_SHIPMENTS,
    adCampaigns: MOCK_AD_CAMPAIGNS,
    influencers: MOCK_INFLUENCERS,
    toasts: [],
    isMobileMenuOpen: false
};

// --- Initializer ---
const init = (initial: AppState): AppState => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { 
                ...initial, 
                ...parsed, 
                // Ensure configs exist even if loading old state
                supabaseConfig: parsed.supabaseConfig || { url: '', key: '', lastSync: null },
                echotikConfig: parsed.echotikConfig || { username: '', password: '', region: 'US' },
                toasts: [], 
                isMobileMenuOpen: false 
            };
        }
    } catch (e) {
        console.error("Failed to load state", e);
    }
    return initial;
};

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'SET_SUPABASE_CONFIG':
            return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'SET_ECHOTIK_CONFIG':
            return { ...state, echotikConfig: { ...state.echotikConfig, ...action.payload } };
        case 'SET_LAST_SYNC':
            return { ...state, supabaseConfig: { ...state.supabaseConfig, lastSync: action.payload } };
        case 'HYDRATE_STATE':
            return { ...state, ...action.payload };
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'TOGGLE_MOBILE_MENU':
            return { ...state, isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.isMobileMenuOpen };
        
        // --- Domain Logic ---
        case 'UPDATE_PRODUCT':
            return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'ADD_PRODUCT':
            return { ...state, products: [action.payload, ...state.products] };
        case 'DELETE_PRODUCT':
            return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: new Date().toISOString() } : p) };
        case 'RESTORE_PRODUCT':
            return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: undefined } : p) };
        case 'PERMANENT_DELETE_PRODUCT':
            return { ...state, products: state.products.filter(p => p.id !== action.payload) };
        
        case 'ADD_ORDER':
            return { ...state, orders: [action.payload, ...state.orders] };
        case 'UPDATE_ORDER':
            return { ...state, orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o) };
        case 'DELETE_ORDER':
            return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: new Date().toISOString() } : o) };
        case 'RESTORE_ORDER':
            return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: undefined } : o) };
        case 'PERMANENT_DELETE_ORDER':
            return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        
        case 'UPDATE_ORDER_STATUS':
            return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) };
        
        case 'SHIP_ORDER': {
            const { orderId, shippingMethod, trackingNumber } = action.payload;
            const newOrders = state.orders.map(o => o.id === orderId ? { ...o, status: 'shipped' as const, shippingMethod, trackingNumber } : o);
            // Logic: Deduct Inventory
            const order = state.orders.find(o => o.id === orderId);
            let newProducts = [...state.products];
            if (order && order.status !== 'shipped' && order.lineItems) {
                order.lineItems.forEach(item => {
                    const pIndex = newProducts.findIndex(p => p.id === item.productId);
                    if (pIndex > -1) {
                        newProducts[pIndex] = { ...newProducts[pIndex], stock: newProducts[pIndex].stock - item.quantity };
                    }
                });
            }
            return { ...state, orders: newOrders, products: newProducts };
        }

        case 'PAY_ORDER': {
            const orderId = action.payload;
            const order = state.orders.find(o => o.id === orderId);
            if (!order || order.paymentStatus === 'paid') return state;
            const newOrders = state.orders.map(o => o.id === orderId ? { ...o, paymentStatus: 'paid' as const } : o);
            const newTransaction: Transaction = {
                id: `TRX-INC-${Date.now()}`, date: new Date().toISOString().split('T')[0], type: 'income', category: 'Revenue',
                amount: order.total, currency: 'USD', description: `Order Payment: ${order.id}`, status: 'completed', paymentMethod: 'CreditCard', relatedOrderId: order.id
            };
            return { ...state, orders: newOrders, transactions: [newTransaction, ...state.transactions] };
        }

        case 'CLEANUP_TRASH': {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return {
                ...state,
                products: state.products.filter(p => !p.deletedAt || new Date(p.deletedAt) > sevenDaysAgo),
                orders: state.orders.filter(o => !o.deletedAt || new Date(o.deletedAt) > sevenDaysAgo)
            };
        }

        case 'ADD_TRANSACTION': return { ...state, transactions: [action.payload, ...state.transactions] };
        case 'CREATE_PO': return { ...state, purchaseOrders: [action.payload, ...state.purchaseOrders] };
        case 'RECEIVE_PO': {
            const po = state.purchaseOrders.find(p => p.id === action.payload);
            if (!po || po.status === 'received') return state;
            const newPOs = state.purchaseOrders.map(p => p.id === action.payload ? { ...p, status: 'received' as const } : p);
            const newProducts = [...state.products];
            po.items.forEach(item => {
                const prodIndex = newProducts.findIndex(p => p.id === item.productId);
                if (prodIndex > -1) newProducts[prodIndex] = { ...newProducts[prodIndex], stock: newProducts[prodIndex].stock + item.quantity };
            });
            const newTransaction: Transaction = {
                id: `TRX-PO-${Date.now()}`, date: new Date().toISOString().split('T')[0], type: 'expense', category: 'COGS',
                amount: po.totalAmount, currency: 'CNY', description: `Payment for PO ${po.id}`, status: 'completed', paymentMethod: 'Bank', relatedPOId: po.id
            };
            return { ...state, products: newProducts, purchaseOrders: newPOs, transactions: [newTransaction, ...state.transactions] };
        }

        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers] };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers] };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments] };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload) };
        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments] };
        case 'UPDATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: state.inboundShipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'UPDATE_AD_CAMPAIGN': return { ...state, adCampaigns: state.adCampaigns.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [action.payload, ...state.adCampaigns] };
        case 'DELETE_AD_CAMPAIGN': return { ...state, adCampaigns: state.adCampaigns.filter(c => c.id !== action.payload) };
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers] };
        case 'UPDATE_INFLUENCER': return { ...state, influencers: state.influencers.map(i => i.id === action.payload.id ? action.payload : i) };
        case 'DELETE_INFLUENCER': return { ...state, influencers: state.influencers.filter(i => i.id !== action.payload) };
        case 'RESET_DATA': localStorage.removeItem(DB_KEY); return mockState;
        default: return state;
    }
};

// --- Context Definition ---
const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: () => Promise<void>;
    pullFromCloud: () => Promise<void>;
}>({
    state: mockState,
    dispatch: () => null,
    showToast: () => null,
    syncToCloud: async () => {},
    pullFromCloud: async () => {}
});

// --- Provider Component ---
export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, mockState, init);

    useEffect(() => { dispatch({ type: 'CLEANUP_TRASH' }); }, []);

    useEffect(() => {
        const stateToSave = { ...state, toasts: [], isMobileMenuOpen: false };
        localStorage.setItem(DB_KEY, JSON.stringify(stateToSave));
        localStorage.setItem('tanxing_theme', state.theme);
        document.body.className = `theme-${state.theme}`;
    }, [state]);

    const showToast = (message: string, type: Toast['type']) => {
        dispatch({ type: 'ADD_TOAST', payload: { message, type } });
    };

    // --- Supabase Cloud Sync Logic ---
    const getSupabaseClient = () => {
        if (!state.supabaseConfig.url || !state.supabaseConfig.key) return null;
        try {
            return createClient(state.supabaseConfig.url, state.supabaseConfig.key);
        } catch (e) {
            console.error("Supabase init failed", e);
            return null;
        }
    };

    const syncToCloud = async () => {
        const supabase = getSupabaseClient();
        if (!supabase) { showToast('请先在设置中配置 Supabase', 'warning'); return; }
        try {
            const snapshot = {
                products: state.products, orders: state.orders, transactions: state.transactions,
                customers: state.customers, shipments: state.shipments, suppliers: state.suppliers,
                influencers: state.influencers, timestamp: new Date().toISOString()
            };
            const { error } = await supabase.from('app_backups').insert({ data: snapshot });
            if (error) throw error;
            const now = new Date().toLocaleString();
            dispatch({ type: 'SET_LAST_SYNC', payload: now });
            showToast('云端备份成功', 'success');
        } catch (e: any) {
            console.error("Sync Error", e);
            showToast(`同步失败: ${e.message}`, 'error');
        }
    };

    const pullFromCloud = async () => {
        const supabase = getSupabaseClient();
        if (!supabase) { showToast('请先在设置中配置 Supabase', 'warning'); return; }
        try {
            const { data, error } = await supabase.from('app_backups').select('*').order('updated_at', { ascending: false }).limit(1).single();
            if (error) throw error;
            if (!data) { showToast('云端无备份数据', 'info'); return; }
            if (confirm(`发现云端备份 (${data.updated_at})。是否覆盖本地数据？`)) {
                dispatch({ type: 'HYDRATE_STATE', payload: data.data });
                dispatch({ type: 'SET_LAST_SYNC', payload: new Date(data.updated_at).toLocaleString() });
                showToast('数据恢复成功', 'success');
            }
        } catch (e: any) {
            console.error("Pull Error", e);
            showToast(`拉取失败: ${e.message}`, 'error');
        }
    };

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
