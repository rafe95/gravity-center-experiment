# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Angular 22 CLI app; unit tests run on Vitest via `@angular/build:unit-test` (jsdom).

- Dev server: `npm start` (http://localhost:4200)
- Build: `npm run build` (output in `dist/`)
- All tests once: `npx ng test --watch=false`
- One spec file: `npx ng test --watch=false --include src/app/gravity-cluster/gravity-layout.spec.ts`
- Tests by name: `npx ng test --watch=false --filter "valueRadii"`
- Format, lint and type-check: `vp check` (add `--fix` to apply fixes). Config lives in the `fmt` and `lint` blocks of `vite.config.ts` (100 cols, single quotes). A pre-commit hook runs `vp staged`.
- Run tests with `ng test`, not `vp test`: bare Vitest lacks the Angular builder and globals, so every spec fails.
- Dev server and build go through Angular: `npm start` / `npm run build` (`vp dev` and `vp build` run Vite, not the Angular app).

## Architecture

The app is an experiment around one reusable component, `app-gravity-cluster`, which draws values as circles packed around a center of gravity. `App` (`src/app/app.*`) is only a demo page: concept examples plus a playground comparing default vs `sorted` mode.

The component is split in two layers under `src/app/gravity-cluster/`:

- `gravity-layout.ts`: pure, framework-free geometry. Two radius strategies (`rankRadii`: shrinks by position; `valueRadii`: linear between `minRatio * baseRadius` for the lowest value and `baseRadius` for the highest) feed `gravityLayout(radii, gap, random?)`. It places circles greedily: circle 0 at the origin; each next circle goes to the non-overlapping candidate spot (on rings around placed circles, or tangent to two of them) that is nearest circle 0, with ties broken by distance to the area-weighted centroid, then horizontal, lower, right. With a `random` source and more than two circles, it instead picks randomly among free spots within `RANDOM_SLACK * r` of the nearest one. The result is recentred on its bounding box. Unit-test layout changes here, including the no-overlap invariant.
- `gravity-cluster.ts`: the Angular component (inline template/styles, SVG). Inputs: `items: {id, value}[]`, `sorted` (orders by value descending and uses `valueRadii`), `randomize` (passes `Math.random`; tests use a seeded PRNG instead), plus sizing knobs `radius`, `gap`, `decay`, `minRatio`. Output `itemClick` emits the item `id`. It computes a square viewBox with a minimum size so small clusters don't fill the panel, and positions nodes with CSS `transform` so moves animate (disabled under `prefers-reduced-motion`). Nodes are tracked by `id`.

Accessibility contract the tests rely on: each circle is a `<g class="node" role="button" tabindex="0">` labelled `Value N`, activated by click/Enter/Space, with a separate `.focus-ring` circle shown on `:focus-visible`. Because of that extra circle, count `.node` elements (not `circle`) in tests. Colors are themeable via `--gravity-cluster-ink`, `--gravity-cluster-fill`, `--gravity-cluster-hover-fill`, `--gravity-cluster-focus`.

## Coding Guidelines

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
