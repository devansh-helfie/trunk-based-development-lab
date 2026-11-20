# Trunk-Based Development Lab

A personal release engineering lab with a minimal Express Order Quote API.
Application development stays small so GitHub Actions, Release Please, tags,
immutable artifacts and QA gates remain the focus.

## Current milestone

The application, flag-management panel, local container and local test suites are
implemented. The first CI workflow and PR policy are drafted and locally tested,
but have not run on GitHub. There are no published images, real releases or
deployment gates yet. Version `1.2.3` is the
learning baseline in package.json, not an existing published release.

## Start locally

Use Node.js 24 or later. Install the locked dependencies with `npm ci`, then run:

```sh
npm start
curl http://127.0.0.1:3000/version
curl -H 'Content-Type: application/json' \
  -d '{"quantity":5}' http://127.0.0.1:3000/api/quote
```

`npm start` binds to localhost by default. Stop it with Ctrl+C.

## Run the local container

Configure the ignored `.env` password as described below, then run:

```sh
docker build --tag trunk-lab:local .
docker compose up --detach --no-build --wait
curl http://127.0.0.1:3010/health
curl http://127.0.0.1:3010/version
```

The container panel is at `http://127.0.0.1:3010/flags`. Sign in as `admin` using
the password in your local `.env`. The first Docker setup generated this file if
it did not exist. It is owner-readable only and ignored by Git and Docker builds.
These credentials are separate from the temporary preview on port 4317.

The Dockerfile uses a digest-pinned official Node.js 24 runtime. `WORKDIR` selects
`/app`; the first `COPY` copies only package manifests; `RUN npm ci` installs their
locked production dependencies without install scripts. The next `COPY` lines
include only backend source and panel assets. `ARG` accepts non-secret source/build
metadata, and `ENV` supplies runtime defaults. `USER node` avoids running as root.
`EXPOSE` documents the internal port; `HEALTHCHECK` probes `/health`; `CMD` starts
Node directly so it receives shutdown signals. No password enters the image.

Compose uses the existing `image`; it has no `build` section. `ports` maps Mac
localhost 3010 to container port 3000. `environment` supplies local settings,
`volumes` keeps flag state across container replacements, and `read_only` makes
the remaining container filesystem read-only. `init` handles child processes;
`restart: unless-stopped` restarts this local app when Docker returns. This is one
LOCAL packaging environment, not the later DEV, TEST and PROD deployments.

`FEATURE_BULK_DISCOUNT` seeds a new volume only. Use the authenticated panel to
change an existing flag. Verify the running container with the expected flag state:

```sh
BASE_URL=http://127.0.0.1:3010 QA_EXPECT_BULK_DISCOUNT=true npm run test:qa
```

Use `false` instead when the saved discount flag is off. With the flag on, the
intentional failure demonstration reuses the same built image:

```sh
DEMO_FAULT=discount-boundary docker compose up --detach --no-build --wait
BASE_URL=http://127.0.0.1:3010 QA_EXPECT_BULK_DISCOUNT=true npm run test:qa
DEMO_FAULT=none docker compose up --detach --no-build --wait
```

The middle command must fail at the five-item price. Always restore normal mode
with the last command. This is fault injection, not a source fix or QA sign-off.
The packaging verification also checked flag persistence across restart and
container replacement. The app still reports unknown commit/digest/build metadata
until real build evidence is wired in. A local image ID is not GHCR publication
evidence. The mutable `trunk-lab:local` tag is only for this packaging milestone;
release deployments will use verified registry digests.

Stop this Compose project with `docker compose down`. Its named flag volume is
retained. Do not use `down --volumes` unless you intend to discard saved flags.

## Manage flags in the app

Open `http://127.0.0.1:3000/flags` after configuring a local password.
The browser sign-in username is `admin`. Generate a password into an ignored file
without printing it to the terminal:

```sh
node --input-type=module -e 'import { randomBytes } from "node:crypto"; import { writeFileSync } from "node:fs"; writeFileSync(".env", "FLAGS_ADMIN_PASSWORD=" + randomBytes(24).toString("base64url") + "\n", { mode: 0o600, flag: "wx" });'
npm start
```

The command refuses to overwrite an existing `.env`. Read your generated password
from `.env` locally and enter it in the browser; never paste it into chat or Git.
The panel stays disabled without a password. Do not expose this local HTTP admin
panel publicly; Basic authentication here assumes localhost access.

The panel supports adding boolean flags, toggling them and removing them, plus a
quote calculator to see the bulk discount affect actual behavior immediately.
New flags start off. Custom flags do nothing until application code consumes them.
Removing `bulkDiscount` disables its behavior; adding it again restores the switch.

