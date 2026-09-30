const CHAR_CODE_A = 'A'.charCodeAt(0);

/**
 * Turns a zero-based option index into its display letter (0 → "A", 1 → "B", …).
 * @param index - Zero-based position of the option.
 * @returns The matching uppercase letter.
 */
export function optionLetter(index: number): string {
  return String.fromCharCode(CHAR_CODE_A + index);
}
