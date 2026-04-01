import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  className?: string;
}

export function ScoreBar({ score, className }: ScoreBarProps) {
  const color = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive';
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{score.toFixed(0)}</span>
    </div>
  );
}
