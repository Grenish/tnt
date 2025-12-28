const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-BRANCH(1)                     TNT Manual                     TNT-BRANCH(1)${RESET}

${BOLD}NAME${RESET}
       tnt-branch - List, create, or delete branches

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt branch${RESET}
       ${CYAN}tnt branch${RESET} <name>
       ${CYAN}tnt -c${RESET} <name>

${BOLD}DESCRIPTION${RESET}
       If no arguments are given, existing branches are listed; the current
       branch will be highlighted with an asterisk.

       If a ${YELLOW}<name>${RESET} is given, a new branch is created pointing to the
       current commit.

${BOLD}OPTIONS${RESET}
       ${YELLOW}<name>${RESET}
           The name of the branch to create.

${BOLD}EXAMPLES${RESET}
       List all branches:

           ${DIM}$ tnt branch${RESET}
           * main
             feature-auth
             bugfix-login

       Create a new branch:

           ${DIM}$ tnt branch feature-payments${RESET}
           Created branch 'feature-payments'

       Create using shorthand:

           ${DIM}$ tnt -c feature-payments${RESET}
           Created branch 'feature-payments'

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-checkout(1)${RESET}, ${CYAN}tnt-log(1)${RESET}

${DIM}TNT                                                              TNT-BRANCH(1)${RESET}
`;
