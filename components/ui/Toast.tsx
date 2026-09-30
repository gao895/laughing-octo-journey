'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onNotify } from '@/lib/notify';

type ToastKind = 'info' | 'success' | 'error';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3800);
  }, []);

  const value = useMemo(() => push, [push]);

  // Messages sent from outside React (lib/notify).
  useEffect(() => onNotify((message) => push(message)), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(4.5rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === 'error' ? 'alert' : 'status'}
            className={`animate-fade-in pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm shadow-lg ${
              item.kind === 'error'
                ? 'bg-red-950/95 text-red-100 ring-1 ring-red-400/40'
                : item.kind === 'success'
                  ? 'bg-emerald-950/95 text-emerald-100 ring-1 ring-emerald-400/30'
                  : 'bg-slate/95 text-paper ring-line ring-1'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
