const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

export const manual = `
${BOLD}TNT-DELETE(1)                     TNT Manual                     TNT-DELETE(1)${RESET}

${BOLD}NAME${RESET}
       tnt-delete - Delete a branch

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt delete <branch>${RESET}
       ${CYAN}tnt -d <branch>${RESET}

${BOLD}DESCRIPTION${RESET}
       Deletes the specified branch from the repository. This removes the
       branch reference but does not delete any commits — they remain in
       the repository's object store.

       You cannot delete the branch you are currently on. Switch to another
       branch first using ${CYAN}tnt checkout${RESET}.

${BOLD}OPTIONS${RESET}
       ${YELLOW}<branch>${RESET}
              The name of the branch to delete. This argument is required.

${BOLD}SAFETY${RESET}
       ${DIM}•${RESET} You cannot delete the currently checked-out branch
       ${DIM}•${RESET} A warning is shown when deleting ${YELLOW}main${RESET} or ${YELLOW}master${RESET} branches
       ${DIM}•${RESET} Commits are preserved even after branch deletion

${BOLD}EXIT STATUS${RESET}
       ${YELLOW}0${RESET}      Branch deleted successfully
       ${YELLOW}1${RESET}      Error (branch not found, is current branch, or no name given)

${BOLD}EXAMPLES${RESET}
       Delete a feature branch:

           ${DIM}$ tnt delete feature/old-feature${RESET}
           Deleted branch 'feature/old-feature'

       Using the short flag:

           ${DIM}$ tnt -d bugfix/resolved${RESET}
           Deleted branch 'bugfix/resolved'

       Attempting to delete current branch:

           ${DIM}$ tnt -d main${RESET}
           ${RED}tnt: cannot delete branch 'main'${RESET}
           ${YELLOW}You are currently on this branch. Switch to another branch first.${RESET}

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-branch(1)${RESET}, ${CYAN}tnt-checkout(1)${RESET}

${DIM}TNT                                                              TNT-DELETE(1)${RESET}
`;
