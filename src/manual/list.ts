const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

export const manual = `
${BOLD}TNT-LS(1)                         TNT Manual                         TNT-LS(1)${RESET}

${BOLD}NAME${RESET}
       tnt-ls, tnt-list - List all snapshots with metadata

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt ls${RESET}
       ${CYAN}tnt ls -v${RESET}
       ${CYAN}tnt ls -n <count>${RESET}
       ${CYAN}tnt ls <snapshot-id>${RESET}
       ${CYAN}tnt list${RESET}

${BOLD}DESCRIPTION${RESET}
       Lists all snapshots (commits) in the repository with their metadata.
       By default, displays a compact table showing ID, date, time, file count,
       and commit message for each snapshot.

       The current HEAD snapshot is marked with ${GREEN}*${RESET} in compact view or ${GREEN}●${RESET} in
       verbose view.

${BOLD}OPTIONS${RESET}
       ${YELLOW}-v, --verbose${RESET}
              Show detailed information for each snapshot including parent
              commit, branch association, and file preview.

       ${YELLOW}-n, --limit <count>${RESET}
              Limit output to the most recent <count> snapshots.

       ${YELLOW}<snapshot-id>${RESET}
              Show detailed information for a specific snapshot. Displays
              the full file list with hashes.

${BOLD}OUTPUT FIELDS${RESET}
       ${DIM}ID${RESET}        Unique snapshot identifier (timestamp-based)
       ${DIM}DATE${RESET}      Date the snapshot was created (YYYY-MM-DD)
       ${DIM}TIME${RESET}      Time the snapshot was created (HH:MM)
       ${DIM}FILES${RESET}     Number of files in the snapshot
       ${DIM}MESSAGE${RESET}   Commit message

${BOLD}EXAMPLES${RESET}
       List all snapshots:

           ${DIM}$ tnt ls${RESET}

           Snapshots (4):
           ───────────────────────────────────────────────────────
             ID             DATE        TIME   FILES   MESSAGE
           ───────────────────────────────────────────────────────
           ${GREEN}*${RESET} ${YELLOW}1703849234567${RESET}  2024-12-29  14:22  ${CYAN} 12${RESET}     Add merge feature
             ${YELLOW}1703849123456${RESET}  2024-12-29  14:18  ${CYAN} 10${RESET}     Fix parsing bug
             ${YELLOW}1703849012345${RESET}  2024-12-29  14:15  ${CYAN}  8${RESET}     Add stage command
             ${YELLOW}1703848901234${RESET}  2024-12-29  14:10  ${CYAN}  5${RESET}     Initial commit
           ───────────────────────────────────────────────────────

       Verbose output:

           ${DIM}$ tnt ls -v${RESET}

           ${GREEN}●${RESET} ${YELLOW}1703849234567${RESET}  ${DIM}(HEAD → ${CYAN}main${RESET}${DIM})${RESET}
             Date:    2024-12-29 14:22
             Message: Add merge feature
             Parent:  1703849123456
             Files:   12 file(s)

       Show last 3 snapshots:

           ${DIM}$ tnt ls -n 3${RESET}

       View specific snapshot:

           ${DIM}$ tnt ls 1703849234567${RESET}

           Snapshot: ${YELLOW}1703849234567${RESET}
           ${DIM}(HEAD → ${CYAN}main${RESET}${DIM})${RESET}
           ───────────────────────────────────────────────────────
             Message:   Add merge feature
             Date:      2024-12-29 14:22
             Parent:    1703849123456

             Files (12):
               src/index.ts  ${DIM}(a1b2c3d4e5f6)${RESET}
               src/commands/merge.ts  ${DIM}(e5f6g7h8i9j0)${RESET}
               ...

${BOLD}ALIASES${RESET}
       ${CYAN}list${RESET}      Same as ${CYAN}ls${RESET}

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-log(1)${RESET}, ${CYAN}tnt-stats(1)${RESET}, ${CYAN}tnt-summ(1)${RESET}

${DIM}TNT                                                                   TNT-LS(1)${RESET}
`;
