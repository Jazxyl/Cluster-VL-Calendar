export const COLORS = [
  '#69C920',
  '#2f6690',
  '#4CDC8B',
  '#8a5fc9',
  '#c2568b',
  '#4592c4',
  '#7a6a53',
  '#173143',
];

export function colorForIndex(i) {
  return COLORS[i % COLORS.length];
}
