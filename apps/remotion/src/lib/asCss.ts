export const asCss = (value: string | number | undefined, fallback: string): string => {
  if (typeof value === 'number') return `${value}%`;
  return value ?? fallback;
};
