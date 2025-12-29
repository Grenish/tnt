export function parseArgs(argv: string[]): {
  action: string;
  target?: string;
  args?: string[];
  mergeTarget?: string;
  mergeUpcoming?: string;
} {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { action: "help" };
  }

  const [first, second] = args;

  if (first && first.startsWith("-")) {
    return parseFlag(first, second, args);
  }

  // Handle "migrate -git" as a special case
  if (first === "migrate") {
    return { action: "migrate", target: second };
  }

  // Handle upgrade command
  if (first === "upgrade") {
    return { action: "upgrade" };
  }

  // Handle version command
  if (first === "version") {
    return { action: "version" };
  }

  // Handle delete command
  if (first === "delete") {
    return { action: "delete-branch", target: second };
  }

  // Handle ls/list command with additional args
  if (first === "ls" || first === "list") {
    return { action: "list", args: args.slice(1) };
  }

  return {
    action: first ?? "help",
    target: second,
  };
}

function parseMergeArgs(args: string[]): {
  action: string;
  mergeTarget?: string;
  mergeUpcoming?: string;
} {
  let mergeTarget: string | undefined;
  let mergeUpcoming: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === "-m" && next) {
      mergeTarget = next;
      i++;
    } else if (arg === "-u" && next) {
      mergeUpcoming = next;
      i++;
    }
  }

  return { action: "merge", mergeTarget, mergeUpcoming };
}

function parseFlag(
  flag: string,
  target?: string,
  allArgs?: string[],
): {
  action: string;
  target?: string;
  args?: string[];
  mergeTarget?: string;
  mergeUpcoming?: string;
} {
  switch (flag) {
    case "-c":
      return { action: "branch-create", target };

    case "-co":
      return { action: "checkout", target };

    case "-cnc":
      return { action: "branch-create-checkout", target };

    case "-d":
      return { action: "delete-branch", target };

    case "-m":
      return parseMergeArgs(allArgs || []);

    case "-v":
    case "--version":
      return { action: "version" };

    case "-h":
    case "--help":
      return { action: "help", target };

    default:
      return { action: "help" };
  }
}
