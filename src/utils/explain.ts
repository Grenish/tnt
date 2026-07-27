/**
 * Lightweight learner-mode narration for `--explain`.
 */

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";

let enabled = false;

export function setExplain(on: boolean): void {
  enabled = on;
}

export function isExplain(): boolean {
  return enabled;
}

export function explain(message: string): void {
  if (!enabled) return;
  console.log(`${DIM}explain:${RESET} ${message}`);
}

export function explainObject(
  kind: string,
  hash: string,
  detail?: string,
): void {
  if (!enabled) return;
  const extra = detail ? ` ${DIM}(${detail})${RESET}` : "";
  console.log(
    `${DIM}explain:${RESET} wrote ${CYAN}${kind}${RESET} ${hash}${extra}`,
  );
}
