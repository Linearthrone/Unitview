import { cn } from '@/lib/utils';
import type { SafetyMark, SafetyMarkShape } from '@/lib/safety-marks';

export function SafetyShape({ shape }: { shape: SafetyMarkShape }) {
  switch (shape) {
    case 'triangle':
      return (
        <span
          className="inline-block h-0 w-0 border-l-[0.35rem] border-r-[0.35rem] border-b-[0.6rem] border-l-transparent border-r-transparent border-b-current"
          aria-hidden
        />
      );
    case 'diamond':
      return <span className="inline-block h-2.5 w-2.5 rotate-45 border-2 border-current bg-transparent" aria-hidden />;
    case 'square':
      return <span className="inline-block h-2.5 w-2.5 border-2 border-current bg-transparent" aria-hidden />;
    case 'circle':
      return <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-current bg-transparent" aria-hidden />;
    case 'bar':
      return <span className="inline-block h-3.5 w-1 bg-current" aria-hidden />;
    case 'pill':
      return <span className="inline-block h-2 w-3.5 rounded-full border-2 border-current bg-transparent" aria-hidden />;
    default: {
      const _never: never = shape;
      return _never;
    }
  }
}

export const SAFETY_FRAME_CLASS: Record<SafetyMark['frame'], string> = {
  solid: 'border-2 border-solid rounded-sm',
  dashed: 'border-2 border-dashed rounded-sm',
  double: 'border-4 border-double rounded-sm',
  dotted: 'border-2 border-dotted rounded-sm',
  bar: 'border-2 border-solid border-l-4 rounded-sm',
  round: 'border-2 border-solid rounded-full',
};

export function SafetyMarkBadge({ mark }: { mark: SafetyMark }) {
  return (
    <span
      data-safety-mark={mark.id}
      className={cn(
        'inline-flex items-center gap-1.5 px-1.5 py-0.5 text-base leading-none font-semibold bg-card',
        SAFETY_FRAME_CLASS[mark.frame],
        mark.toneClass,
      )}
    >
      <SafetyShape shape={mark.shape} />
      <span>{mark.label}</span>
    </span>
  );
}
