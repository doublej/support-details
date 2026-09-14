# support-details

> Device details you can share with support in one tap

## What this is

**support-details.jurrejan.com**: a one-page site that reads the visiting device (browser, system, screen, accessibility settings, features, network hints, locale) and helps a non-technical person send all of it to whoever is helping them: share sheet, copy link, copy as text, email. The same page renders a received report read-only. SvelteKit prerendered with `adapter-static`, shipped with `just deploy` (`cdy site support-details build`, the NAS Caddy CLI; `cdy prime` for its surface). `bun` for install, Biome for lint + format, `svelte-check` for typechecking, Vitest for tests.

## Mental model

```
src/
├── routes/
│   ├── +layout.ts      # prerender = true, the whole site is static
│   ├── +layout.svelte  # fonts + app.css
│   └── +page.svelte    # modes loading / own / shared / broken; share + copy actions, dock, toast
├── lib/
│   ├── collect.ts      # reads the device into a Report (browser APIs, client-only)
│   ├── ua.ts           # user agent + Client Hints → friendly browser / system / device
│   ├── report.ts       # Report shape, link payload encode/decode + validation, plain-text export
│   ├── clipboard.ts    # copy + share sheet, with fallbacks for old WebViews and plain HTTP
│   └── ui/             # ReportView (glance + sections), SendPanel + ShareGuide (send flow), PhoneQr (desktop QR, uqr), Credits
├── app.css             # tokens (paper / ink / carbon blue), buttons, fields, dock, toast, .rise stagger
└── app.html            # HTML shell, OG + theme-color meta
static/og.html          # social preview source → `just og` renders static/og.png
svelte.config.js        # SvelteKit + adapter config
vite.config.ts          # Vite + Vitest config
package.json            # type: module, scripts, dependencies
tsconfig.json           # extends .svelte-kit/tsconfig.json
biome.json              # lint + format rules
```

The runtime path is `/` → `+page.svelte` reads `location.hash`: `#r=<payload>` decodes and shows a received report, anything else runs `collectReport()` in the browser. `.svelte-kit/` is generated — never edit by hand.

## Report links

- The report lives in the URL fragment (`/#r=<payload>`), so it never reaches the server and there is no backend. Payload = format flag + base64url: `z` deflated JSON, `j` plain JSON for browsers without `CompressionStream`.
- Reports are self-describing (labels travel with values). Rendering never depends on the current collector list, so old links keep working. Changing the shape → bump `v` and keep reading v1.
- Shared links are untrusted: `parseReport` validates the shape, values render as text only (never `{@html}`), and `{#each}` over rows is never keyed by label (duplicate keys in a crafted link would throw).
- A collector reports `null` ("Not available") when the browser does not expose a value. Never guess.
- The share sheet needs the tap's user activation, so the link is precomputed in an `$effect`; never `await` before `navigator.share`.

## Invariants

- File-based routing under `src/routes/` — folder name = URL segment, `+page.svelte` / `+page.ts` / `+page.server.ts` are SvelteKit-reserved.
- Shared code lives in `src/lib/` and imports via `$lib/...`.
- Strict TypeScript — `svelte-check` is the source of truth for types in `.svelte` files.
- Biome handles `.ts` / `.js` / `.json`; Svelte file formatting follows Svelte / Prettier conventions when needed.
- Functions stay small (5–10 lines target, 20 max).
- Errors surface at the boundary; SvelteKit's `+error.svelte` / `hooks.server.ts` translate them to responses.
- GSAP is the animation tool (`gsap` ships by default) — don't add other animation libraries; Svelte's built-in `transition:` directives are fine for trivial enter/leave only.
- `bun` owns the lockfile. Add deps with `bun add <pkg>`.
- The social preview lives in `static/og.html`. Its four base classes — `.og-canvas`, `.og-brand`, `.og-title`, `.og-subtitle` — are fixed: restyle them and the `:root` tokens (font, colors, sizes, layout) and replace the placeholder copy, but never rename or drop them. Screenshot `.og-canvas` at 1200x630 into `static/og.png`.

## Common change patterns

