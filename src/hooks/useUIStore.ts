import { create } from 'zustand';

interface UIState {
  classScrollY: number;
  isHeaderCollapsed: boolean;
  setClassScrollY: (y: number) => void;
  setIsHeaderCollapsed: (isCollapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  classScrollY: 0,
  isHeaderCollapsed: false,
  setClassScrollY: (y) => set({ classScrollY: y }),
  setIsHeaderCollapsed: (isCollapsed) =>
    set({ isHeaderCollapsed: isCollapsed }),
}));