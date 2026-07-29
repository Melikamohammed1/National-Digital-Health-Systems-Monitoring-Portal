export const LAYOUTS = {
  single: { n: 1, label: 'Single', cols: 1, rows: 1 },
  '2x2':  { n: 4, label: '2×2 Grid', cols: 2, rows: 2 },
  '3col': { n: 3, label: '3-Column', cols: 3, rows: 1 },
  custom: { n: 2, label: 'Custom', cols: 2, rows: 1 }
};

export const CUSTOM_MIN = 1;
export const CUSTOM_MAX = 12;

export function customDims(n) {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n === 3) return { cols: 3, rows: 1 };
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

export function gridDims(screen) {
  return screen.layout === 'custom'
    ? customDims(screen.slots.length)
    : { cols: LAYOUTS[screen.layout].cols, rows: LAYOUTS[screen.layout].rows };
}