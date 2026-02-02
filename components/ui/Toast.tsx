import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, action?: Toast['action']) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, action?: Toast['action']) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, type, message, action };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 4 seconds (unless it has an action)
        if (!action) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return {
        success: (message: string, action?: Toast['action']) =>
            context.addToast('success', message, action),
        error: (message: string, action?: Toast['action']) =>
            context.addToast('error', message, action),
        info: (message: string, action?: Toast['action']) =>
            context.addToast('info', message, action),
        warning: (message: string, action?: Toast['action']) =>
            context.addToast('warning', message, action),
    };
}

// Toast Container (renders all toasts)
function ToastContainer({
    toasts,
    removeToast
}: {
    toasts: Toast[];
    removeToast: (id: string) => void
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <ToastItem key={toast.id} data={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual Toast Item
function ToastItem({ data: toast, onDismiss }: { data: Toast; onDismiss: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    };

    const borderColors = {
        success: 'border-l-emerald-500',
        error: 'border-l-red-500',
        info: 'border-l-blue-500',
        warning: 'border-l-amber-500',
    };

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg',
                'bg-slate-800/95 backdrop-blur-sm border border-slate-700/50',
                'animate-in slide-in-from-right-5 fade-in duration-300',
                borderColors[toast.type]
            )}
            role="alert"
            aria-live="polite"
        >
            {icons[toast.type]}

            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-100 leading-relaxed">{toast.message}</p>

                {toast.action && (
                    <button
                        onClick={() => {
                            toast.action?.onClick();
                            onDismiss();
                        }}
                        className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ToastProvider;
