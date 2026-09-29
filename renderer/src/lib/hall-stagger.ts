import type { CSSProperties } from 'react';
import { isStaggeredHallRow } from '@/lib/progressive-view';

/** Even rows shift half a cell so a wire stub sits between the two blocks on the row above. */
export function hallStaggerRowStyle(row: number, cols: number): CSSProperties {
  const half = `calc(100% / ${Math.max(1, cols)} / 2)`;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    width: `calc(100% - ${half})`,
    marginLeft: isStaggeredHallRow(row) ? half : 0,
    gap: '0.25rem',
  };
}
