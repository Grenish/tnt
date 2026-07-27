# TNT on-disk format

## Format 2 (current — object model v2)

New repositories from `tnt init` use **format 2**. Marker file:

```
.tnt/format   # contents: "2"
```

### Layout

```
<project>/
├── .tntignore
└── .tnt/
    ├── format              # "2"
    ├── HEAD                # ref: refs/heads/<branch> | <commit id>
    ├── index.json          # staging area
    ├── objects/            # all objects (blob | tree | commit)
    │   └── <hash>          # typed payload (see below)
    └── refs/
        └── heads/
            └── <branch>    # commit id (12 hex)
```

Legacy `commits/*.json` is **not** used for new commits. `tnt convert` archives it to `commits.bak/`.

### Object store (Git-inspired)

Each file in `objects/<hash>` is:

```
<type> <byteLength>\0<content>
```

- `type`: `blob` | `tree` | `commit`
- `byteLength`: UTF-8 byte length of `content`
- **Hash:** first 12 hex chars of SHA-256 of the full payload (header + content)

#### Blob

`content` is the raw file text (UTF-8).

#### Tree

Canonical text, lines sorted by name:

```
blob <hash> <basename>
tree <hash> <basename>
```

Directories are nested trees (not flat path lists).

#### Commit

```
tree <tree-hash>
parent <commit-hash>    # optional
timestamp <iso-8601>

<message>
```

Commit **id** is the object hash of this body (content-addressed — not `Date.now()`).

Porcelain still exposes a flat `files[]` view by walking the root tree.

### Staging (`index.json`)

Unchanged shape:

```json
{
  "files": [{ "path": "src/app.ts", "hash": "<blob-hash>" }]
}
```

Blob hashes are **format 2** typed-blob ids.

### Ignore rules

Same as v1: `.tntignore` + always ignore `.tnt` and `.git`.

---

## Format 1 (legacy)

Older repos may lack `.tnt/format` and use:

```
.tnt/
├── commits/<timestamp>.json   # { id, timestamp, message, files[], parent? }
├── objects/<hash>             # raw file bytes (unt typed)
└── ...
```

- Commit ids: `Date.now().toString()`
- Blob hash: SHA-256 of raw content (12 hex), file stores raw content only
- No tree objects

### Upgrade

```bash
tnt convert
```

Rewrites blobs/trees/commits, remaps branch refs, moves `commits/` → `commits.bak/`, writes `format=2`.

---

## Inspect / learner tools

| Command | Purpose |
|---------|---------|
| `tnt cat-file [-t\|-p] <hash>` | Show object type/content |
| `tnt ls-tree [rev]` | List tree entries |
| `tnt rev-parse [rev]` | Resolve HEAD/branch/prefix → commit id |
| `tnt graph` | Parent graph with branch tips |
| `tnt … --explain` | Narrate blob/tree/commit writes |

---

## Known limitations (format 2)

| Area | Behavior |
|------|----------|
| Hash length | 12 hex (birthday risk; fine for teaching) |
| Text | UTF-8 assumed |
| Merge | Still source-wins (true 3-way is P5); single parent |
| Remotes / pack / GC | None yet |
| Index | No mode bits / delete staging / stat cache |

## Mental model vs Git

| Concept | TNT format 2 | Git |
|---------|--------------|-----|
| Blob / tree / commit | Yes | Yes |
| Content-addressed commits | Yes | Yes |
| Object payload | `type size\\0…` | Same idea |
| Hash | SHA-256 truncated 12 | full SHA-1/256 |
| Packfiles | No | Yes |
