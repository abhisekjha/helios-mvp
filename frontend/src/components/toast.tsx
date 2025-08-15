"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

let toastContext: ToastContextType | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    toastContext = { showToast };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-card border-border text-foreground';
      case 'error':
        return 'bg-destructive/10 border-destructive text-destructive';
      default:
        return 'bg-card border-border text-foreground';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Card
            key={toast.id}
            className={`p-4 shadow-lg animate-in slide-in-from-right duration-300 ${getToastStyles(toast.type)}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getToastIcon(toast.type)}</span>
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto text-lg hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export const toast = {
  success: (message: string) => toastContext?.showToast(message, 'success'),
  error: (message: string) => toastContext?.showToast(message, 'error'),
  info: (message: string) => toastContext?.showToast(message, 'info'),
};
