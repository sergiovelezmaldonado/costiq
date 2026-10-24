// QA del catálogo de actividades (src/catalog.js + modal «Elegir del catálogo»).
// Contratos: 10 áreas × 15; las 10 primeras de cada área son las de la Sesión 1;
// ninguna actividad no diaria se carga como diaria; seleccionar área completa y cargar
// funciona; los tiempos llegan «por confirmar» y la marca se va al editar.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { CATALOG } from '../src/catalog.js';
const URL = process.env.URL || 'http://localhost:4173/';
const EXE = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const fail = m => { console.error('FALLA:', m); process.exit(1); };

// ── 1. Contratos de datos ──────────────────────────────────────────────────
const S1 = JSON.parse(fs.readFileSync('scripts/catalog-gen/catalogo_dia_s1.json', 'utf8'));
if (CATALOG.length !== 10) fail(`áreas: ${CATALOG.length}`);
const names = new Set();
for (const a of CATALOG) {
  if (a.items.length !== 15) fail(`${a.area}: ${a.items.length} actividades`);
  const s1 = S1.filter(x => x.area === a.area).map(x => x.name);
  a.items.slice(0, 10).forEach((it, k) => { if (it.name !== s1[k]) fail(`${a.area} #${k + 1} no es la de la Sesión 1: ${it.name}`); });
  for (const it of a.items) {
    if (names.has(it.name)) fail('duplicada: ' + it.name); names.add(it.name);
    if (!(it.minutes > 0) || !(it.reduction > 0 && it.reduction < 100)) fail('valores inválidos: ' + it.name);
    const daily = it.times === 'daily';
    if (daily !== (it.freq === 'Diaria')) fail(`frecuencia incoherente: ${it.name} (${it.freq} → ${it.times})`);
    if (!daily && !(it.times > 0 && it.times <= 12)) fail(`veces/mes fuera de rango: ${it.name} ${it.times}`);
    if (/mensual|del mes/i.test(it.name) && it.times !== 1) fail(`actividad mensual con ${it.times} veces/mes: ${it.name}`);
    if (/semanal|de la semana/i.test(it.name) && it.times !== 4) fail(`actividad semanal con ${it.times} veces/mes: ${it.name}`);
  }
}
console.log(`(1) datos OK · 150 actividades, 100 de la Sesión 1 en su orden, sin duplicados ni frecuencias incoherentes`);

// ── 2. Interfaz ────────────────────────────────────────────────────────────
const b = await chromium.launch({ executablePath: EXE });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on('pageerror', e => fail('error JS: ' + e.message));
p.on('dialog', d => d.accept());
await p.goto(URL);
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ciq-cfg-v2', JSON.stringify({ companyName:'QA', department:'', globalEmployees:1, hourlyCost:10, workDaysWeek:5, workDaysMonth:22, currency:'USD' })); });
await p.reload();
await p.locator('nav button', { hasText: 'Actividades' }).first().click();
await p.getByRole('button', { name: /Elegir del catálogo/ }).first().click();
const dlg = p.getByRole('dialog', { name: 'Catálogo de actividades' });
await dlg.waitFor();

// Área Talento humano completa (15) + 1 suelta de Finanzas
const TH = CATALOG.find(a => a.area === 'Talento humano');
await dlg.getByRole('button', { name: /^Talento humano/ }).click();
await dlg.getByRole('button', { name: 'Seleccionar todas del área' }).click();
await dlg.getByRole('button', { name: /^Finanzas y control de gestión/ }).click();
const FIN = CATALOG.find(a => a.area === 'Finanzas y control de gestión').items[0]; // mensual, 120 min
await dlg.locator('label', { hasText: FIN.name }).locator('input[type=checkbox]').check();
// El botón de área debe mostrar el contador
if (!/· 15/.test(await dlg.getByRole('button', { name: /^Talento humano/ }).innerText())) fail('falta el contador por área');
// Buscador cruza áreas
await dlg.getByPlaceholder(/Buscar en las 150/).fill('contrato');
const hits = await dlg.locator('label').count();
const expHits = CATALOG.flatMap(a => a.items).filter(it => /contrato/i.test(it.name + ' ' + it.produce)).length;
if (hits !== expHits) fail(`buscador: ${hits} resultados ≠ ${expHits}`);
await dlg.getByPlaceholder(/Buscar en las 150/).fill('');
await dlg.getByRole('button', { name: /^Cargar 16 actividades$/ }).click();
await dlg.waitFor({ state: 'detached' });

