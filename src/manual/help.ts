const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-HELP(1)                       TNT Manual                       TNT-HELP(1)${RESET}

${BOLD}NAME${RESET}
       tnt-help - Display help information about TNT

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt help${RESET}
       ${CYAN}tnt help${RESET} <command>

${BOLD}DESCRIPTION${RESET}
       With no options, displays a summary of available commands.

       When a ${YELLOW}<command>${RESET} is given, opens the manual page for that
       command in a pager (similar to man pages).

${BOLD}OPTIONS${RESET}
       ${YELLOW}<command>${RESET}
           The name of the command to get help for.

${BOLD}NAVIGATION${RESET}
       When viewing a manual page:

       ${YELLOW}j${RESET} or ${YELLOW}↓${RESET}      Scroll down one line
       ${YELLOW}k${RESET} or ${YELLOW}↑${RESET}      Scroll up one line
       ${YELLOW}d${RESET}            Scroll down half page
       ${YELLOW}u${RESET}            Scroll up half page
       ${YELLOW}g${RESET}            Go to top
       ${YELLOW}G${RESET}            Go to bottom
       ${YELLOW}/${RESET}            Search forward
       ${YELLOW}q${RESET}            Quit

${BOLD}EXAMPLES${RESET}
       Show general help:

           ${DIM}$ tnt help${RESET}

       Open manual for stage command:

           ${DIM}$ tnt help stage${RESET}

       Open manual for checkout command:

           ${DIM}$ tnt help checkout${RESET}

${BOLD}AVAILABLE COMMANDS${RESET}
       ${CYAN}init${RESET}        Create an empty TNT repository
       ${CYAN}stage${RESET}       Add file contents to staging area
       ${CYAN}summ${RESET}        Record changes to the repository
       ${CYAN}stats${RESET}       Show working tree status
       ${CYAN}branch${RESET}      List or create branches
       ${CYAN}checkout${RESET}    Switch branches
       ${CYAN}log${RESET}         Show commit history
       ${CYAN}migrate${RESET}     Migrate to Git
       ${CYAN}help${RESET}        Display help information

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-init(1)${RESET}, ${CYAN}tnt-stage(1)${RESET}, ${CYAN}tnt-summ(1)${RESET}

${DIM}TNT                                                                TNT-HELP(1)${RESET}
`;
