const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

export const manual = `
${BOLD}TNT-BLAST(1)                      TNT Manual                      TNT-BLAST(1)${RESET}

${BOLD}NAME${RESET}
       tnt-blast - Remove all TNT configuration from a project

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt blast${RESET}
       ${CYAN}tnt blast --confirm${RESET}
       ${CYAN}tnt blast -y${RESET}

${BOLD}DESCRIPTION${RESET}
       Completely removes all TNT version control data from the project,
       leaving only user-created files intact. This is a destructive
       operation that cannot be undone.

       When run without confirmation, displays a preview of what will be
       deleted and instructions to confirm.

${BOLD}OPTIONS${RESET}
       ${YELLOW}--confirm${RESET}, ${YELLOW}-y${RESET}
              Skip the confirmation prompt and immediately delete all
              TNT configuration.

${BOLD}WHAT GETS DELETED${RESET}
       ${RED}•${RESET} ${YELLOW}.tnt/${RESET}          Repository data (commits, objects, refs, index)
       ${RED}•${RESET} ${YELLOW}.tntignore${RESET}     Ignore patterns file
       ${RED}•${RESET} ${YELLOW}.tnt.bak/${RESET}      Backup directory (if exists from migration)

${BOLD}WHAT IS PRESERVED${RESET}
       ${GREEN}•${RESET} All user-created files and directories
       ${GREEN}•${RESET} Working tree content
       ${GREEN}•${RESET} Any non-TNT configuration files

${BOLD}EXIT STATUS${RESET}
       ${YELLOW}0${RESET}      Success
       ${YELLOW}1${RESET}      Not inside a TNT repository

${BOLD}EXAMPLES${RESET}
       Preview what will be deleted:

           ${DIM}$ tnt blast${RESET}
           ${YELLOW}⚠ Warning: This will permanently delete all TNT data${RESET}

           The following will be removed:
             ${RED}•${RESET} .tnt/          (repository data)
             ${RED}•${RESET} .tntignore     (ignore patterns)

           Your files will NOT be affected.

           To confirm, run:
             tnt blast --confirm

       Confirm and delete:

           ${DIM}$ tnt blast --confirm${RESET}
           ${RED}Deleted${RESET} .tnt/
           ${RED}Deleted${RESET} .tntignore

           ${GREEN}✓${RESET} TNT configuration removed. Your files are intact.

${BOLD}USE CASES${RESET}
       ${DIM}•${RESET} Starting fresh with a new TNT repository
       ${DIM}•${RESET} Removing TNT after migrating to Git
       ${DIM}•${RESET} Cleaning up a project that no longer needs version control

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-init(1)${RESET}, ${CYAN}tnt-migrate(1)${RESET}

${DIM}TNT                                                               TNT-BLAST(1)${RESET}
`;
