const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-LOG(1)                        TNT Manual                        TNT-LOG(1)${RESET}

${BOLD}NAME${RESET}
       tnt-log - Show commit logs

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt log${RESET}

${BOLD}DESCRIPTION${RESET}
       Shows the commit history for the current branch, starting with the
       most recent commit and traversing back through parent commits.

       Each commit entry displays:
       ${DIM}•${RESET} Commit ID (timestamp-based)
       ${DIM}•${RESET} Branch name
       ${DIM}•${RESET} Commit message
       ${DIM}•${RESET} Number of files in snapshot
       ${DIM}•${RESET} Timestamp

${BOLD}OUTPUT FORMAT${RESET}
       ${DIM}─────────────────────────────────${RESET}
       ${YELLOW}commit 1709134899011${RESET}
       ${DIM}branch:${RESET}  main
       ${DIM}message:${RESET} Add authentication flow
       ${DIM}files:${RESET}   5
       ${DIM}time:${RESET}    2025-01-30 21:18

${BOLD}EXAMPLES${RESET}
       View commit history:

           ${DIM}$ tnt log${RESET}

           Commit history for main:

           ─────────────────────────────────
           commit 1709134899011
           branch:  main
           message: Add auth flow
           files:   5
           time:    2025-01-30 21:18
           ─────────────────────────────────
           commit 1709134829123
           branch:  main
           message: Initial commit
           files:   3
           time:    2025-01-30 21:14
           ─────────────────────────────────
           Total: 2 commit(s)

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-summ(1)${RESET}, ${CYAN}tnt-branch(1)${RESET}

${DIM}TNT                                                                 TNT-LOG(1)${RESET}
`;
