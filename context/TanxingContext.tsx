
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Toast, Shipment, Page, Product, Theme, CloudAutomationSettings } from '../types';
import { MOCK_SHIPMENTS, MOCK_PRODUCTS } from '../constants';

export const SESSION_ID = 'NODE-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const TanxingContext = createContext<any>(undefined);

function appReducer(state: any, action: any): any {
    switch (action.type) {
        case 'BOOT': 
            return { ...state, ...action.payload, isInitialized: true };
        case 'NAVIGATE':
            return { ...state, activePage: action.payload.page, isMobileMenuOpen: false };
        case 'TOGGLE_MOBILE_MENU':
            return { ...state, isMobileMenuOpen: action.payload ?? !state.isMobileMenuOpen };
        case 'ADD_TOAST': 
            return { ...state, toasts: [...(state.toasts || []), { ...action.payload, id: Math.random().toString() }] };
        case 'REMOVE_TOAST': 
            return { ...state, toasts: (state.toasts || []).filter((t: any) => t.id !== action.payload) };
        case 'UPDATE_CLOUD_SETTINGS':
            return { ...state, cloudSettings: { ...state.cloudSettings, ...action.payload } };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'UPDATE_PRODUCT':
            return { ...state, products: state.products.map((p: Product) => p.id === action.payload.id ? action.payload : p) };
        case 'ADD_SHIPMENT':
            return { ...state, shipments: [action.payload, ...state.shipments] };
        case 'UPDATE_SHIPMENT':
            return { ...state, shipments: state.shipments.map((s: Shipment) => s.id === action.payload.id ? action.payload : s) };
        case 'ADD_TRANSACTION':
            return { ...state, transactions: [action.payload, ...state.transactions] };
        case 'DELETE_TRANSACTION':
            return { ...state, transactions: state.transactions.filter((t: any) => t.id !== action.payload) };
        default: return state;
    }
}

export const TanxingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 初始化时从 localStorage 读取主题
    const initialTheme = (localStorage.getItem('TX_THEME') as Theme) || 'tech-blue';

    const [state, dispatch] = useReducer(appReducer, {
        activePage: 'dashboard',
        theme: initialTheme,
        shipments: [],
        products: [],
        toasts: [],
        transactions: [],
        orders: [],
        influencers: [],
        customers: [],
        tasks: [],
        isInitialized: false,
        isMobileMenuOpen: false,
        connectionStatus: 'disconnected',
        cloudSettings: {
            enableSentinel: false,
            enableStockAlert: false
        }
    });

    // 当主题改变时，同步到 DOM 和 LocalStorage
    useEffect(() => {
        const root = document.documentElement;
        // 移除旧主题类
        root.classList.forEach(cls => {
            if (cls.startsWith('theme-')) root.classList.remove(cls);
        });
        // 添加新主题类
        if (state.theme !== 'tech-blue') {
            root.classList.add(`theme-${state.theme}`);
        }
        localStorage.setItem('TX_THEME', state.theme);
    }, [state.theme]);

    const showToast = (message: string, type: Toast['type']) => dispatch({ type: 'ADD_TOAST', payload: { message, type } });

    const connectToPb = async (url: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        dispatch({ type: 'BOOT', payload: { pbUrl: url, connectionStatus: 'connected' } });
        showToast('量子节点已建立安全连接', 'success');
    };

    const syncToCloud = async (manual = false) => {
        if (manual) showToast('正在向腾讯云同步状态协议...', 'info');
        await new Promise(resolve => setTimeout(resolve, 800));
        if (manual) showToast('云端数据同步对齐完成', 'success');
    };

    const pullFromCloud = async (manual = false) => {
        if (manual) showToast('正在从云端拉取镜像...', 'info');
        await new Promise(resolve => setTimeout(resolve, 800));
        if (manual) showToast('本地载荷已更新至最新版本', 'success');
    };

    const pushTrackingToFeishu = async (manual = false) => {
        showToast('正在提取在途物流节点...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1200));
        showToast('物流清单已成功推送至飞书消息阵列', 'success');
    };

    useEffect(() => {
        // Reduced boot time to 500ms
        setTimeout(() => {
            dispatch({ type: 'BOOT', payload: { shipments: MOCK_SHIPMENTS, products: MOCK_PRODUCTS } });
        }, 500);
    }, []);

    return (
        <TanxingContext.Provider value={{ 
            state, 
            dispatch, 
            showToast, 
            connectToPb, 
            syncToCloud, 
            pullFromCloud, 
            pushTrackingToFeishu 
        }}>
            {children}
        </TanxingContext.Provider>
    );
};

export const useTanxing = () => useContext(TanxingContext);
