const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt graph${RESET}

${BOLD}NAME${RESET}
       graph — print a simple commit parent graph

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt graph${RESET}

${BOLD}DESCRIPTION${RESET}
       Lists commits with parent links, marking branch tips and HEAD.
       Useful for learning how linear history is linked.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt graph
`;
