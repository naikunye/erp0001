
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Product, Transaction, Toast, Customer, Shipment, CalendarEvent, Supplier, AdCampaign, Influencer, Page, InboundShipment, InfluencerStatus, Order } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS, MOCK_SHIPMENTS, MOCK_INBOUND_SHIPMENTS, MOCK_ORDERS } from '../constants';

// --- Theme Types ---
export type Theme = 'ios-glass' | 'ios-depth' | 'ios-titanium';

const DB_KEY = 'TANXING_DB_V3';

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
    isMobileMenuOpen: boolean;
}

type Action =
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'NAVIGATE'; payload: { page: Page; params?: { searchQuery?: string } } }
    | { type: 'CLEAR_NAV_PARAMS' }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'SET_SUPABASE_CONFIG'; payload: { url: string; key: string } }
    | { type: 'SET_LAST_SYNC'; payload: string }
    | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'RESTORE_ORDER'; payload: string }
    | { type: 'PERMANENT_DELETE_ORDER'; payload: string }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'UPDATE_AD_CAMPAIGN'; payload: AdCampaign }
    // Fix: Added missing ad campaign actions to Action type
    | { type: 'CREATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'DELETE_AD_CAMPAIGN'; payload: string }
    | { type: 'SEND_SAMPLE'; payload: { influencerId: string; sku: string; cost: number } }
    // Fix: Added missing influencer actions to Action type
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    | { type: 'RESTORE_PRODUCT'; payload: string }
    | { type: 'PERMANENT_DELETE_PRODUCT'; payload: string }
    | { type: 'ADD_CUSTOMER'; payload: Customer }
    | { type: 'UPDATE_CUSTOMER'; payload: Customer }
    | { type: 'DELETE_CUSTOMER'; payload: string }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    | { type: 'ADD_SHIPMENT'; payload: Shipment }
    | { type: 'UPDATE_SHIPMENT'; payload: Shipment }
    | { type: 'DELETE_SHIPMENT'; payload: string }
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
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
    adCampaigns: MOCK_AD_CAMPAIGNS.map((c, i) => ({ ...c, relatedSku: MOCK_PRODUCTS[i % MOCK_PRODUCTS.length].sku })),
    influencers: MOCK_INFLUENCERS,
    inboundShipments: MOCK_INBOUND_SHIPMENTS,
    toasts: [],
    isMobileMenuOpen: false
};

