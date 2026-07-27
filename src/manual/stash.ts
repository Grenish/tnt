const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}${CYAN}tnt stash${RESET}

${BOLD}NAME${RESET}
       stash — save and restore uncommitted work

${BOLD}SYNOPSIS${RESET}
       ${YELLOW}tnt stash${RESET}
       ${YELLOW}tnt stash push${RESET} ${DIM}[message]${RESET}
       ${YELLOW}tnt stash list${RESET}
       ${YELLOW}tnt stash apply${RESET} ${DIM}[n]${RESET}
       ${YELLOW}tnt stash pop${RESET} ${DIM}[n]${RESET}
       ${YELLOW}tnt stash drop${RESET} ${DIM}[n]${RESET}
       ${YELLOW}tnt stash show${RESET} ${DIM}[n]${RESET}
       ${YELLOW}tnt stash clear${RESET}

${BOLD}DESCRIPTION${RESET}
       Records the current ${BOLD}tracked${RESET} working tree and staging index
       as a stack entry under ${DIM}.tnt/stash.json${RESET}, then resets both
       to match HEAD (like a simple Git stash).

       Untracked files are ${BOLD}not${RESET} included.

${BOLD}STACK${RESET}
       Newest entry is ${CYAN}stash@{0}${RESET}. Indices work with apply/pop/drop/show.

${BOLD}EXAMPLES${RESET}
       ${DIM}$${RESET} tnt stash
       ${DIM}$${RESET} tnt stash push "wip login"
       ${DIM}$${RESET} tnt stash list
       ${DIM}$${RESET} tnt stash pop
`;
