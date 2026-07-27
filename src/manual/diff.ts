const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt diff${RESET}

${BOLD}NAME${RESET}
       diff — show changes as a unified patch

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt diff${RESET} ${DIM}[options] [path...]${RESET}
       ${YELLOW}tnt diff --staged${RESET} ${DIM}[path...]${RESET}
       ${YELLOW}tnt diff --stat${RESET}

${BOLD}DESCRIPTION${RESET}
       Prints a classic unified diff (--- / +++ / @@ hunks).

       ${BOLD}Default${RESET} compares the ${BOLD}working tree${RESET} to the ${BOLD}index${RESET}
       (HEAD snapshot with staged overrides) — unstaged changes only.

       ${YELLOW}--staged${RESET} / ${YELLOW}--cached${RESET} compares the ${BOLD}index${RESET} to
       ${BOLD}HEAD${RESET} — what the next ${YELLOW}tnt summ${RESET} would record.

       Untracked files are omitted (stage them first).

${BOLD}OPTIONS${RESET}
       ${YELLOW}--staged, --cached${RESET}
              Staged changes only (index vs HEAD).

       ${YELLOW}--stat${RESET}
              Short summary of +/- line counts per file.

       ${YELLOW}--no-color${RESET}
              Disable ANSI colors.

       ${YELLOW}--no-pager${RESET}
              Never open a pager (also: ${DIM}TNT_PAGER=cat${RESET}).

       ${YELLOW}[path...]${RESET}
              Limit output to these paths or directory prefixes.

${BOLD}RELATED${RESET}
       ${YELLOW}tnt stats -p${RESET} / ${YELLOW}tnt stats --patch${RESET}
              Status listing plus unstaged patch.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt diff
       ${DIM}$${RESET} tnt diff src/
       ${DIM}$${RESET} tnt diff --staged
       ${DIM}$${RESET} tnt diff --stat
       ${DIM}$${RESET} tnt stats --patch
`;
