import fs from "fs";
import path from "path";

const DEFAULT_TNTIGNORE = `# Dependencies
node_modules/
vendor/
bower_components/

# Build outputs
dist/
build/
out/
target/
*.o
*.obj
*.exe
*.dll
*.so
*.dylib

# Package manager files
package-lock.json
yarn.lock
pnpm-lock.yaml
bun.lockb

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Environment and secrets
.env
.env.local
.env.*.local
*.pem
*.key

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/
.nyc_output/

# Cache directories
.cache/
.parcel-cache/
.next/
.nuxt/
.turbo/

# Temporary files
tmp/
temp/
*.tmp
*.temp
`;

export function init() {
  const cwd = process.cwd();
  const tntDir = path.join(cwd, ".tnt");
  const tntIgnorePath = path.join(cwd, ".tntignore");

  if (fs.existsSync(tntDir)) {
    console.log("tnt: repository already exists");
    return;
  }

  fs.mkdirSync(path.join(tntDir, "refs", "heads"), { recursive: true });
  fs.mkdirSync(path.join(tntDir, "commits"), { recursive: true });
  fs.mkdirSync(path.join(tntDir, "objects"), { recursive: true });

  fs.writeFileSync(path.join(tntDir, "HEAD"), "ref: refs/heads/main");

  fs.writeFileSync(path.join(tntDir, "refs", "heads", "main"), "");

  fs.writeFileSync(
    path.join(tntDir, "index.json"),
    JSON.stringify({ files: [] }, null, 2),
  );

  // Create .tntignore if it doesn't exist
  if (!fs.existsSync(tntIgnorePath)) {
    fs.writeFileSync(tntIgnorePath, DEFAULT_TNTIGNORE);
  }

  console.log("Initialized empty TNT repository");
}
