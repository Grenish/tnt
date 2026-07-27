/**
 * Pure line-based diff helpers (no filesystem).
 * Used by `stats` (shortstat) and `tnt diff` (unified patch).
 */

export interface FileDiff {
  added: number;
  removed: number;
}

export type DiffOp =
  | { type: "equal"; line: string }
  | { type: "add"; line: string }
  | { type: "remove"; line: string };

export interface UnifiedDiffOptions {
  oldPath: string;
  newPath: string;
  /** Context lines around changes (default 3) */
  context?: number;
}

/**
 * Count added/removed lines between two text blobs using multiset line counts.
 * Cheap shortstat-style numbers for status UX.
 */
export function computeLineDiff(
  oldContent: string,
  newContent: string,
): FileDiff {
  const oldLines = splitLines(oldContent);
  const newLines = splitLines(newContent);

  const oldSet = new Map<string, number>();
  const newSet = new Map<string, number>();

  for (const line of oldLines) {
    oldSet.set(line, (oldSet.get(line) || 0) + 1);
  }

  for (const line of newLines) {
    newSet.set(line, (newSet.get(line) || 0) + 1);
  }

  let added = 0;
  let removed = 0;

  for (const [line, oldCount] of oldSet) {
    const newCount = newSet.get(line) || 0;
    if (newCount < oldCount) {
      removed += oldCount - newCount;
    }
  }

  for (const [line, newCount] of newSet) {
    const oldCount = oldSet.get(line) || 0;
    if (newCount > oldCount) {
      added += newCount - oldCount;
    }
  }

  return { added, removed };
}

/**
 * Split into lines without inventing a trailing empty line for "".
 * "a\\n" → ["a", ""]; "" → []; "a" → ["a"]
 */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.split("\n");
}

/**
 * Myers-inspired O(ND) line diff → sequence of ops.
 * Readable teaching implementation (not the absolute fastest).
 */
export function diffLines(oldText: string, newText: string): DiffOp[] {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  const n = a.length;
  const m = b.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i]![j] = (dp[i + 1]![j + 1] ?? 0) + 1;
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j] ?? 0, dp[i]![j + 1] ?? 0);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", line: a[i]! });
      i++;
      j++;
    } else if ((dp[i + 1]![j] ?? 0) >= (dp[i]![j + 1] ?? 0)) {
      ops.push({ type: "remove", line: a[i]! });
      i++;
    } else {
      ops.push({ type: "add", line: b[j]! });
      j++;
    }
  }

  while (i < n) {
    ops.push({ type: "remove", line: a[i]! });
    i++;
  }
  while (j < m) {
    ops.push({ type: "add", line: b[j]! });
    j++;
  }

  return ops;
}

/**
 * Format a classic unified diff (--- / +++ / @@ hunks).
 * Returns empty string if texts are identical.
 */
export function formatUnifiedDiff(
  oldText: string,
  newText: string,
  options: UnifiedDiffOptions,
): string {
  if (oldText === newText) {
    return "";
  }

  const context = options.context ?? 3;
  const ops = diffLines(oldText, newText);

  // Tag each op with old/new line numbers (1-based), then build hunks
  type Tagged = DiffOp & { oldNo: number | null; newNo: number | null };
  const tagged: Tagged[] = [];
  let oldNo = 1;
  let newNo = 1;

  for (const op of ops) {
    if (op.type === "equal") {
      tagged.push({ ...op, oldNo, newNo });
      oldNo++;
      newNo++;
    } else if (op.type === "remove") {
      tagged.push({ ...op, oldNo, newNo: null });
      oldNo++;
    } else {
      tagged.push({ ...op, oldNo: null, newNo });
      newNo++;
    }
  }

  // Find change regions expanded by context
  const changeIdx: number[] = [];
  for (let k = 0; k < tagged.length; k++) {
    if (tagged[k]!.type !== "equal") changeIdx.push(k);
  }

  if (changeIdx.length === 0) {
    return "";
  }

  type Hunk = { start: number; end: number }; // inclusive indices into tagged
  const hunks: Hunk[] = [];
  let hStart = Math.max(0, changeIdx[0]! - context);
  let hEnd = Math.min(tagged.length - 1, changeIdx[0]! + context);

  for (let c = 1; c < changeIdx.length; c++) {
    const idx = changeIdx[c]!;
    const nextStart = Math.max(0, idx - context);
    if (nextStart <= hEnd + 1) {
      hEnd = Math.min(tagged.length - 1, idx + context);
    } else {
      hunks.push({ start: hStart, end: hEnd });
      hStart = nextStart;
      hEnd = Math.min(tagged.length - 1, idx + context);
    }
  }
  hunks.push({ start: hStart, end: hEnd });

  const lines: string[] = [
    `--- ${options.oldPath}`,
    `+++ ${options.newPath}`,
  ];

  for (const hunk of hunks) {
    const slice = tagged.slice(hunk.start, hunk.end + 1);
    let oldCount = 0;
    let newCount = 0;
    let oldStart = 0;
    let newStart = 0;
    let oldStartSet = false;
    let newStartSet = false;

    for (const t of slice) {
      if (t.type === "equal" || t.type === "remove") {
        if (!oldStartSet && t.oldNo !== null) {
          oldStart = t.oldNo;
          oldStartSet = true;
        }
        oldCount++;
      }
      if (t.type === "equal" || t.type === "add") {
        if (!newStartSet && t.newNo !== null) {
          newStart = t.newNo;
          newStartSet = true;
        }
        newCount++;
      }
    }

    // Empty file edge cases
    if (!oldStartSet) oldStart = 0;
    if (!newStartSet) newStart = 0;

    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);

    for (const t of slice) {
      if (t.type === "equal") {
        lines.push(` ${t.line}`);
      } else if (t.type === "remove") {
        lines.push(`-${t.line}`);
      } else {
        lines.push(`+${t.line}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Colorize unified diff lines for TTY output.
 */
export function colorizeUnifiedDiff(patch: string): string {
  const GREEN = "\x1b[32m";
  const RED = "\x1b[31m";
  const CYAN = "\x1b[36m";
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";

  return patch
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++") || line.startsWith("---")) {
        return `${BOLD}${line}${RESET}`;
      }
      if (line.startsWith("@@")) {
        return `${CYAN}${line}${RESET}`;
      }
      if (line.startsWith("+")) {
        return `${GREEN}${line}${RESET}`;
      }
      if (line.startsWith("-")) {
        return `${RED}${line}${RESET}`;
      }
      return line;
    })
    .join("\n");
}