const st = await p.evaluate(() => JSON.parse(localStorage.getItem('ciq-acts-v2')));
if (st.length !== 16) fail(`cargadas ${st.length} ≠ 16 (los ejemplos debían reemplazarse)`);
if (!st.every(a => a.refTimes === true)) fail('no todas llegan «por confirmar»');
const fin = st.find(a => a.name === FIN.name);
if (fin.timesPerMonth !== 1 || fin.minutesPerRun !== FIN.minutes) fail('actividad mensual mal cargada: ' + JSON.stringify(fin));
for (const it of TH.items) {
  const a = st.find(x => x.name === it.name); if (!a) fail('falta ' + it.name);
  const exp = it.times === 'daily' ? 22 : it.times;
  if (Math.abs(a.timesPerMonth - exp) > 1e-9) fail(`${it.name}: ${a.timesPerMonth} veces/mes ≠ ${exp}`);
}
console.log(`(2) carga OK · área completa (15) + 1 suelta · frecuencias reales · buscador ${hits} resultados`);

// Marca y aviso
const marks = await p.locator('tbody >> text=por confirmar').count();
if (marks !== 16) fail(`marcas «por confirmar»: ${marks} ≠ 16`);
const banner = await p.locator('text=usan tiempos de referencia').first().innerText();
if (!/16 de 16/.test(banner)) fail('aviso incorrecto: ' + banner);
// Las horas: una actividad mensual de 120 min aporta 2 h, no 44 h
await p.locator('nav button', { hasText: 'Dashboard' }).first().click();
const mensual = parseFloat((await p.locator('div:has(> div:text-is("Mensual")) >> div.text-xl').first().innerText()).replace(/[^\d.]/g, ''));
const expH = st.reduce((s, a) => s + a.minutesPerRun * a.timesPerMonth / 60, 0);
if (Math.abs(mensual - expH) > 0.1) fail(`horas/mes ${mensual} ≠ ${expH.toFixed(1)}`);
console.log(`(3) marca y aviso OK · 16 «por confirmar» · ${expH.toFixed(1)} h/mes`);

// Editar los minutos confirma la fila
await p.locator('nav button', { hasText: 'Actividades' }).first().click();
const rows = p.locator('tbody tr'); const texts = await rows.allInnerTexts();
const idx = texts.findIndex(t => t.includes(FIN.name));
await rows.nth(idx).getByRole('button', { name: 'Editar' }).click();
await rows.nth(idx).locator('input[type=number]').first().fill('90');
const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem('ciq-acts-v2')));
const fin2 = st2.find(a => a.name === FIN.name);
if (fin2.refTimes !== false || fin2.minutesPerRun !== 90) fail('editar no confirmó la fila: ' + JSON.stringify(fin2));
if (st2.filter(a => a.refTimes).length !== 15) fail('la confirmación afectó a otras filas');
console.log('(4) edición OK · al escribir sus minutos la fila deja de estar «por confirmar» (15 restantes)');

// Actividad ya cargada aparece deshabilitada al reabrir
await p.getByRole('button', { name: /Elegir del catálogo/ }).first().click();
await dlg.getByRole('button', { name: /^Talento humano/ }).click();
const disabled = await dlg.locator('input[type=checkbox]:disabled').count();
if (disabled !== 15) fail(`al reabrir, ${disabled} deshabilitadas ≠ 15`);
console.log('(5) sin duplicados OK · las 15 ya cargadas aparecen como «ya está en tu lista»');
await b.close(); console.log('QA catálogo: todo OK');
