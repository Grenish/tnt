const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt cat-file${RESET}

${BOLD}NAME${RESET}
       cat-file — inspect a stored object (blob, tree, or commit)

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt cat-file${RESET} ${DIM}[-t|-p]${RESET} ${YELLOW}<hash|rev>${RESET}

${BOLD}DESCRIPTION${RESET}
       Reads an object from ${DIM}.tnt/objects/${RESET}. Objects are stored in a
       Git-inspired form: ${DIM}type size\\0content${RESET}, addressed by a 12-char
       SHA-256 prefix of that payload.

${BOLD}OPTIONS${RESET}
       ${YELLOW}-t, --type${RESET}
              Print only the object type (blob | tree | commit).

       ${YELLOW}-p, --pretty${RESET}
              Pretty-print (default for commits includes tree/parent).

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt cat-file -t abcdef123456
       ${DIM}$${RESET} tnt cat-file HEAD
       ${DIM}$${RESET} tnt cat-file -p \$(tnt rev-parse HEAD)
`;
