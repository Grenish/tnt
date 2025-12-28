const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export const manual = `
${BOLD}TNT-SHELL(1)                      TNT Manual                      TNT-SHELL(1)${RESET}

${BOLD}NAME${RESET}
       tnt-shell - Open interactive TNT shell

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt shell${RESET}
       ${CYAN}tnt sh${RESET}

${BOLD}DESCRIPTION${RESET}
       Opens a domain-specific REPL (Read-Eval-Print Loop) for working inside
       a TNT repository. Think of it as an interactive mode where you can run
       TNT commands without the ${YELLOW}tnt${RESET} prefix.

       The shell displays a prompt showing the current branch:

           ${CYAN}tnt${RESET}(${YELLOW}main${RESET})${BOLD}>${RESET}

       The branch name updates automatically when you switch branches.

${BOLD}COMMANDS${RESET}
       All standard TNT commands work inside the shell:

       ${YELLOW}init${RESET}              Initialize a new repository
       ${YELLOW}stage${RESET} <files>     Stage files ${DIM}(alias: add)${RESET}
       ${YELLOW}summ${RESET} <message>    Commit changes ${DIM}(alias: commit)${RESET}
       ${YELLOW}stats${RESET}             Show status ${DIM}(alias: status, st)${RESET}
       ${YELLOW}branch${RESET} [name]     List or create branches ${DIM}(alias: br)${RESET}
       ${YELLOW}checkout${RESET} <branch> Switch branches ${DIM}(alias: co)${RESET}
       ${YELLOW}log${RESET}               Show commit history
       ${YELLOW}migrate -git${RESET}      Migrate to Git
       ${YELLOW}help${RESET} [command]    Show help ${DIM}(alias: ?)${RESET}

       ${BOLD}Shell-specific commands:${RESET}

       ${YELLOW}clear${RESET}             Clear the screen ${DIM}(alias: cls)${RESET}
       ${YELLOW}pwd${RESET}               Print working directory
       ${YELLOW}exit${RESET}              Exit the shell ${DIM}(alias: quit, /q)${RESET}

${BOLD}EXITING${RESET}
       To exit the shell, use any of these:

       ${DIM}•${RESET} Type ${YELLOW}exit${RESET}, ${YELLOW}quit${RESET}, or ${YELLOW}/q${RESET}
       ${DIM}•${RESET} Press ${YELLOW}Ctrl+D${RESET}

${BOLD}EXAMPLES${RESET}
       Start the shell:

           ${DIM}$ tnt shell${RESET}

             _         _
            | |       | |
            | |_ _ __ | |_
            | __| '_ \\| __|
            | |_| | | | |_
             \\__|_| |_|\\__|

           TNT Shell — Interactive mode

           tnt(main)>

       Typical workflow inside the shell:

           ${DIM}tnt(main)>${RESET} stage .
           Staged 5 file(s)

           ${DIM}tnt(main)>${RESET} summ "Add new feature"
           Committed 5 file(s): "Add new feature"

           ${DIM}tnt(main)>${RESET} branch dev
           Created branch 'dev'

           ${DIM}tnt(main)>${RESET} checkout dev
           Switched to branch 'dev'

           ${DIM}tnt(dev)>${RESET} stats

           On branch dev
           Nothing to commit, working tree clean

           ${DIM}tnt(dev)>${RESET} exit
           Goodbye!

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-stats(1)${RESET}, ${CYAN}tnt-branch(1)${RESET}, ${CYAN}tnt-checkout(1)${RESET}

${DIM}TNT                                                               TNT-SHELL(1)${RESET}
`;
