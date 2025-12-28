const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-SUMM(1)                       TNT Manual                       TNT-SUMM(1)${RESET}

${BOLD}NAME${RESET}
       tnt-summ - Record changes to the repository

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt summ${RESET} <message>

${BOLD}DESCRIPTION${RESET}
       Create a new commit containing the current contents of the index
       and the given log message describing the changes.

       The commit is created on the current branch. The branch reference
       is updated to point to the new commit.

       Each commit stores:
       ${DIM}•${RESET} Unique ID (timestamp-based)
       ${DIM}•${RESET} Commit message
       ${DIM}•${RESET} Timestamp
       ${DIM}•${RESET} File snapshots (path + content hash)
       ${DIM}•${RESET} Parent commit reference

${BOLD}OPTIONS${RESET}
       ${YELLOW}<message>${RESET}
           The commit message. Use quotes for multi-word messages.
           If omitted, defaults to "update".

${BOLD}EXAMPLES${RESET}
       Create a commit:

           ${DIM}$ tnt summ "Initial commit"${RESET}
           Committed 3 file(s): "Initial commit"

       Commit with a detailed message:

           ${DIM}$ tnt summ "Fix authentication bug in login flow"${RESET}
           Committed 2 file(s): "Fix authentication bug in login flow"

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-stage(1)${RESET}, ${CYAN}tnt-log(1)${RESET}, ${CYAN}tnt-stats(1)${RESET}

${DIM}TNT                                                                TNT-SUMM(1)${RESET}
`;
