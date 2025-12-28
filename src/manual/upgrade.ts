const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

export const manual = `
${BOLD}TNT-UPGRADE(1)                    TNT Manual                    TNT-UPGRADE(1)${RESET}

${BOLD}NAME${RESET}
       tnt-upgrade - Check for and install TNT updates

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt upgrade${RESET}

${BOLD}DESCRIPTION${RESET}
       Checks npm for the latest version of TNT and compares it with your
       currently installed version. If a newer version is available, displays
       instructions for upgrading.

       This command requires an internet connection to fetch the latest
       version information from the npm registry.

${BOLD}OPTIONS${RESET}
       This command takes no options.

${BOLD}OUTPUT${RESET}
       The command displays:

       ${DIM}•${RESET} Your currently installed version
       ${DIM}•${RESET} The latest available version on npm
       ${DIM}•${RESET} Whether an upgrade is available
       ${DIM}•${RESET} Instructions for upgrading (if applicable)

${BOLD}EXIT STATUS${RESET}
       ${YELLOW}0${RESET}      Success (regardless of whether update is available)
       ${YELLOW}1${RESET}      Could not determine current or latest version

${BOLD}EXAMPLES${RESET}
       Check for updates:

           ${DIM}$ tnt upgrade${RESET}

           Checking for updates...

             Current version: ${CYAN}1.0.0${RESET}
             Latest version:  ${CYAN}1.2.0${RESET}

           ${YELLOW}⬆${RESET} A new version is available!

           To upgrade, run:
             npm install -g @grenishrai/tnt@latest

       When already on latest:

           ${DIM}$ tnt upgrade${RESET}

           Checking for updates...

             Current version: ${CYAN}1.2.0${RESET}
             Latest version:  ${CYAN}1.2.0${RESET}

           ${GREEN}✓${RESET} You're on the latest version!

${BOLD}UPGRADING${RESET}
       To upgrade TNT, run one of the following commands:

           ${DIM}# Using npm${RESET}
           npm install -g @grenishrai/tnt@latest

           ${DIM}# Using bun${RESET}
           bun install -g @grenishrai/tnt@latest

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-version(1)${RESET}, ${CYAN}tnt-help(1)${RESET}

${DIM}TNT                                                             TNT-UPGRADE(1)${RESET}
`;
