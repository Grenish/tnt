const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-STAGE(1)                      TNT Manual                      TNT-STAGE(1)${RESET}

${BOLD}NAME${RESET}
       tnt-stage - Add file contents to the staging area

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt stage${RESET} <pathspec>...
       ${CYAN}tnt stage${RESET} .

${BOLD}DESCRIPTION${RESET}
       This command updates the index using the current content found in the
       working tree, to prepare the content staged for the next commit.

       The "index" holds a snapshot of the content of the working tree, and
       it is this snapshot that is taken as the contents of the next commit.

       File contents are stored as content-addressed blobs in ${YELLOW}.tnt/objects/${RESET}.
       Each file is hashed using SHA-256 (truncated to 12 characters).

${BOLD}OPTIONS${RESET}
       ${YELLOW}<pathspec>...${RESET}
           Files to add content from. Paths can be files or directories.

       ${YELLOW}.${RESET}
           Stage all files in the current directory recursively.

${BOLD}EXAMPLES${RESET}
       Stage a single file:

           ${DIM}$ tnt stage README.md${RESET}
           Staged 1 file(s)

       Stage multiple files:

           ${DIM}$ tnt stage src/index.ts src/utils.ts${RESET}
           Staged 2 file(s)

       Stage everything:

           ${DIM}$ tnt stage .${RESET}
           Staged 15 file(s)

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-summ(1)${RESET}, ${CYAN}tnt-stats(1)${RESET}

${DIM}TNT                                                               TNT-STAGE(1)${RESET}
`;
