#!/usr/bin/env node
/**
 * generate-feature — scaffold a new STANDARD CRUD module from the `users`
 * reference feature (see docs/ai/11-forms-tables.md and
 * docs/ai/examples/feature-crud.md for the convention this reproduces:
 * Table ⇄ Grid list, filter bar, View/Edit via Modal).
 *
 * Deterministic file copy + text substitution — no AI, no network, no deps.
 * For a module with tier/permission/status-driven rendering, don't use this;
 * copy `src/features/profile` by hand instead (it's the "special module" case).
 *
 * Usage:
 *   node scripts/generate-feature.mjs <plural-kebab-name>
 *   npm run generate:feature -- orders
 *
 * Works cleanly for a single-word plural name (matches `users`). Multi-word
 * names (e.g. `order-items`) will need a manual pass over URL paths, since
 * the camelCase conversion drops the hyphen there.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FEATURE = 'users';

const pluralKebab = process.argv[2];
if (!pluralKebab || !/^[a-z][a-z0-9-]*$/.test(pluralKebab)) {
  console.error('Usage: node scripts/generate-feature.mjs <plural-kebab-name>  (e.g. "orders")');
  process.exit(1);
}

const destDir = path.join(REPO, 'src/features', pluralKebab);
if (fs.existsSync(destDir)) {
  console.error(`✗ src/features/${pluralKebab} already exists.`);
  process.exit(1);
}

function toPascalCase(kebab) {
  return kebab
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');
}
function toCamelCase(kebab) {
  const pascal = toPascalCase(kebab);
  return pascal[0].toLowerCase() + pascal.slice(1);
}
/** Naive last-segment singularizer. Good enough for regular English plurals. */
function naiveSingularizeKebab(kebab) {
  const parts = kebab.split('-');
  const last = parts.at(-1);
  let singular = last;
  if (/ies$/.test(last)) singular = last.replace(/ies$/, 'y');
  else if (/(sses|shes|ches|xes)$/.test(last)) singular = last.replace(/es$/, '');
  else if (/s$/.test(last) && !/ss$/.test(last)) singular = last.replace(/s$/, '');
  parts[parts.length - 1] = singular;
  return parts.join('-');
}

const singularKebab = naiveSingularizeKebab(pluralKebab);
const PluralPascal = toPascalCase(pluralKebab); // Users -> Orders
const SingularPascal = toPascalCase(singularKebab); // User -> Order
const pluralCamel = toCamelCase(pluralKebab); // users -> orders
const singularCamel = toCamelCase(singularKebab); // user -> order

// Longest/most-specific token first so "Users" is fully consumed before "User" is touched.
const REPLACEMENTS = [
  ['Users', PluralPascal],
  ['User', SingularPascal],
  ['users', pluralCamel],
  ['user', singularCamel],
];

function applyReplacements(text) {
  return REPLACEMENTS.reduce((acc, [from, to]) => acc.split(from).join(to), text);
}

// 1. Copy the reference feature directory verbatim.
const srcDir = path.join(REPO, 'src/features', SOURCE_FEATURE);
fs.cpSync(srcDir, destDir, { recursive: true });

// 2. Rewrite file contents, then rename files/dirs (deepest first so renaming
//    a directory doesn't invalidate the paths of files still to be renamed).
const allPaths = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    allPaths.push(full);
  }
})(destDir);

for (const p of allPaths) {
  if (fs.statSync(p).isFile()) {
    const content = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, applyReplacements(content));
  }
}
for (const p of allPaths.sort((a, b) => b.length - a.length)) {
  const dir = path.dirname(p);
  const base = path.basename(p);
  const renamed = applyReplacements(base);
  if (renamed !== base) fs.renameSync(p, path.join(dir, renamed));
}

// 3. Copy the `user.*` i18n block to `<singularCamel>.*` in every locale file.
const localesDir = path.join(REPO, 'src/locales');
for (const locale of fs.readdirSync(localesDir)) {
  const file = path.join(localesDir, locale, 'common.json');
  if (!fs.existsSync(file)) continue;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (json[SOURCE_FEATURE.slice(0, -1)] && !json[singularCamel]) {
    json[singularCamel] = JSON.parse(
      applyReplacements(JSON.stringify(json[SOURCE_FEATURE.slice(0, -1)])),
    );
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  }
}

console.log(`✓ Generated src/features/${pluralKebab}/ from ${SOURCE_FEATURE}.`);
console.log(`  Entity: ${SingularPascal} / ${PluralPascal}   list endpoint: /${pluralCamel}`);
console.log('\nNext steps (not automated — these are product decisions):');
console.log(`  1. src/features/${pluralKebab}/types.ts — replace the User fields with the real ${SingularPascal} shape.`);
console.log(`  2. src/locales/{en,vi}/common.json — the "${singularCamel}" block was copied from "user"; edit its labels.`);
console.log(`  3. app/router/paths.ts + routes.tsx — add a route for ${PluralPascal}Page.`);
console.log('  4. app/layout/AppLayout.tsx — add a nav item if it belongs in the sidebar.');
console.log(`  5. If the backend endpoint isn't literally "/${pluralCamel}", fix it in api/${pluralKebab}-api.ts.`);
