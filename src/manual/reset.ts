const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt reset${RESET}

${BOLD}NAME${RESET}
       reset — move HEAD without losing work (soft only)

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt reset --soft${RESET} ${DIM}<rev>${RESET}

${BOLD}DESCRIPTION${RESET}
       Moves the current branch tip (or detached HEAD) to ${YELLOW}<rev>${RESET}.
       The index and working tree are ${BOLD}left untouched${RESET}.

       Only ${YELLOW}--soft${RESET} is supported. ${DIM}--mixed${RESET} / ${DIM}--hard${RESET}
       are rejected with a pointer to safer tools.

${BOLD}REVISIONS${RESET}
       HEAD, HEAD~1, branch names, full or prefix commit hashes.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt reset --soft HEAD~1
       ${DIM}$${RESET} tnt reset --soft abcdef123456

${BOLD}RECOVERY TIPS${RESET}
       ${DIM}•${RESET} Soft-reset then ${YELLOW}tnt summ${RESET} to re-commit with a new message.
       ${DIM}•${RESET} Soft-reset after a bad tip if you still have the tree staged/WIP.
       ${DIM}•${RESET} Use ${YELLOW}tnt stash${RESET} to park dirty work before experiments.
`;
