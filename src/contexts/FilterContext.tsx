import { createContext, useContext, useState, ReactNode } from 'react';

export type Period = '7d' | '30d' | '90d';

interface FilterContextType {
  period: Period;
  setPeriod: (p: Period) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  dateRange: { from: Date; to: Date };
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const now = new Date();
  const daysMap: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const from = new Date(now.getTime() - daysMap[period] * 86400000);
  const dateRange = { from, to: now };

  return (
    <FilterContext.Provider value={{ period, setPeriod, selectedClientId, setSelectedClientId, dateRange }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
