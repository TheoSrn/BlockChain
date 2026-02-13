/**
 * Hook pour gérer l'état des modals
 */

import { useState, useCallback } from 'react';

export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook pour gérer plusieurs modals
 */
export function useModals<T extends string>(modals: T[]) {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());

  const open = useCallback((modal: T) => {
    setOpenModals((prev) => new Set(prev).add(modal));
  }, []);

  const close = useCallback((modal: T) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      next.delete(modal);
      return next;
    });
  }, []);

  const toggle = useCallback((modal: T) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      if (next.has(modal)) {
        next.delete(modal);
      } else {
        next.add(modal);
      }
      return next;
    });
  }, []);

  const isOpen = useCallback((modal: T) => openModals.has(modal), [openModals]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
