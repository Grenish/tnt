import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getTntDir } from "./paths";

export type ObjectType = "blob" | "tree" | "commit";

export interface StoredObject {
  type: ObjectType;
  content: string;
  /** Full on-disk payload: `${type} ${byteLength}\\0${content}` */
  raw: string;
}

/**
 * SHA-256 truncated to 12 hex chars (stable id for all object types).
 */
export function hashBytes(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 12);
}

/**
 * Git-style object hash: sha256(type + " " + size + "\\0" + content).
 */
export function hashObject(type: ObjectType, content: string): string {
  const byteLength = Buffer.byteLength(content, "utf-8");
  const payload = Buffer.concat([
    Buffer.from(`${type} ${byteLength}\0`, "utf-8"),
    Buffer.from(content, "utf-8"),
  ]);
  return hashBytes(payload);
}

function objectPath(hash: string, cwd: string): string {
  return path.join(getTntDir(cwd), "objects", hash);
}

function ensureObjectsDir(cwd: string): string {
  const dir = path.join(getTntDir(cwd), "objects");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Store a typed object. Returns its content-addressed hash.
 * Idempotent if the object already exists.
 */
export function storeObject(
  type: ObjectType,
  content: string,
  cwd: string = process.cwd(),
): string {
  const byteLength = Buffer.byteLength(content, "utf-8");
  const payload = Buffer.concat([
    Buffer.from(`${type} ${byteLength}\0`, "utf-8"),
    Buffer.from(content, "utf-8"),
  ]);
  const hash = hashBytes(payload);

  ensureObjectsDir(cwd);
  const filePath = objectPath(hash, cwd);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, payload);
  }

  return hash;
}

/**
 * Read a typed object. Supports:
 * - v2 payloads (`type size\\0content`)
 * - v1 raw blobs (entire file is blob content; type defaults to blob)
 */
export function readObject(
  hash: string,
  cwd: string = process.cwd(),
): StoredObject | null {
  const filePath = objectPath(hash, cwd);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buf = fs.readFileSync(filePath);
  const nullIndex = buf.indexOf(0);

  if (nullIndex === -1) {
    // v1 raw blob
    const content = buf.toString("utf-8");
    return { type: "blob", content, raw: content };
  }

  const header = buf.subarray(0, nullIndex).toString("utf-8");
  const match = /^(blob|tree|commit) (\d+)$/.exec(header);

  if (!match) {
    // Unknown header — treat as raw blob
    const content = buf.toString("utf-8");
    return { type: "blob", content, raw: content };
  }

  const type = match[1] as ObjectType;
  const content = buf.subarray(nullIndex + 1).toString("utf-8");

  return {
    type,
    content,
    raw: buf.toString("binary"),
  };
}

export function objectExists(
  hash: string,
  cwd: string = process.cwd(),
): boolean {
  return fs.existsSync(objectPath(hash, cwd));
}

/**
 * List all object hashes in the store.
 */
export function listObjectHashes(cwd: string = process.cwd()): string[] {
  const dir = path.join(getTntDir(cwd), "objects");
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isFile();
  });
}
