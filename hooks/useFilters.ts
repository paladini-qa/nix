import { useState, useCallback, useMemo } from "react";
import { FilterState, TransactionType } from "../types";

export interface ExtendedFilterState extends FilterState {
  searchTerm: string;
  type: "all" | TransactionType;
  category: string;
  paymentMethod: string;
}

const getInitialFilters = (): ExtendedFilterState => ({
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  searchTerm: "",
  type: "all",
  category: "all",
  paymentMethod: "all",
});

/**
 * Hook para gerenciamento de filtros de transações
 */
export function useFilters(initialState?: Partial<ExtendedFilterState>) {
  const [filters, setFilters] = useState<ExtendedFilterState>(() => ({
    ...getInitialFilters(),
    ...initialState,
  }));

  // Atualiza mês/ano
  const setDate = useCallback((month: number, year: number) => {
    setFilters((prev) => ({ ...prev, month, year }));
  }, []);

  // Atualiza termo de busca
  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, searchTerm }));
  }, []);

  // Atualiza tipo
  const setType = useCallback((type: "all" | TransactionType) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  // Atualiza categoria
  const setCategory = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  // Atualiza método de pagamento
  const setPaymentMethod = useCallback((paymentMethod: string) => {
    setFilters((prev) => ({ ...prev, paymentMethod }));
  }, []);

  // Reseta todos os filtros
  const resetFilters = useCallback(() => {
    setFilters(getInitialFilters());
  }, []);

  // Reseta apenas filtros de busca (mantém mês/ano)
  const resetSearchFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: "",
      type: "all",
      category: "all",
      paymentMethod: "all",
    }));
  }, []);

  // Navegar para mês anterior
  const previousMonth = useCallback(() => {
    setFilters((prev) => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { ...prev, month: newMonth, year: newYear };
    });
  }, []);

  // Navegar para próximo mês
  const nextMonth = useCallback(() => {
    setFilters((prev) => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { ...prev, month: newMonth, year: newYear };
    });
  }, []);

  // Ir para mês atual
  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    setFilters((prev) => ({
      ...prev,
      month: now.getMonth(),
      year: now.getFullYear(),
    }));
  }, []);

  // Verifica se está no mês atual
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return filters.month === now.getMonth() && filters.year === now.getFullYear();
  }, [filters.month, filters.year]);

  // Verifica se tem filtros ativos (além de mês/ano)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== "" ||
      filters.type !== "all" ||
      filters.category !== "all" ||
      filters.paymentMethod !== "all"
    );
  }, [filters]);

  // Conta filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm !== "") count++;
    if (filters.type !== "all") count++;
    if (filters.category !== "all") count++;
    if (filters.paymentMethod !== "all") count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    setDate,
    setSearchTerm,
    setType,
    setCategory,
    setPaymentMethod,
    resetFilters,
    resetSearchFilters,
    previousMonth,
    nextMonth,
    goToCurrentMonth,
    isCurrentMonth,
    hasActiveFilters,
    activeFiltersCount,
  };
}

export default useFilters;




