import { cn } from '@/lib/utils';
import type { SafetyMark, SafetyMarkShape } from '@/lib/safety-marks';

export type SafetyShapeSize = 'card' | 'map';

const SHAPE_CLASS: Record<SafetyMarkShape, Record<SafetyShapeSize, string>> = {
  triangle: {
    card: 'inline-block h-0 w-0 border-l-[0.65rem] border-r-[0.65rem] border-b-[1.1rem] border-l-transparent border-r-transparent border-b-current',
    map: 'inline-block h-0 w-0 border-l-[0.95rem] border-r-[0.95rem] border-b-[1.6rem] border-l-transparent border-r-transparent border-b-current',
  },
  diamond: {
    card: 'inline-block h-6 w-6 rotate-45 border-2 border-current bg-transparent',
    map: 'inline-block h-8 w-8 rotate-45 border-[3px] border-current bg-transparent',
  },
  square: {
    card: 'inline-block h-6 w-6 border-2 border-current bg-transparent',
    map: 'inline-block h-8 w-8 border-[3px] border-current bg-transparent',
  },
  circle: {
    card: 'inline-block h-6 w-6 rounded-full border-2 border-current bg-transparent',
    map: 'inline-block h-8 w-8 rounded-full border-[3px] border-current bg-transparent',
  },
  bar: {
    card: 'inline-block h-7 w-2 bg-current',
    map: 'inline-block h-9 w-3 bg-current',
  },
  pill: {
    card: 'inline-block h-5 w-8 rounded-full border-2 border-current bg-transparent',
    map: 'inline-block h-6 w-11 rounded-full border-[3px] border-current bg-transparent',
  },
};

export function SafetyShape({
  shape,
  size = 'card',
}: {
  shape: SafetyMarkShape;
  size?: SafetyShapeSize;
}) {
  switch (shape) {
    case 'triangle':
    case 'diamond':
    case 'square':
    case 'circle':
    case 'bar':
    case 'pill':
      return <span className={SHAPE_CLASS[shape][size]} aria-hidden />;
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

export function SafetyMarkBadge({
  mark,
  showLabel = true,
  size = 'map',
}: {
  mark: SafetyMark;
  showLabel?: boolean;
  size?: SafetyShapeSize;
}) {
  return (
    <span
      data-safety-mark={mark.id}
      data-safety-labeled={showLabel ? 'true' : 'false'}
      title={mark.label}
      aria-label={mark.label}
      className={cn(
        'inline-flex items-center font-semibold bg-card leading-none',
        showLabel ? 'gap-2 px-2.5 py-1.5 text-lg' : 'justify-center p-1.5',
        SAFETY_FRAME_CLASS[mark.frame],
        mark.toneClass,
      )}
    >
      <SafetyShape shape={mark.shape} size={size} />
      {showLabel ? (
        <span data-safety-label>{mark.label}</span>
      ) : (
        <span className="sr-only">{mark.label}</span>
      )}
    </span>
  );
}
