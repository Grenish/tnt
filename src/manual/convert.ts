const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt convert${RESET}

${BOLD}NAME${RESET}
       convert — upgrade a legacy (format 1) repository to format 2

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt convert${RESET}

${BOLD}DESCRIPTION${RESET}
       Rewrites timestamp-based commits and raw blobs into content-addressed
       blob/tree/commit objects with real trees. Branch refs are remapped.
       Legacy ${DIM}commits/*.json${RESET} are moved to ${DIM}.tnt/commits.bak${RESET}.

${BOLD}NOTES${RESET}
       Safe to run on format 2 repos (no-op / reaffirm format marker).
       New repos from ${YELLOW}tnt init${RESET} are already format 2.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt convert
`;
