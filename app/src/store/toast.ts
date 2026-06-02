import { create } from 'zustand'

export type ToastType = 'gold' | 'bad' | 'default'

export interface Toast {
  id: string
  text: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  add: (text: string, type?: ToastType) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add: (text, type = 'default') => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, text, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2800)
  },

  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
