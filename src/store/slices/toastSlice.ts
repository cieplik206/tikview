import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ToastType = 'info' | 'error' | 'success' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: []
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<{
      message: string;
      type?: ToastType;
      duration?: number;
    }>) => {
      const id = Date.now();
      const toast: Toast = {
        id,
        message: action.payload.message,
        type: action.payload.type || 'info'
      };
      state.toasts.push(toast);
      
      // Note: Duration handling will need to be done in the component or middleware
      // since Redux doesn't handle side effects like setTimeout directly
    },
    
    removeToast: (state, action: PayloadAction<number>) => {
      const index = state.toasts.findIndex(t => t.id === action.payload);
      if (index > -1) {
        state.toasts.splice(index, 1);
      }
    },
    
    clearAllToasts: (state) => {
      state.toasts = [];
    }
  }
});

export const { showToast, removeToast, clearAllToasts } = toastSlice.actions;

// Action creators with specific types
export const showError = (message: string, duration: number = 5000) => 
  showToast({ message, type: 'error', duration });

export const showSuccess = (message: string, duration: number = 5000) => 
  showToast({ message, type: 'success', duration });

export const showWarning = (message: string, duration: number = 5000) => 
  showToast({ message, type: 'warning', duration });

export const showInfo = (message: string, duration: number = 5000) => 
  showToast({ message, type: 'info', duration });

// Selectors
export const selectToasts = (state: { toast: ToastState }) => state.toast.toasts;
export const selectToastCount = (state: { toast: ToastState }) => state.toast.toasts.length;

export default toastSlice.reducer;