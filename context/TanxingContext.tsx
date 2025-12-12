
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product, Order, Transaction, PurchaseOrder, Toast, Customer, Shipment, CalendarEvent, Supplier, InboundShipment, AdCampaign, Influencer } from '../types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_SHIPMENTS, MOCK_SUPPLIERS, MOCK_INBOUND_SHIPMENTS, MOCK_AD_CAMPAIGNS, MOCK_INFLUENCERS } from '../constants';
import Logger from '../utils/logger';

// --- Theme Types ---
export type Theme = 'ios' | 'cyber' | 'obsidian';

// --- State Interface ---
interface AppState {
    theme: Theme; // NEW
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
    | { type: 'SET_THEME'; payload: Theme } // NEW
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: string }
    | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
    // Product Actions
    | { type: 'UPDATE_PRODUCT'; payload: Product }
    | { type: 'ADD_PRODUCT'; payload: Product }
    | { type: 'DELETE_PRODUCT'; payload: string }
    | { type: 'RESTORE_PRODUCT'; payload: string }
    | { type: 'PERMANENT_DELETE_PRODUCT'; payload: string }
    // Order Actions
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
    | { type: 'SHIP_ORDER'; payload: { orderId: string; shippingMethod: string; trackingNumber: string } }
    | { type: 'DELETE_ORDER'; payload: string }
    | { type: 'RESTORE_ORDER'; payload: string }
    | { type: 'PERMANENT_DELETE_ORDER'; payload: string }
    // Cleanup
    | { type: 'CLEANUP_TRASH' }
    // Transaction Actions
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    // Procurement Actions
    | { type: 'CREATE_PO'; payload: PurchaseOrder }
    | { type: 'RECEIVE_PO'; payload: string }
    // Supplier Actions
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
    | { type: 'DELETE_SUPPLIER'; payload: string }
    // Inbound Shipment Actions
    | { type: 'CREATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
    // Ad Campaign Actions
    | { type: 'UPDATE_AD_CAMPAIGN'; payload: AdCampaign }
    | { type: 'CREATE_AD_CAMPAIGN'; payload: AdCampaign }
    // Influencer Actions
    | { type: 'ADD_INFLUENCER'; payload: Influencer }
    | { type: 'UPDATE_INFLUENCER'; payload: Influencer }
    | { type: 'DELETE_INFLUENCER'; payload: string }
    // Generic
    | { type: 'INIT_DATA' };

// --- Initial State ---
const initialState: AppState = {
    theme: 'ios', // Default Theme
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

// --- Reducer ---
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [...state.toasts, { ...action.payload, id: Date.now().toString() }]
            };
        case 'REMOVE_TOAST':
            return {
                ...state,
                toasts: state.toasts.filter(t => t.id !== action.payload)
            };
        case 'TOGGLE_MOBILE_MENU':
            return {
                ...state,
                isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.isMobileMenuOpen
            };
        case 'UPDATE_PRODUCT':
            return {
                ...state,
                products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
            };
        case 'ADD_PRODUCT':
            return {
                ...state,
                products: [action.payload, ...state.products]
            };
        case 'DELETE_PRODUCT':
            return {
                ...state,
                products: state.products.map(p => 
                    p.id === action.payload 
                    ? { ...p, deletedAt: new Date().toISOString() } 
                    : p
                )
            };
        case 'RESTORE_PRODUCT':
            return {
                ...state,
                products: state.products.map(p => 
                    p.id === action.payload 
                    ? { ...p, deletedAt: undefined } 
                    : p
                )
            };
        case 'PERMANENT_DELETE_PRODUCT':
            return {
                ...state,
                products: state.products.filter(p => p.id !== action.payload)
            };
        case 'DELETE_ORDER':
            return {
                ...state,
                orders: state.orders.map(o => 
                    o.id === action.payload 
                    ? { ...o, deletedAt: new Date().toISOString() } 
                    : o
                )
            };
        case 'RESTORE_ORDER':
            return {
                ...state,
                orders: state.orders.map(o => 
                    o.id === action.payload 
                    ? { ...o, deletedAt: undefined } 
                    : o
                )
            };
        case 'PERMANENT_DELETE_ORDER':
            return {
                ...state,
                orders: state.orders.filter(o => o.id !== action.payload)
            };
        case 'CLEANUP_TRASH': {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const cleanedProducts = state.products.filter(p => {
                if (!p.deletedAt) return true;
                const deletedDate = new Date(p.deletedAt);
                return deletedDate > sevenDaysAgo;
            });

            const cleanedOrders = state.orders.filter(o => {
                if (!o.deletedAt) return true;
                const deletedDate = new Date(o.deletedAt);
                return deletedDate > sevenDaysAgo;
            });

            return {
                ...state,
                products: cleanedProducts,
                orders: cleanedOrders
            };
        }
        case 'UPDATE_ORDER_STATUS': {
            const { orderId, status } = action.payload;
            return {
                ...state,
                orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
            };
        }
        case 'SHIP_ORDER': {
            const { orderId, shippingMethod, trackingNumber } = action.payload;
            const newOrders = state.orders.map(o => 
                o.id === orderId 
                ? { ...o, status: 'shipped' as const, shippingMethod, trackingNumber } 
                : o
            );
            return {
                ...state,
                orders: newOrders
            };
        }
        case 'ADD_TRANSACTION':
            return {
                ...state,
                transactions: [action.payload, ...state.transactions]
            };
        case 'CREATE_PO':
            return {
                ...state,
                purchaseOrders: [action.payload, ...state.purchaseOrders]
            };
        case 'RECEIVE_PO': {
            const po = state.purchaseOrders.find(p => p.id === action.payload);
            if (!po || po.status === 'received') return state;
            const newProducts = [...state.products];
            po.items.forEach(item => {
                const prodIndex = newProducts.findIndex(p => p.id === item.productId);
                if (prodIndex > -1) {
                    newProducts[prodIndex] = {
                        ...newProducts[prodIndex],
                        stock: newProducts[prodIndex].stock + item.quantity
                    };
                }
            });
            const newTransaction: Transaction = {
                id: `TRX-PO-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: 'COGS',
                amount: po.totalAmount,
                currency: 'CNY', 
                description: `Payment for PO ${po.id} (${po.supplier})`,
                status: 'completed',
                paymentMethod: 'Bank',
                relatedPOId: po.id
            };
            const newPOs = state.purchaseOrders.map(p => 
                p.id === action.payload ? { ...p, status: 'received' as const } : p
            );
            return {
                ...state,
                products: newProducts,
                purchaseOrders: newPOs,
                transactions: [newTransaction, ...state.transactions]
            };
        }
        case 'ADD_SUPPLIER':
            return {
                ...state,
                suppliers: [action.payload, ...state.suppliers]
            };
        case 'UPDATE_SUPPLIER':
            return {
                ...state,
                suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s)
            };
        case 'DELETE_SUPPLIER':
            return {
                ...state,
                suppliers: state.suppliers.filter(s => s.id !== action.payload)
            };
        case 'CREATE_INBOUND_SHIPMENT':
            return {
                ...state,
                inboundShipments: [action.payload, ...state.inboundShipments]
            };
        case 'UPDATE_INBOUND_SHIPMENT':
            return {
                ...state,
                inboundShipments: state.inboundShipments.map(s => s.id === action.payload.id ? action.payload : s)
            };
        case 'UPDATE_AD_CAMPAIGN':
            return {
                ...state,
                adCampaigns: state.adCampaigns.map(c => c.id === action.payload.id ? action.payload : c)
            };
        case 'CREATE_AD_CAMPAIGN':
            return {
                ...state,
                adCampaigns: [action.payload, ...state.adCampaigns]
            };
        case 'ADD_INFLUENCER':
            return {
                ...state,
                influencers: [action.payload, ...state.influencers]
            };
        case 'UPDATE_INFLUENCER':
            return {
                ...state,
                influencers: state.influencers.map(i => i.id === action.payload.id ? action.payload : i)
            };
        case 'DELETE_INFLUENCER':
            return {
                ...state,
                influencers: state.influencers.filter(i => i.id !== action.payload)
            };
        case 'INIT_DATA':
            // Load saved theme
            const savedTheme = localStorage.getItem('tanxing_theme') as Theme;
            return {
                ...state,
                theme: savedTheme || 'ios'
            };
        default:
            return state;
    }
};

// --- Context Definition ---
const TanxingContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    showToast: (message: string, type: Toast['type']) => void;
}>({
    state: initialState,
    dispatch: () => null,
    showToast: () => null
});

// --- Provider Component ---
export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        dispatch({ type: 'INIT_DATA' });
        dispatch({ type: 'CLEANUP_TRASH' });
    }, []);

    // Persist theme changes
    useEffect(() => {
        localStorage.setItem('tanxing_theme', state.theme);
        // Apply theme class to body
        document.body.className = `theme-${state.theme}`;
    }, [state.theme]);

    const showToast = (message: string, type: Toast['type']) => {
        dispatch({ type: 'ADD_TOAST', payload: { message, type } });
    };

    return (
        <TanxingContext.Provider value={{ state, dispatch, showToast }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
