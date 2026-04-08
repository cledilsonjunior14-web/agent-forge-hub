import { useState, useEffect } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';

export function DateRangePicker() {
  const { dateRange, setPreset, setDateRange } = useFilters();
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('7d');

  // Custom states that apply only when clicking "Aplicar"
  const [customFrom, setCustomFrom] = useState(dateRange.from.toISOString().split('T')[0]);
  const [customTo, setCustomTo] = useState(dateRange.to.toISOString().split('T')[0]);

  // Sync state if context changes externally
  useEffect(() => {
    if (dateRange.label === 'Personalizado') {
      setActivePreset('custom');
      setCustomFrom(dateRange.from.toISOString().split('T')[0]);
      setCustomTo(dateRange.to.toISOString().split('T')[0]);
    }
  }, [dateRange]);

  const presets = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '14d', label: 'Últimos 14 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: 'this_month', label: 'Este mês' },
    { id: 'last_month', label: 'Mês passado' },
    { id: 'custom', label: 'Personalizado' }
  ];

  const handleApply = () => {
    if (activePreset === 'custom') {
      setDateRange({
        from: new Date(customFrom + 'T00:00:00'),
        to: new Date(customTo + 'T23:59:59'),
        label: 'Personalizado'
      });
    } else {
      setPreset(activePreset as any);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-semibold justify-between min-w-[150px] shadow-sm hover:border-primary/50 transition-colors">
          <span className="flex items-center gap-2 text-foreground/80"><CalendarIcon className="h-3.5 w-3.5" /> {dateRange.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[330px] p-0 shadow-xl border-border/80" align="end">
        <div className="flex flex-col">
          <div className="p-3 bg-secondary/10 border-b border-border text-[10px] text-muted-foreground font-black uppercase tracking-wider flex items-center justify-between">
            <span>Intervalo Mestre</span>
            <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">AUTO-COMPARE ATIVO</span>
          </div>

          <div className="flex">
            {/* Presets List */}
            <div className="w-[140px] border-r border-border p-1.5 space-y-0.5 bg-secondary/5">
              {presets.map(p => (
                <div
                  key={p.id}
                  onClick={() => setActivePreset(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors select-none ${activePreset === p.id ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {p.label}
                </div>
              ))}
            </div>

            {/* Custom Selector Input */}
            <div className="flex-1 p-3 flex flex-col justify-center bg-background">
              {activePreset !== 'custom' ? (
                <div className="text-center space-y-3">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-[11px] text-muted-foreground px-2 leading-relaxed font-medium">
                    O sistema agregará os KPIs a este bloco fixo e o comparará ao último.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Inicial</label>
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full h-8 text-xs bg-secondary/30 focus:bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/40 rounded px-2 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Data Final</label>
                    <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full h-8 text-xs bg-secondary/30 focus:bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary/40 rounded px-2 outline-none transition-all" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-border bg-secondary/20 flex justify-end">
            <Button size="sm" onClick={handleApply} className="text-xs h-8 px-6 font-bold shadow hover:scale-105 active:scale-95 transition-all">Aplicar Filtro</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