const init = (initial: AppState): AppState => {
    try {
        const saved = localStorage.getItem(DB_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            let theme = parsed.theme;
            if (theme === 'ceramic-light') theme = 'ios-glass';
            return { ...initial, ...parsed, theme, toasts: [], isMobileMenuOpen: false };
        }
    } catch (e) { console.error(e); }
    return initial;
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'NAVIGATE': return { ...state, activePage: action.payload.page, navParams: action.payload.params || {} };
        case 'CLEAR_NAV_PARAMS': return { ...state, navParams: {} };
        case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }] };
        case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        case 'SET_SUPABASE_CONFIG': return { ...state, supabaseConfig: { ...state.supabaseConfig, ...action.payload } };
        case 'SET_LAST_SYNC': return { ...state, supabaseConfig: { ...state.supabaseConfig, lastSync: action.payload } };
        case 'HYDRATE_STATE': return { ...state, ...action.payload };
        
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'ADD_PRODUCT': return { ...state, products: [action.payload, ...state.products] };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: new Date().toISOString() } : p) };
        case 'RESTORE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deletedAt: undefined } : p) };
        case 'PERMANENT_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };

        case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] };
        case 'DELETE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: new Date().toISOString() } : o) };
        case 'UPDATE_ORDER_STATUS': return { ...state, orders: state.orders.map(o => o.id === action.payload.orderId ? { ...o, status: action.payload.status } : o) };
        case 'RESTORE_ORDER': return { ...state, orders: state.orders.map(o => o.id === action.payload ? { ...o, deletedAt: undefined } : o) };
        case 'PERMANENT_DELETE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };

        case 'ADD_TRANSACTION': return { ...state, transactions: [action.payload, ...state.transactions] };
        case 'UPDATE_AD_CAMPAIGN': return { ...state, adCampaigns: state.adCampaigns.map(c => c.id === action.payload.id ? action.payload : c) };
        // Fix: Implemented missing ad campaign actions
        case 'CREATE_AD_CAMPAIGN': return { ...state, adCampaigns: [action.payload, ...state.adCampaigns] };
        case 'DELETE_AD_CAMPAIGN': return { ...state, adCampaigns: state.adCampaigns.filter(c => c.id !== action.payload) };

        case 'ADD_CUSTOMER': return { ...state, customers: [action.payload, ...state.customers] };
        case 'UPDATE_CUSTOMER': return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'DELETE_CUSTOMER': return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };

        case 'ADD_SUPPLIER': return { ...state, suppliers: [action.payload, ...state.suppliers] };
        case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };

        case 'ADD_SHIPMENT': return { ...state, shipments: [action.payload, ...state.shipments] };
        case 'UPDATE_SHIPMENT': return { ...state, shipments: state.shipments.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SHIPMENT': return { ...state, shipments: state.shipments.filter(s => s.id !== action.payload) };

        case 'CREATE_INBOUND_SHIPMENT': return { ...state, inboundShipments: [action.payload, ...state.inboundShipments] };

        // Fix: Implemented missing influencer actions
        case 'ADD_INFLUENCER': return { ...state, influencers: [action.payload, ...state.influencers] };
        case 'UPDATE_INFLUENCER': return { ...state, influencers: state.influencers.map(i => i.id === action.payload.id ? action.payload : i) };
        case 'DELETE_INFLUENCER': return { ...state, influencers: state.influencers.filter(i => i.id !== action.payload) };

        case 'SEND_SAMPLE': {
            const { influencerId, sku, cost } = action.payload;
            const targetInf = state.influencers.find(i => i.id === influencerId);
            const updatedInfluencers = state.influencers.map(inf => 
                inf.id === influencerId ? { 
                    ...inf, 
                    status: 'Sample Sent' as InfluencerStatus, 
                    sampleProductSku: sku, 
                    sampleDate: new Date().toISOString().split('T')[0], 
                    sampleCost: cost 
                } : inf
            );
            const updatedProducts = state.products.map(p => p.sku === sku ? { ...p, stock: Math.max(0, p.stock - 1) } : p);
            const newTransaction: Transaction = {
                id: `TX-SAMPLE-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: 'Marketing',
                amount: cost,
                currency: 'USD',
                description: `Influencer Sample Seeding: ${sku} to ${targetInf?.handle || 'Unknown'}`,
                status: 'completed',
                paymentMethod: 'Other'
            };
            return { 
                ...state, 
                influencers: updatedInfluencers, 
                products: updatedProducts, 
                transactions: [newTransaction, ...state.transactions] 
            };
        }
        case 'TOGGLE_MOBILE_MENU': return { ...state, isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.isMobileMenuOpen };
        case 'RESET_DATA': localStorage.removeItem(DB_KEY); return mockState;
        default: return state;
    }
};

const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
    syncToCloud: (silent?: boolean) => Promise<void>;
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
    const [state, dispatch] = useReducer(appReducer, mockState, init);

    useEffect(() => {
        const stateToSave = { ...state, toasts: [], isMobileMenuOpen: false };
        localStorage.setItem(DB_KEY, JSON.stringify(stateToSave));
        document.body.className = `theme-${state.theme}`;
        if (state.supabaseConfig.url && state.supabaseConfig.key) {
            // Auto sync can be added here if needed
        }
    }, [state]);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });
    const getSupabaseClient = () => (state.supabaseConfig.url && state.supabaseConfig.key) ? createClient(state.supabaseConfig.url, state.supabaseConfig.key) : null;

    const syncToCloud = async (silent = false) => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const snapshot = { ...state, toasts: [], isMobileMenuOpen: false };
            const { error } = await supabase.from('app_backups').insert({ data: snapshot });
            if (error) throw error;
            dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toLocaleString() });
        } catch (e: any) { if (!silent) showToast(`同步失败: ${e.message}`, 'error'); }
    };

    const pullFromCloud = async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            const { data, error } = await supabase.from('app_backups').select('*').order('updated_at', { ascending: false }).limit(1).single();
            if (error) throw error;
            if (data) {
                dispatch({ type: 'HYDRATE_STATE', payload: data.data });
                dispatch({ type: 'SET_LAST_SYNC', payload: new Date(data.updated_at).toLocaleString() });
                showToast('数据已从云端拉取', 'success');
            }
        } catch (e: any) { showToast(`拉取失败: ${e.message}`, 'error'); }
    };

    const checkCloudVersion = async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return null;
        try {
            const { data } = await supabase.from('app_backups').select('updated_at').order('updated_at', { ascending: false }).limit(1).single();
            return data?.updated_at || null;
        } catch { return null; }
    };

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast, syncToCloud, pullFromCloud, checkCloudVersion }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