- **Add a route** → new folder under `src/routes/` with a `+page.svelte`.
- **Add an animation** → GSAP inside `$effect` / `onMount` (client-only — never during SSR), with a teardown that kills the tween/timeline.
- **Add data loading** → sibling `+page.ts` (universal) or `+page.server.ts` (server-only).
- **Add an API endpoint** → `+server.ts` with `GET` / `POST` / etc. exports.
- **Add shared code** → module under `src/lib/`, imported via `$lib/...`.
- **Add a dependency** → `bun add <pkg>` (or `bun add -d <pkg>` for dev).

## Verification

Run `just check` after every change. It composes:

`just-fmt-check` + `loc-check` + `dir-check` + `lint` + `typecheck` + `test`

Recipe reference:

- `just install` — `bun install`
- `just dev` — Vite dev server (agent must not run this)
- `just build` — production build
- `just preview` — preview the production build
- `just sync` — regenerate `.svelte-kit/` types
- `just lint` / `just lint-fix` — Biome check / `--write`
- `just typecheck` — `svelte-check`
- `just test` — Vitest
- `just loc-check` / `just dir-check` — file-size and per-directory thresholds from `.quality.json`
- `just og-check` — warns while `static/og.png` is missing (never fails)
- `just just-fmt-check` — verify Justfile formatting
- `just update-scaffold` — pull updates from the cookiecutter template

## Related context

- [agent.md](agent.md) — verify loop, auto-fix commands, common tasks, boundaries
- `.claude/` — Claude Code settings, scaffold-update hook, library-freshness hook, diagnostic logging
- `.quality.json` — loc / dir thresholds (single source of truth)
- As this project grows, add nested `CLAUDE.md` files in high-value subfolders (`src/lib/<feature>/`, `src/routes/<section>/`, design system, integrations) following the `claude-md-tree` skill's context-packet pattern.

<!-- agent-log:policy -->
### Shared agent journal

Use `./agent-log` (a shim for `atlas agent-log` — both are identical) for short-lived
operational awareness between concurrent agents. It is not chat and not a task tracker: the
issue tracker remains the source of truth for ownership, blockers, and durable findings.

- Run `./agent-log recent` before interpreting shared state.
- Before an action that can change another agent's observations, write an intent with every
  affected scope. This includes shared-worktree edits, generated artifacts, git/index
  mutations, and shared ports, processes, or services.
- Run builds, tests, and deployments through the wrapper so start, commit, dirty state,
  duration, exit code, and outcome are recorded even on failure:
  `./agent-log run build|test|deploy --scope <resource> [--bead <id>] -- <command...>`.
- For manual operations, use `./agent-log begin <operation> --scope <resource> [--bead <id>]
  -- <summary>` and always close the returned id with `./agent-log end <id> --outcome
  ok|failed|cancelled -- <result>`. `<operation>` is one of build, commit, deploy, edit, implement, investigate, merge, push, review, sync, test — what
  makes this particular run specific goes in the summary, never in an invented operation name.
- Record a temporary result-affecting discovery with `./agent-log finding --scope <resource>
  --evidence <fact> [--bead <id>] -- <summary>`. This is the entry that saves another agent a
  wasted run, and the one most often skipped — write one whenever you learn something that
  would change what a concurrent agent does next, especially a dead end. Promote lasting
  knowledge to the issue tracker or the relevant doc.
- At session end, write `./agent-log handoff -- <stopping point + next step>` — the durable
  baton the next session's briefing picks up. Handoffs never expire; the latest one is
  always shown by `recent`.
- Intents expire after 20 minutes and findings after 4 hours unless `--ttl` overrides them.
  Renew by closing and reopening an intent; never treat an expired entry as current.
- Keep summaries factual and short. Do not reply, ask questions, mention agents, narrate
  routine progress, or log isolated reads/edits/tests that cannot affect anyone else.

Canonical scopes are `path:<repo-relative-path>`, `artifact:<name>`, `service:<name>`,
`host:<name>`, `port:<number>`, and `git:<worktree-or-ref>`; a repo may define additional
canonical scopes of its own. Add multiple `--scope` flags when needed. The journal SQLite db
lives in the git common directory, so linked worktrees share it without dirtying the repo.
