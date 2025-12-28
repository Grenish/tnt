const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-INIT(1)                       TNT Manual                       TNT-INIT(1)${RESET}

${BOLD}NAME${RESET}
       tnt-init - Create an empty TNT repository

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt init${RESET}

${BOLD}DESCRIPTION${RESET}
       This command creates an empty TNT repository - basically a ${YELLOW}.tnt${RESET}
       directory with subdirectories for objects, refs, and commits. It also
       creates a ${YELLOW}.tntignore${RESET} file with sensible default patterns.

       Running ${CYAN}tnt init${RESET} in an existing repository is safe. It will not
       overwrite things that are already there.

${BOLD}WHAT GETS CREATED${RESET}
       ${DIM}.tnt/${RESET}
       ${DIM}├── HEAD${RESET}            Points to current branch (refs/heads/main)
       ${DIM}├── index.json${RESET}      Staging area for files
       ${DIM}├── objects/${RESET}        Content-addressed blob storage
       ${DIM}├── commits/${RESET}        Commit metadata files
       ${DIM}└── refs/${RESET}
       ${DIM}    └── heads/${RESET}
       ${DIM}        └── main${RESET}    Default branch

       ${DIM}.tntignore${RESET}          Patterns for files to ignore (if not present)

${BOLD}TNTIGNORE${RESET}
       The ${YELLOW}.tntignore${RESET} file specifies files and directories that TNT should
       ignore. By default, it includes common patterns such as:

       ${DIM}•${RESET} ${CYAN}node_modules/${RESET}, ${CYAN}vendor/${RESET}     - Dependencies
       ${DIM}•${RESET} ${CYAN}dist/${RESET}, ${CYAN}build/${RESET}, ${CYAN}out/${RESET}       - Build outputs
       ${DIM}•${RESET} ${CYAN}.env${RESET}, ${CYAN}*.pem${RESET}, ${CYAN}*.key${RESET}        - Secrets and environment
       ${DIM}•${RESET} ${CYAN}.idea/${RESET}, ${CYAN}.vscode/${RESET}           - IDE files
       ${DIM}•${RESET} ${CYAN}*.log${RESET}, ${CYAN}coverage/${RESET}           - Logs and test output
       ${DIM}•${RESET} ${CYAN}.cache/${RESET}, ${CYAN}.next/${RESET}, ${CYAN}.nuxt/${RESET}   - Cache directories

       You can edit this file to customize which files are ignored.

${BOLD}EXAMPLES${RESET}
       Start a new project:

           ${DIM}$ mkdir my-project && cd my-project${RESET}
           ${DIM}$ tnt init${RESET}
           Initialized empty TNT repository

       View the generated ignore file:

           ${DIM}$ cat .tntignore${RESET}

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-stage(1)${RESET}, ${CYAN}tnt-stats(1)${RESET}

${DIM}TNT                                                                TNT-INIT(1)${RESET}
`;
