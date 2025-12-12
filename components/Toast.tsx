
import React, { useEffect } from 'react';
import { useTanxing } from '../context/TanxingContext';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
    const { state, dispatch } = useTanxing();

    const removeToast = (id: string) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {state.toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: any, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const styles = {
        success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/50 text-red-400',
        warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
        info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    return (
        <div className={`pointer-events-auto min-w-[300px] p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 animate-in slide-in-from-right-full duration-300 ${styles[toast.type as keyof typeof styles]}`}>
            <div className="shrink-0 mt-0.5">{icons[toast.type as keyof typeof icons]}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button onClick={() => onRemove(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ToastContainer;
