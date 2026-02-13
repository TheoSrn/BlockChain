/**
 * Hook pour gérer les notifications/toasts
 * Wrapper autour de react-hot-toast ou autre library
 */

import { useCallback } from 'react';

// Type definitions for toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Mock implementation - replace with react-hot-toast in production
export function useToast() {
  const show = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    console.log(`[${type.toUpperCase()}]`, message);
    // TODO: Integrate react-hot-toast
    // toast[type](message, options);
  }, []);

  const success = useCallback((message: string, options?: ToastOptions) => {
    show(message, 'success', options);
  }, [show]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    show(message, 'error', options);
  }, [show]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    show(message, 'warning', options);
  }, [show]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    show(message, 'info', options);
  }, [show]);

  return {
    show,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Hook pour les notifications de transaction
 */
export function useTransactionToast() {
  const toast = useToast();

  const pending = useCallback((hash: string) => {
    toast.info(`Transaction submitted: ${hash.slice(0, 10)}...`);
  }, [toast]);

  const success = useCallback((hash: string) => {
    toast.success(`Transaction confirmed: ${hash.slice(0, 10)}...`);
  }, [toast]);

  const error = useCallback((error: Error) => {
    toast.error(`Transaction failed: ${error.message}`);
  }, [toast]);

  return {
    pending,
    success,
    error,
  };
}
