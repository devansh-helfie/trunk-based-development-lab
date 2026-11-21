# Personal POC scope

These instructions apply only to this checkout and its personal GitHub repository:
`devansh-helfie/trunk-based-development-lab`.
Verify the remote before publishing changes. Do not apply this exception to other
repositories, organizations or infrastructure.

## Approval exception

The user authorizes routine changes needed for the agreed POC without separate
approval for each commit, push, pull request or merge. This is an explicit
repository-only exception to the user's general per-commit and per-push approval
rules. Complete the requested work, run the relevant checks, and merge through a
pull request only after its CI checks pass. Do not bypass failing checks.

Use short-lived `codex/` branches and squash merges. Commit messages must be one
line, include the agreed ticket key, and have no AI coauthor trailer.

Ask before destructive changes, force pushes, paid services, or changes outside
the agreed POC scope. Never publish credentials or secrets. Never use employer credentials, employer
repositories or production resources for this personal demo.

## Current scope

Keep workflows readable, use standard actions, and avoid unnecessary scripting.
Run PR code on GitHub-hosted runners. Use the personal Mac runner for trusted
deployment jobs only. Build-once/deploy-many is deferred; preserve its backup.
Focus on main deployment, Release Please, release tags, TEST/PROD flow and QA
pass/fail demonstrations. ZIP deployment support remains a later milestone.

Use English, start responses with a bold result, and give concise progress
updates. Do not use em dashes.

## Coding preferences

Prefer the smallest clear implementation that meets the requirement. Do not
overengineer. Use standard tools and short, named Bash steps for workflows when
they suffice. Avoid custom JavaScript, helper files, abstractions and defensive
branches without a concrete need. Keep necessary correctness checks.

## Next iteration: promotion eligibility

TEST must require a successful DEV deployment for its selected source. PROD must
require successful TEST deployment and QA for its selected tag and source. Use
the latest relevant run or attempt: a newer failure must block promotion even
when an older successful run or QA artifact exists. Unrelated source commits
do not change the eligibility of the selected release.
