/** Глобальные тосты. Вызов из любого места: toast.success("Сохранено"). */
import { create } from "zustand";

export type ToastKind = "success" | "error";

export type ToastItem = {
  id: number;
  kind: ToastKind;
  text: string;
};

type ToastState = {
  items: ToastItem[];
  push: (kind: ToastKind, text: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;
const TTL = 2200;

export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (kind, text) => {
    const id = nextId++;
    set((s) => ({ items: [...s.items.slice(-2), { id, kind, text }] }));
    setTimeout(() => get().dismiss(id), TTL);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (text: string) => useToasts.getState().push("success", text),
  error: (text: string) => useToasts.getState().push("error", text),
};
