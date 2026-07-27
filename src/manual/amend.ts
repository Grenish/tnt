const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt amend${RESET} / ${CYAN}tnt summ --amend${RESET}

${BOLD}NAME${RESET}
       amend — replace the latest commit

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt amend${RESET} ${DIM}[message]${RESET}
       ${YELLOW}tnt summ --amend${RESET} ${DIM}[message]${RESET}

${BOLD}DESCRIPTION${RESET}
       Creates a new commit with the ${BOLD}same parent${RESET} as HEAD and moves
       the branch tip to it (content-addressed id will change).

       ${DIM}•${RESET} Message: uses the new message if provided; otherwise keeps the old one.
       ${DIM}•${RESET} Tree: if the index has staged files, merges them onto the previous
         snapshot; otherwise keeps the previous tree.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt amend "fix typo in message"
       ${DIM}$${RESET} tnt stage forgotten.ts
       ${DIM}$${RESET} tnt summ --amend
`;
