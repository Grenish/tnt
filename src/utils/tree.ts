import type { FileEntry } from "./types";

export interface TreeEntry {
  /** basename only */
  name: string;
  type: "blob" | "tree";
  hash: string;
}

/**
 * Canonical tree body: lines sorted by name.
 * Format: `<type> <hash> <name>\n`
 */
export function serializeTree(entries: TreeEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map((e) => `${e.type} ${e.hash} ${e.name}`).join("\n") + (sorted.length ? "\n" : "");
}

export function parseTree(body: string): TreeEntry[] {
  const entries: TreeEntry[] = [];

  for (const line of body.split("\n")) {
    if (!line.trim()) continue;
    const match = /^(blob|tree) ([0-9a-f]+) (.+)$/.exec(line);
    if (!match || !match[1] || !match[2] || !match[3]) continue;
    entries.push({
      type: match[1] as "blob" | "tree",
      hash: match[2],
      name: match[3],
    });
  }

  return entries;
}

/**
 * Canonical commit body (no id — id is the hash of this body as a commit object).
 *
 * ```
 * tree <hash>
 * parent <hash>   # optional, one line
 * timestamp <iso>
 *
 * <message>
 * ```
 */
export function serializeCommitBody(fields: {
  tree: string;
  parent?: string;
  timestamp: string;
  message: string;
}): string {
  const lines = [`tree ${fields.tree}`];
  if (fields.parent) {
    lines.push(`parent ${fields.parent}`);
  }
  lines.push(`timestamp ${fields.timestamp}`);
  lines.push("");
  lines.push(fields.message);
  if (!fields.message.endsWith("\n")) {
    // message may be multi-line; ensure body ends cleanly without forcing extra blank
  }
  return lines.join("\n");
}

export function parseCommitBody(body: string): {
  tree: string;
  parent?: string;
  timestamp: string;
  message: string;
} {
  const lines = body.split("\n");
  let tree = "";
  let parent: string | undefined;
  let timestamp = "";
  let i = 0;

  for (; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line === "") {
      i++;
      break;
    }
    if (line.startsWith("tree ")) {
      tree = line.slice(5).trim();
    } else if (line.startsWith("parent ")) {
      parent = line.slice(7).trim();
    } else if (line.startsWith("timestamp ")) {
      timestamp = line.slice(10).trim();
    }
  }

  const message = lines.slice(i).join("\n").replace(/\n$/, "");

  return { tree, parent, timestamp, message };
}

/** Nested dir map for building trees from flat path list */
type Nested = {
  files: Map<string, string>; // name -> blob hash
  dirs: Map<string, Nested>;
};

function emptyNested(): Nested {
  return { files: new Map(), dirs: new Map() };
}

/**
 * Insert flat file paths into a nested structure (pure).
 */
export function nestFileEntries(files: FileEntry[]): Nested {
  const root = emptyNested();

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      let child = node.dirs.get(part);
      if (!child) {
        child = emptyNested();
        node.dirs.set(part, child);
      }
      node = child;
    }

    const base = parts[parts.length - 1]!;
    node.files.set(base, file.hash);
  }

  return root;
}

/**
 * Pure: given a nested structure and a function to hash/store a tree body,
 * return root tree hash. `writeTreeBody` is injected for testability.
 */
export function writeNestedTrees(
  nested: Nested,
  writeTreeBody: (body: string) => string,
): string {
  const entries: TreeEntry[] = [];

  for (const [name, hash] of nested.files) {
    entries.push({ name, type: "blob", hash });
  }

  for (const [name, child] of nested.dirs) {
    const childHash = writeNestedTrees(child, writeTreeBody);
    entries.push({ name, type: "tree", hash: childHash });
  }

  return writeTreeBody(serializeTree(entries));
}

/**
 * Flatten a tree by resolving child trees via `readTreeEntries`.
 */
export function flattenTree(
  rootHash: string,
  readTreeEntries: (hash: string) => TreeEntry[] | null,
  prefix = "",
): FileEntry[] {
  const entries = readTreeEntries(rootHash);
  if (!entries) {
    return [];
  }

  const files: FileEntry[] = [];

  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.type === "blob") {
      files.push({ path, hash: entry.hash });
    } else {
      files.push(...flattenTree(entry.hash, readTreeEntries, path));
    }
  }

  return files;
}