Each environment owns its file, defaulting to `data/local-flags.json`,
`data/dev-flags.json`, `data/test-flags.json` or `data/prod-flags.json`.
These runtime files are ignored by Git. Use separate persistent volumes when we
add containers. A file belongs to exactly one environment and one app process.
This small store is not a distributed flag service.

`FEATURE_BULK_DISCOUNT` only seeds a new store. Saved values survive restarts and
take precedence over that environment variable. Changes are written atomically.
Stale browser updates return 409 instead of overwriting a newer change.
Every accepted write increments the revision and changes `configurationId`, even
when toggling back. The admin UI never grants QA approval. QA checks that the
configuration stays unchanged during a run; binding approval to the digest and
configuration identity will be implemented in the later production-gate phase.

## Application behavior

Backend code stays small and grouped by purpose:

- `src/app.js`: HTTP routes and application wiring.
- `src/config.js`: environment settings and validation.
- `src/middleware.js`: admin authentication, request checks and error responses.
- `src/pricing.js`: quote calculation and the intentional QA defect.
- `src/flags.js`: flag validation, revisions and file persistence.
- `src/server.js`: local startup and shutdown.

- `GET /health`: health and application environment.
- `GET /version`: package version, source/build declarations and active configuration.
- `GET /api/features`: current feature flags.
- `POST /api/quote`: quantity from 1 to 100, unit price 1000 cents.
- `FEATURE_BULK_DISCOUNT=true`: 10% discount at quantities of 5 or more.
- `DEMO_FAULT=discount-boundary`: deliberately withholds the discount at exactly 5.

The default flag is off and the default fault mode is `none`. Flags can be managed
through the authenticated panel. `APP_ENV` accepts LOCAL,
DEV, TEST or PROD. Fault injection is rejected in PROD.

## Real local QA pass and fail

```sh
npm test
npm run qa:pass
npm run qa:fail
```

Basic CI checks health, a one-item order, input validation and configuration.
QA checks feature configuration and prices below, at and above the discount
boundary. `qa:fail` must exit nonzero because an actual HTTP price result is
wrong. It does not alter the expected answer or manufacture a test status.

To see basic CI pass while the boundary defect remains detectable by QA:

```sh
FEATURE_BULK_DISCOUNT=true DEMO_FAULT=discount-boundary npm test
npm run qa:fail
```

To exercise the running app with the feature enabled:

```sh
FEATURE_BULK_DISCOUNT=true APP_ENV=DEV npm start
```

To reproduce the defect in a running local TEST instance:

```sh
PORT=3002 APP_ENV=TEST FEATURE_BULK_DISCOUNT=true \
  DEMO_FAULT=discount-boundary npm start
```

From another terminal, validate that exact running instance:

```sh
BASE_URL=http://127.0.0.1:3002 QA_EXPECT_BULK_DISCOUNT=true npm run test:qa
```

If that environment already has saved flags, enable `bulkDiscount` in its panel
first. The seed variable never overwrites a saved flag value.

With `BASE_URL` the QA suite tests that server, not an in-process replacement.
Without it, the suite starts a temporary local server and closes it afterwards.
`QA_EXPECT_BULK_DISCOUNT` is an independent expectation, not a success override.

## Pull requests and semantic classification

Use `.github/pull_request_template.md`. The title and ticket link must use the
same key. Populate User-Facing Changes, Technical Changes, Feature Flags and
Risks, or write `None`. Template comments do not count as content.

- `feat: ABC-123 show version` requires `semver:minor`.
- `fix(api): ABC-123 correct pricing` requires `semver:patch`.
- `feat!: ABC-123 change the API contract` requires `semver:major`.
- `docs: ABC-123 update instructions` requires `semver:none`.

Exactly one valid `semver:*` label is required. Non-releasing types are docs,
chore, ci, build, test, style and refactor. Use `fix(deps)` for a releasing dependency
fix. An exclamation mark on any supported type declares a breaking change.
Conventional squash subjects will drive Release Please; labels only enforce
consistency. This validator does not calculate release versions.

The ticket field accepts an HTTPS Markdown issue link with the title's key.
Use an actual personal-lab issue. Only syntax and consistency are checked; the
script does not fetch issues or access employer systems. Test references are synthetic.
`semver:none` does not independently release, but can accompany other releasing
changes. Release-target labels do not prove inclusion. Normal PR bodies cannot
inject release-version or commit-message overrides. Generated release PR handling
will be added with Release Please; an autorelease label alone exempts nothing.

Run local policy tests with `npm run test:pr-policy`.

### CI workflow walkthrough

Only `ci.yml` is added now. Its keys have these responsibilities:

