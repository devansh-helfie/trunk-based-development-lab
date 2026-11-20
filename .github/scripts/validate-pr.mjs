import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SEMANTIC_LABELS = new Set([
  'semver:major', 'semver:minor', 'semver:patch', 'semver:none'
]);
const NON_RELEASING_TYPES = new Set([
  'docs', 'chore', 'ci', 'build', 'test', 'style', 'refactor'
]);
const REQUIRED_SECTIONS = [
  'User-Facing Changes', 'Technical Changes', 'Feature Flags', 'Risks'
];

function classificationFor(type, breaking) {
  if (type !== 'feat' && type !== 'fix' && !NON_RELEASING_TYPES.has(type)) {
    return undefined;
  }
  if (breaking) return 'semver:major';
  if (type === 'feat') return 'semver:minor';
  if (type === 'fix') return 'semver:patch';
  return 'semver:none';
}

function validateSections(body, errors) {
  const headings = [...body.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)];
  for (const section of REQUIRED_SECTIONS) {
    const matches = headings.filter((heading) => heading[1] === section);
    if (matches.length !== 1) {
      errors.push(`Include exactly one section named "${section}".`);
      continue;
    }

    const heading = matches[0];
    const nextHeading = headings[headings.indexOf(heading) + 1];
    const content = body.slice(heading.index + heading[0].length, nextHeading?.index).trim();
    if (!content) {
      errors.push(`Fill "${section}" or write None.`);
    }
  }
}

export function validatePullRequest(pr) {
  const errors = [];
  const title = pr.title ?? '';
  const body = (pr.body ?? '').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const labels = (pr.labels ?? []).map((label) => typeof label === 'string' ? label : label.name);
  const semanticLabels = labels.filter((label) => label?.startsWith('semver:'));

  if (semanticLabels.length !== 1 || !SEMANTIC_LABELS.has(semanticLabels[0])) {
    errors.push('Select exactly one valid semantic label: semver:major, semver:minor, semver:patch or semver:none.');
  }

  // Ticket keys stay in the squash subject; PR text is never executed in a shell.
  const titleMatch = /^([a-z]+)(?:\([a-zA-Z0-9._/-]+\))?(!)?: ([A-Z][A-Z0-9]*-\d+) (\S.*)$/.exec(title);
  let classification;
  if (!titleMatch || /[\r\n]/.test(title)) {
    errors.push('Use a title such as feat: ABC-123 describe the change.');
  } else {
    const [, type, breaking, ticket] = titleMatch;
    classification = classificationFor(type, Boolean(breaking));
    if (!classification) {
      errors.push('Supported title types: feat, fix, docs, chore, ci, build, test, style and refactor.');
    } else if (semanticLabels.length === 1 && semanticLabels[0] !== classification) {
      errors.push(`The title requires ${classification}. Update the title or semantic label.`);
    }

    const ticketLine = /^\*\*Ticket:\*\*[ \t]*(.+)$/m.exec(body)?.[1] ?? '';
    const ticketLink = /\[([A-Z][A-Z0-9]*-\d+)\]\((https:\/\/[^\s)]+)\)/.exec(ticketLine);
    let validLink = false;
    if (ticketLink) {
      try {
        const url = new URL(ticketLink[2]);
        validLink = Boolean(url.hostname) && !url.username && !url.password;
      } catch {
        validLink = false;
      }
    }
    if (!validLink || ticketLink[1] !== ticket) {
      errors.push('Ticket must contain an HTTPS Markdown issue link whose key matches the title.');
    }

    if (/^BREAKING[ -]CHANGE:/m.test(body) && !breaking) {
      errors.push('Put ! in the PR title for breaking changes so the squash subject preserves the classification.');
    }
  }

  if (/^Release-As:/im.test(body) || /BEGIN_COMMIT_OVERRIDE|END_COMMIT_OVERRIDE/.test(body)) {
    errors.push('Normal change PRs cannot override release versions or release commit messages.');
  }
  validateSections(body, errors);

  return { errors, classification };
}

function main() {
  const eventFile = process.env.GITHUB_EVENT_PATH;
  if (!eventFile) throw new Error('GITHUB_EVENT_PATH must point to a pull_request event JSON file.');
  const event = JSON.parse(readFileSync(eventFile, 'utf8'));
  if (!event.pull_request) throw new Error('Expected a pull_request event.');

  const result = validatePullRequest(event.pull_request);
  if (result.errors.length) {
    console.error('PR policy failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PR policy passed (${result.classification}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
