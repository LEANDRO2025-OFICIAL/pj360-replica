// Gera web/src/app/tokens.css a partir de replica/design/tokens.json.
// Rodar depois de qualquer mudança de token (inclusive no /replica-brand):
//   node replica/design/build-tokens.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const t = JSON.parse(readFileSync(here('./tokens.json'), 'utf8'));

const lines = [];
for (const [role, hex] of Object.entries(t.color)) lines.push(`  --tk-${role}: ${hex};`);
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --tk-radius-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.shadow)) lines.push(`  --tk-shadow-${k}: ${v};`);
for (const [k, v] of Object.entries(t.motion)) lines.push(`  --tk-motion-${k}: ${v};`);
for (const [k, v] of Object.entries(t.layout)) if (typeof v === 'number') lines.push(`  --tk-layout-${k}: ${v}px;`);

const css = `/* Gerado por replica/design/build-tokens.mjs a partir de tokens.json. Não editar à mão. */\n:root {\n${lines.join('\n')}\n}\n`;
writeFileSync(here('../../web/src/app/tokens.css'), css);
console.log(`tokens.css: ${lines.length} variáveis`);
