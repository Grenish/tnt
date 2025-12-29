const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

export const manual = `
${BOLD}TNT-TRACK(1)                      TNT Manual                      TNT-TRACK(1)${RESET}

${BOLD}NAME${RESET}
       tnt-track - Show all files in the repository with their status

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt track${RESET}

${BOLD}DESCRIPTION${RESET}
       Displays a comprehensive list of all files in the repository along with
       their current status. This includes tracked files, staged changes,
       modified files, untracked files, and deleted files.

       Unlike ${CYAN}tnt stats${RESET} which shows a summary of changes, ${CYAN}tnt track${RESET} shows
       every file in the repository with its status indicator.

${BOLD}STATUS INDICATORS${RESET}
       ${GREEN}✓${RESET}  ${DIM}Tracked${RESET}     File is committed and unchanged
       ${YELLOW}M${RESET}  ${DIM}Modified${RESET}    File has been modified but not staged
       ${CYAN}+${RESET}  ${DIM}Staged${RESET}      File is staged for the next commit
       ${RED}?${RESET}  ${DIM}Untracked${RESET}   File is not tracked by TNT
       ${RED}D${RESET}  ${DIM}Deleted${RESET}     File was tracked but has been deleted

${BOLD}OUTPUT FORMAT${RESET}
       The output consists of three sections:

       1. Header showing "Files in repository:"
       2. File listing with status icons and labels
       3. Summary line with counts for each status type

${BOLD}EXAMPLES${RESET}
       View all files with status:

           ${DIM}$ tnt track${RESET}

           Files in repository:
           ──────────────────────────────────────────────────
             ${GREEN}✓${RESET} src/index.ts
             ${GREEN}✓${RESET} src/cli/parse.ts
             ${YELLOW}M${RESET} src/commands/init.ts  ${DIM}(modified)${RESET}
             ${CYAN}+${RESET} src/commands/new.ts   ${DIM}(staged)${RESET}
             ${RED}?${RESET} tests/test.ts         ${DIM}(untracked)${RESET}
             ${RED}D${RESET} src/old-file.ts       ${DIM}(deleted)${RESET}
           ──────────────────────────────────────────────────
           ${DIM}12 tracked, 1 staged, 1 modified, 1 untracked, 1 deleted${RESET}

${BOLD}COMPARISON WITH STATS${RESET}
       ${CYAN}tnt stats${RESET}    Shows grouped summary of changes (what's changed?)
       ${CYAN}tnt track${RESET}    Shows all files with status (what's in the repo?)

       Use ${CYAN}tnt stats${RESET} for a quick overview of pending changes.
       Use ${CYAN}tnt track${RESET} for a complete inventory of all files.

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-stats(1)${RESET}, ${CYAN}tnt-stage(1)${RESET}, ${CYAN}tnt-ls(1)${RESET}

${DIM}TNT                                                               TNT-TRACK(1)${RESET}
`;
