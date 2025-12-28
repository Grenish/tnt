const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-STATS(1)                      TNT Manual                      TNT-STATS(1)${RESET}

${BOLD}NAME${RESET}
       tnt-stats - Show the working tree status

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt stats${RESET}

${BOLD}DESCRIPTION${RESET}
       Displays paths that have differences between the index file and the
       current HEAD commit, paths that have differences between the working
       tree and the index file, and paths in the working tree that are not
       tracked by TNT.

${BOLD}OUTPUT${RESET}
       The command output is divided into sections:

       ${BOLD}On branch <name>${RESET}
           Shows the current branch name.

       ${BOLD}Changes to be committed:${RESET}
           Files that are staged and will be included in the next commit.
           Shows ${CYAN}+lines${RESET} ${YELLOW}-lines${RESET} diff statistics.

       ${BOLD}Changes not staged for commit:${RESET}
           Files that have been modified but not staged.
           Shows ${CYAN}+lines${RESET} ${YELLOW}-lines${RESET} diff statistics.

       ${BOLD}Untracked files:${RESET}
           Files that exist in the working directory but have never been
           staged or committed.

${BOLD}EXAMPLES${RESET}
       Check repository status:

           ${DIM}$ tnt stats${RESET}

           On branch main

           Changes to be committed:
             new file:  src/app.ts  +45 -0

           Changes not staged for commit:
             modified:  README.md  +3 -1

           Untracked files:
             config.json

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-stage(1)${RESET}, ${CYAN}tnt-summ(1)${RESET}

${DIM}TNT                                                               TNT-STATS(1)${RESET}
`;