- `on.pull_request.branches` selects main; `types` reruns checks for new commits,
  title/body edits and semantic-label addition/removal, including draft PRs.
- `on.push.branches` tests main after merges and the reviewed bootstrap push.
- `permissions.contents: read` keeps both jobs read-only.
- `concurrency.group` separates PRs and branch pushes; `cancel-in-progress` cancels
  superseded runs for that PR or ref.
- `jobs.pr-policy.if` skips PR metadata validation on pushes, which have no PR payload.
- Both `runs-on` values use GitHub-hosted Ubuntu. The Mac runner is never selected.
- `timeout-minutes` bounds execution; `steps` run in order within each job.
- `uses` pins official actions to commit SHAs. `persist-credentials: false` keeps
  checkout from retaining its token in Git configuration.
- The policy checkout's `ref` is `base.sha`, so the proposed PR cannot replace the
  validator script for its own check. PR data comes from `GITHUB_EVENT_PATH`.
- Application checkout uses the normal PR merge ref or pushed commit. Setup Node
  selects version 24, matching Docker, with automatic package-manager caching off.
- `run: npm ci` installs the lockfile without install scripts. Subsequent steps
  test policy scenarios and basic application behavior. Formal TEST QA stays separate.

Base-script checkout does not make workflow edits trusted; branch protection and
maintainer review remain necessary. Pending activation: reviewed bootstrap commit
and push, four semantic labels, squash-only merging using the PR title, and required
checks `PR policy` and `Application tests`. Independent approval needs a second
person. Local tests are not claimed as actual GitHub workflow executions.

## Release metadata and evidence

The panel's identification strip shows environment, application version, release
or RC identity, and a short commit SHA. Hover over the SHA to read its full value.
Build run ID and full image digest appear in the details. Missing source/build
metadata displays `Not recorded`; a local build stays `Unreleased`. Nothing in
the panel fabricates a tag or treats a version string as a published release.

The app accepts `COMMIT_SHA`, `RELEASE_IDENTITY`, `IMAGE_DIGEST` and `BUILD_RUN_ID`.
Missing metadata is reported as unknown or unreleased. These runtime declarations
are for display, not proof. Later deployment gates must independently resolve
Git history, GHCR digests, trusted runs, QA approval and release blockers.

The fault switch is local teaching scaffolding. Turning it off is not a source
fix, a QA approval or permission to deploy. The later QA-fix milestone will
demonstrate a real code change on main, a new artifact and revalidation.

Release Please will update package.json and the changelog in a later approved
milestone. RC and stable tags will identify already-built artifacts. No rebuild
on tag creation and no unvalidated metadata commit after QA are intended.
Release Please runs on demand. Its short-lived metadata PR is reviewed, merged
and deleted before candidate building. No stabilization branch is planned;
failed candidates are replaced through new main commits.

## Learning log

- Personal GitHub identity verified: devansh-helfie.
- Public personal repository created and local origin configured.
- Docker Desktop and Compose verified on Apple Silicon.
- Mac runner trunk-lab-mac registered outside this Git repository.
- All external fork contributors require workflow approval.
- Main and release branch force-push/deletion protections verified.
- Required PRs and CI checks await the reviewed bootstrap commit and CI setup.
- Current milestone: small API, persistent flag panel, fault injection and local QA.
- Added the running-version identification strip; app scope remains minimal.
- Refactored backend for readable routes, named validation steps and explicit flag operations.
- Approved on-demand Release Please PR-only integration before RC builds.
- Removed stabilization release branches from the plan; metadata PRs remain short-lived.
- Planned production rule: stable and verified RC tags must resolve to the same commit and artifact.
- Docker image built once; one localhost-only LOCAL container verified on port 3010.
- Container health, non-root execution, flag persistence and real QA pass/fail verified.
- Normal mode restored after fault injection using the same image without rebuild.
- First CI workflow and PR template drafted; policy scenarios verified locally.
- Not activated: GitHub CI, semantic labels, squash settings and required checks.
- Not implemented: registry publication, independent DEV/TEST/PROD and production gates.

## Next milestones, each requiring approval

1. Review the completed local Docker packaging milestone.
2. Review the bootstrap commit; commit and push only after explicit approvals.
3. Activate drafted PR CI, semantic labels, squash settings and required checks.
4. Add immutable GHCR builds and independent local environments.
5. Implement on-demand Release Please and RCs without stabilization branches.
6. Demonstrate QA fixes on main and mandatory TEST-to-PROD gates.
7. Hotfixes, rollback, minimal migrations and the CTO demo.

Public-repository approvals do not make arbitrary code safe on the Mac runner.
PR execution must remain on GitHub-hosted runners. Local deployment jobs must use
trusted definitions, approved images and no employer credentials.
