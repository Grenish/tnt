const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt rev-parse${RESET}

${BOLD}NAME${RESET}
       rev-parse — resolve a revision to a full commit id

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt rev-parse${RESET} ${DIM}[HEAD|branch|hash-prefix]${RESET}

${BOLD}DESCRIPTION${RESET}
       Prints the commit id for HEAD, a branch name, an exact hash, or a
       unique hash prefix.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt rev-parse HEAD
       ${DIM}$${RESET} tnt rev-parse main
`;
