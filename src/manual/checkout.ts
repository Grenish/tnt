const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-CHECKOUT(1)                   TNT Manual                   TNT-CHECKOUT(1)${RESET}

${BOLD}NAME${RESET}
       tnt-checkout - Switch branches

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt checkout${RESET} <branch>
       ${CYAN}tnt -co${RESET} <branch>
       ${CYAN}tnt -cnc${RESET} <name>

${BOLD}DESCRIPTION${RESET}
       Updates files in the working tree to match the version in the
       specified branch. This will update HEAD to point to the new branch.

       ${BOLD}IMPORTANT:${RESET} Switching branches will replace working directory files
       with the committed state of the target branch. Files that exist in
       the current branch but not in the target branch will be removed.

${BOLD}OPTIONS${RESET}
       ${YELLOW}<branch>${RESET}
           Branch to checkout. Must already exist.

${BOLD}FLAGS${RESET}
       ${YELLOW}-co <branch>${RESET}
           Shorthand for checkout.

       ${YELLOW}-cnc <name>${RESET}
           Create a new branch and switch to it immediately.
           Equivalent to: tnt branch <name> && tnt checkout <name>

${BOLD}EXAMPLES${RESET}
       Switch to main branch:

           ${DIM}$ tnt checkout main${RESET}
           Switched to branch 'main'

       Switch using shorthand:

           ${DIM}$ tnt -co feature-auth${RESET}
           Switched to branch 'feature-auth'

       Create and switch in one command:

           ${DIM}$ tnt -cnc new-feature${RESET}
           Created branch 'new-feature'
           Switched to branch 'new-feature'

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-branch(1)${RESET}, ${CYAN}tnt-stats(1)${RESET}

${DIM}TNT                                                            TNT-CHECKOUT(1)${RESET}
`;
