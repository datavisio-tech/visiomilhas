/** Helpers para cálculo em centavos (inteiros) */
export const cents = (value: number): number => Math.round(value);

export const multiplyAndRound = (a: number, b: number): number =>
  Math.round(a * b);
