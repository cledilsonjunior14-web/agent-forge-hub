import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { subDays, startOfMonth, startOfToday, endOfYesterday, subMonths, endOfMonth, differenceInDays } from 'date-fns';

export type DateRange = { from: Date; to: Date; label: string };

interface FilterContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  prevDateRange: { from: Date; to: Date };
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  setPreset: (preset: 'today' | 'yesterday' | '7d' | '14d' | '30d' | 'this_month' | 'last_month') => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(startOfToday(), 6),
    to: startOfToday(),
    label: 'Últimos 7 dias'
  });
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Calcula período prévio baseando na diff exata do período atual selecionado
  const prevDateRange = useMemo(() => {
    const diff = Math.max(differenceInDays(dateRange.to, dateRange.from), 0);
    const prevTo = subDays(dateRange.from, 1);
    const prevFrom = subDays(prevTo, diff);
    return { from: prevFrom, to: prevTo };
  }, [dateRange]);

  const setPreset = (preset: string) => {
    const today = startOfToday();
    const yesterday = endOfYesterday();

    switch (preset) {
      case 'today':
        setDateRange({ from: today, to: today, label: 'Hoje' });
        break;
      case 'yesterday':
        setDateRange({ from: subDays(today, 1), to: subDays(today, 1), label: 'Ontem' });
        break;
      case '7d':
        setDateRange({ from: subDays(today, 6), to: today, label: 'Últimos 7 Dias' });
        break;
      case '14d':
        setDateRange({ from: subDays(today, 13), to: today, label: 'Últimos 14 Dias' });
        break;
      case '30d':
        setDateRange({ from: subDays(today, 29), to: today, label: 'Últimos 30 Dias' });
        break;
      case 'this_month':
        setDateRange({ from: startOfMonth(today), to: today, label: 'Este Mês' });
        break;
      case 'last_month':
        const lastM = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastM), to: endOfMonth(lastM), label: 'Mês Passado' });
        break;
    }
  };

  return (
    <FilterContext.Provider value={{ dateRange, setDateRange, prevDateRange, selectedClientId, setSelectedClientId, setPreset }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
