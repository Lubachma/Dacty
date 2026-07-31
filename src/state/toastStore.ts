import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  kind: 'achievement' | 'info';
}

let nextId = 1;

interface ToastStore {
  toasts: Toast[];
  push(t: Omit<Toast, 'id'>): void;
  dismiss(id: number): void;
}

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push(t) {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 5000);
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
}));
