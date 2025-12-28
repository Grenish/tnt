const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

export const manual = `
${BOLD}TNT-MERGE(1)                      TNT Manual                      TNT-MERGE(1)${RESET}

${BOLD}NAME${RESET}
       tnt-merge - Join two branches together

${BOLD}SYNOPSIS${RESET}
       ${CYAN}tnt -m${RESET} <target> ${CYAN}-u${RESET} <source>

${BOLD}DESCRIPTION${RESET}
       Incorporates changes from the ${YELLOW}<source>${RESET} branch into the ${YELLOW}<target>${RESET}
       branch. This command uses a simple, conflict-free merge strategy.

       The merge strategy is version-based, not line-based. Instead of asking
       "Can I merge these line-by-line?", it asks "Is this file newer?"

${BOLD}OPTIONS${RESET}
       ${YELLOW}-m <target>${RESET}
           The target branch that will receive the changes.
           This branch will be updated with a new merge commit.

       ${YELLOW}-u <source>${RESET}
           The source branch containing changes to merge.
           This branch remains unchanged after the merge.

${BOLD}MERGE STRATEGY${RESET}
       For each file, one of three cases applies:

       ${BOLD}Case 1: File exists in both branches${RESET}
           ${DIM}•${RESET} If same content → unchanged, keep as-is
           ${DIM}•${RESET} If different content → ${YELLOW}upgrade${RESET}, source version wins

       ${BOLD}Case 2: File exists only in source${RESET}
           ${DIM}•${RESET} Treat as new file → ${GREEN}add${RESET} to target

       ${BOLD}Case 3: File exists only in target${RESET}
           ${DIM}•${RESET} Leave untouched → ${DIM}keep${RESET} in target

       This approach ensures zero conflicts by design.

${BOLD}MERGE ANALYSIS${RESET}
       Before merging, TNT shows a summary:

       ${GREEN}+ Added${RESET}       New files from source branch
       ${YELLOW}↑ Upgraded${RESET}   Files updated to source version
       ${DIM}○ Kept${RESET}        Files preserved from target (not in source)
       ${DIM}= Unchanged${RESET}   Files identical in both branches

${BOLD}EXAMPLES${RESET}
       Merge feature branch into main:

           ${DIM}$ tnt -m main -u feature${RESET}

           Merge Summary
           ─────────────────────────────────
           feature → main

           + 2 new file(s)
             + src/feature.ts
             + tests/feature.test.ts
           ↑ 1 file(s) to upgrade
             ↑ README.md (45 lines)
           ○ 1 file(s) kept (target only)
             ○ config.json
           = 5 file(s) unchanged
           ─────────────────────────────────

           Apply 3 change(s)? (y/n) y

           ✓ Merge successful!
           Commit:  1709135123456
           Message: Merge branch 'feature' into main
           Changes: +2 new, ↑1 upgraded, ○1 kept

${BOLD}SHELL USAGE${RESET}
       Inside the TNT shell, use a simplified syntax:

           ${DIM}tnt(main)>${RESET} merge main feature
           ${DIM}(merges feature into main)${RESET}

${BOLD}WHY NO CONFLICTS?${RESET}
       Traditional merge asks: "How do I combine line 42 from both files?"

       TNT merge asks: "Which version of this file should I use?"

       By treating files as atomic units and always preferring the source
       version when different, we eliminate merge conflicts entirely.

       Trade-off: If target has unique changes to a file that source also
       modified, target's changes will be overwritten. Use branches wisely.

${BOLD}SEE ALSO${RESET}
       ${CYAN}tnt-branch(1)${RESET}, ${CYAN}tnt-checkout(1)${RESET}, ${CYAN}tnt-log(1)${RESET}

${DIM}TNT                                                               TNT-MERGE(1)${RESET}
`;
