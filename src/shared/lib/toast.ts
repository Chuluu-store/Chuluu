import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastState>()(
  devtools(
    (set, get) => ({
      toasts: [],

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: ToastMessage = {
          ...toast,
          id,
          duration: toast.duration ?? 3000,
          position: toast.position ?? 'top-center',
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearAllToasts: () => {
        set({ toasts: [] });
      },
    }),
    { name: 'toast-store' }
  )
);

// Convenience functions
export const toast = {
  success: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => {
    useToastStore.getState().addToast({
      message,
      type: 'success',
      ...options,
    });
  },

  error: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => {
    useToastStore.getState().addToast({
      message,
      type: 'error',
      ...options,
    });
  },

  info: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => {
    useToastStore.getState().addToast({
      message,
      type: 'info',
      ...options,
    });
  },
};
