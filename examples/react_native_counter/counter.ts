export type CounterAction = 'increment' | 'reset';

export function counterReducer(count: number, action: CounterAction): number {
  switch (action) {
    case 'increment':
      return Math.min(count + 1, Number.MAX_SAFE_INTEGER);
    case 'reset':
      return 0;
  }
}

export function canReset(count: number): boolean {
  return count > 0;
}
