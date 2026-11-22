import { create } from "zustand";
import { Transaction, FilterState } from "@/domain/entities";
import dayjs from "dayjs";

interface UIState {
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

  // Advanced Filters
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  advancedFilters: AdvancedFiltersState;
  setFiltersState: (filters: AdvancedFiltersState | ((prev: AdvancedFiltersState) => AdvancedFiltersState)) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Transactions View Filters
  showTransactionsFilters: boolean;
  setShowTransactionsFilters: (show: boolean) => void;
  transactionsFiltersCount: number;
  setTransactionsFiltersCount: (count: number) => void;
}

export interface AdvancedFiltersState {
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  type: "all" | "income" | "expense";
  categories: string[];
  paymentMethods: string[];
}

export const useAppStore = create<UIState>((set) => ({
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

  // Advanced Filters
  showAdvancedFilters: false,
  setShowAdvancedFilters: (show) => set({ showAdvancedFilters: show }),
  advancedFilters: {
    startDate: null,
    endDate: null,
    type: "all",
    categories: [],
    paymentMethods: [],
  },
  setFiltersState: (advancedFilters) => set((state) => ({
    advancedFilters: typeof advancedFilters === "function" ? advancedFilters(state.advancedFilters) : advancedFilters,
  })),
  
  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Transactions View Filters
  showTransactionsFilters: false,
  setShowTransactionsFilters: (show) => set({ showTransactionsFilters: show }),
  transactionsFiltersCount: 0,
  setTransactionsFiltersCount: (count) => set({ transactionsFiltersCount: count }),
}));
