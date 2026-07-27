const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt ls-tree${RESET}

${BOLD}NAME${RESET}
       ls-tree — list entries in a tree object

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt ls-tree${RESET} ${DIM}[tree|commit|branch|HEAD]${RESET}

${BOLD}DESCRIPTION${RESET}
       Shows immediate children of a tree (blobs and subtrees). When given
       a commit or branch, uses that commit's root tree.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt ls-tree
       ${DIM}$${RESET} tnt ls-tree HEAD
       ${DIM}$${RESET} tnt ls-tree main
`;
