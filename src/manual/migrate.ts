const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-MIGRATE(1)                    TNT Manual                    TNT-MIGRATE(1)${RESET}

${BOLD}NAME${RESET}
       tnt-migrate - Migrate TNT repository to another VCS

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt migrate -git${RESET}

${BOLD}DESCRIPTION${RESET}
       Converts a TNT repository to a Git repository, preserving:
       ${DIM}•${RESET} All commits with original messages and timestamps
       ${DIM}•${RESET} All branches pointing to correct commits
       ${DIM}•${RESET} Complete file history and snapshots
       ${DIM}•${RESET} Current branch selection

${BOLD}OPTIONS${RESET}
       ${YELLOW}-git${RESET}
           Migrate to Git format. Currently the only supported target.

${BOLD}PROCESS${RESET}
       The migration performs these steps:

       ${BOLD}1. Validate${RESET}
          ${DIM}•${RESET} Checks .tnt/ exists
          ${DIM}•${RESET} Ensures .git/ does not exist
          ${DIM}•${RESET} Verifies working tree is clean

       ${BOLD}2. Read TNT State${RESET}
          ${DIM}•${RESET} Collects all branches
          ${DIM}•${RESET} Traverses commit history
          ${DIM}•${RESET} Maps file snapshots

       ${BOLD}3. Rebuild as Git${RESET}
          ${DIM}•${RESET} Runs git init
          ${DIM}•${RESET} Replays commits in chronological order
          ${DIM}•${RESET} Creates branches at correct commits
          ${DIM}•${RESET} Checks out original active branch

       ${BOLD}4. Cleanup${RESET}
          ${DIM}•${RESET} Renames .tnt/ to .tnt.bak/

${BOLD}EXAMPLES${RESET}
       Migrate to Git:

           ${DIM}$ tnt migrate -git${RESET}

           TNT → Git Migration

           [1/4] Validating environment...
             ✓ .tnt/ exists
             ✓ .git/ does not exist
             ✓ Working tree is clean

           [2/4] Reading TNT state...
             ✓ Found 2 branch(es)
             ✓ Found 5 commit(s)

           [3/4] Rebuilding as Git repository...
             ✓ Initialized Git repository
             ✓ Commit 1/5: Initial commit
             ...

           [4/4] Cleaning up...
             ✓ Renamed .tnt/ → .tnt.bak/

           ✓ Migration complete!

           Hope you enjoyed your stay with TNT! 💥

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-log(1)${RESET}, ${CYAN}tnt-branch(1)${RESET}

${DIM}TNT                                                             TNT-MIGRATE(1)${RESET}
`;
