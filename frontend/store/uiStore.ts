/**
 * UI Store - État global de l'interface
 * Modals, sidebars, notifications, etc.
 */

import { create } from 'zustand';

interface UIState {
  // Modals
  modals: Set<string>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Loading states
  loadingStates: Map<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  addNotification: (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  // Modals
  modals: new Set(),
  openModal: (modalId) =>
    set((state) => {
      const newModals = new Set(state.modals);
      newModals.add(modalId);
      return { modals: newModals };
    }),
  closeModal: (modalId) =>
    set((state) => {
      const newModals = new Set(state.modals);
      newModals.delete(modalId);
      return { modals: newModals };
    }),
  isModalOpen: (modalId) => get().modals.has(modalId),
  
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Loading states
  loadingStates: new Map(),
  setLoading: (key, loading) =>
    set((state) => {
      const newLoadingStates = new Map(state.loadingStates);
      if (loading) {
        newLoadingStates.set(key, true);
      } else {
        newLoadingStates.delete(key);
      }
      return { loadingStates: newLoadingStates };
    }),
  isLoading: (key) => get().loadingStates.get(key) || false,
  
  // Notifications
  notifications: [],
  addNotification: (type, message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Math.random().toString(36).substring(7),
          type,
          message,
          timestamp: Date.now(),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
