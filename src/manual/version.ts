const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-VERSION(1)                    TNT Manual                    TNT-VERSION(1)${RESET}

${BOLD}NAME${RESET}
       tnt-version - Display the current version of TNT

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt version${RESET}
       ${CYAN}tnt -v${RESET}
       ${CYAN}tnt --version${RESET}

${BOLD}DESCRIPTION${RESET}
       Displays the currently installed version of TNT (Tiny Node Tooling).

       This command reads the version from the package.json file and prints
       it to the console. Useful for checking which version you have installed
       or for reporting bugs.

${BOLD}OPTIONS${RESET}
       This command takes no options.

${BOLD}EXIT STATUS${RESET}
       ${YELLOW}0${RESET}      Success
       ${YELLOW}1${RESET}      Could not determine version

${BOLD}EXAMPLES${RESET}
       Check current version:

           ${DIM}$ tnt version${RESET}
           tnt 1.0.0

       Using the short flag:

           ${DIM}$ tnt -v${RESET}
           tnt 1.0.0

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-upgrade(1)${RESET}, ${CYAN}tnt-help(1)${RESET}

${DIM}TNT                                                             TNT-VERSION(1)${RESET}
`;
