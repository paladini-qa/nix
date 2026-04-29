import { create } from "zustand";
import { AppCurrentView } from "../types/appView";
import { Transaction, FilterState } from "../types";
import dayjs from "dayjs";

interface UIState {
  // Navigation
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  
  // Modals & Panels
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  
  // Transaction Editing
  editingTransaction: Transaction | null;
  setEditingTransaction: (transaction: Transaction | null) => void;
  
  // Filters
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<UIState>((set) => ({
  // Navigation
  isMobileDrawerOpen: false,
  setIsMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  
  // Modals & Panels
  isFormOpen: false,
  setIsFormOpen: (open) => set({ isFormOpen: open }),
  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  isProfileModalOpen: false,
  setIsProfileModalOpen: (open) => set({ isProfileModalOpen: open }),
  
  // Transaction Editing
  editingTransaction: null,
  setEditingTransaction: (transaction) => set({ editingTransaction: transaction }),
  
  // Filters
  filters: (() => {
    const now = dayjs();
    // Se hoje for após dia 10, apresenta dados do mês seguinte
    const initialDate = now.date() > 10 ? now.add(1, "month") : now;
    return {
      month: initialDate.month(),
      year: initialDate.year(),
    };
  })(),
  setFilters: (filters) => set((state) => ({
    filters: typeof filters === "function" ? filters(state.filters) : filters,
  })),
  
  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
