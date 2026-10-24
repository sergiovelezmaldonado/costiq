// QA del importador: CSV real exportado de la hoja «Mi línea base» (Google Sheets)
// y una variante con ";" y decimales con coma (Excel en español).
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:4173/';
const EXE = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const fail = m => { console.error('FALLA:', m); process.exit(1); };
const num = s => parseFloat(String(s).replace(/[^\d.-]/g, ''));

// Esperado, leído del CSV con un parser independiente (no el de la app)
const csv = fs.readFileSync('scripts/fixtures/mi-linea-base.csv', 'utf8');
const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
const hi = lines.findIndex(l => l.startsWith('Actividad,'));
const splitQ = l => { const out = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(c); c = ''; } else c += ch; } out.push(c); return out; };
const expected = lines.slice(hi + 1).map(splitQ).filter(r => r[0] && +r[2] > 0)
  .map(r => ({ name: r[0], without: +r[2], withAI: r[1] === 'Sí' && r[3] !== '' ? +r[3] : null, times: +r[5] }));
if (expected.length < 5) fail('el fixture tiene pocas filas: ' + expected.length);
const expHMon = expected.reduce((s, e) => s + e.without * e.times / 60, 0);
const expFreed = expected.filter(e => e.withAI != null).reduce((s, e) => s + (e.without - e.withAI) * e.times / 60, 0);

const b = await chromium.launch({ executablePath: EXE });
async function importAndRead(file, label) {
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  p.on('pageerror', e => fail(`${label}: error JS ` + e.message));
  let dialogMsg = '';
  p.on('dialog', d => { dialogMsg = d.message(); d.accept(); });
  await p.goto(URL);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ciq-cfg-v2', JSON.stringify({ companyName:'QA', department:'', globalEmployees:1, hourlyCost:10, workDaysWeek:5, workDaysMonth:22, currency:'USD' })); });
  await p.reload();
  await p.getByRole('button', { name: /Actividades/ }).first().click();
  await p.locator('input[type=file][accept*=".csv"]').setInputFiles(file);
  await p.waitForTimeout(400);
  if (!/Mi línea base/.test(dialogMsg)) fail(`${label}: no reconoció la hoja. Diálogo: ${dialogMsg}`);
  const rows = await p.$$eval('tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim())));
  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('ciq-acts-v2')));
  await p.getByRole('button', { name: /Dashboard/ }).first().click();
  const mensual = await p.locator('div:has(> div:text-is("Mensual")) >> div.text-xl').first().innerText();
  const freedTxt = (await p.locator('text=h liberadas/mes').first().innerText());
  await p.close();
  return { dialogMsg, rows, stored, mensual: num(mensual), freed: num(freedTxt) };
}

// (1) CSV real de Google Sheets
const r1 = await importAndRead('scripts/fixtures/mi-linea-base.csv', 'Google CSV');
if (r1.stored.length !== expected.length) fail(`Google CSV: ${r1.stored.length} actividades ≠ ${expected.length} (los ejemplos debían reemplazarse)`);
for (const e of expected) {
  const a = r1.stored.find(x => x.name === e.name); if (!a) fail('falta ' + e.name);
  if (a.minutesPerRun !== e.without || a.timesPerMonth !== e.times || a.minutesWithAI !== e.withAI) fail(`${e.name}: ${JSON.stringify(a)} ≠ ${JSON.stringify(e)}`);
}
if (Math.abs(r1.mensual - expHMon) > 0.1) fail(`horas/mes ${r1.mensual} ≠ ${expHMon.toFixed(1)}`);
const noAI = expected.filter(e => e.withAI == null).length;
// Las sin IA usan el 50 % estimado; las con IA, el dato medido
const expFreedAll = expFreed + expected.filter(e => e.withAI == null).reduce((s, e) => s + e.without * e.times / 60 * 0.5, 0);
if (Math.abs(r1.freed - expFreedAll) > 0.1) fail(`horas liberadas ${r1.freed} ≠ ${expFreedAll.toFixed(1)}`);
console.log(`(1) Google CSV OK · ${expected.length} actividades · ${r1.mensual} h/mes · medidas liberan ${expFreed.toFixed(1)} h (la hoja: 33,6) · ${noAI} sin IA con % estimado`);

// (2) Variante Excel en español: ";" y decimales con coma, con un decimal real en minutos
const semi = [
  'TU LÍNEA BASE · Actividades de tu puesto;;;;;;',
  'Actividad;¿Usas IA?;Tiempo SIN IA (min);Tiempo CON IA (min);Diferencia (min);Veces al mes;Horas al mes',
  '"Conciliar extractos ""banco; tarjeta""";Sí;45,5;12;33,5;8;4,5',
  'Atender reclamos;No;20;;;30;',
].join('\r\n');
fs.writeFileSync('scripts/fixtures/linea-base-semicolon.csv', '\uFEFF' + semi);
const r2 = await importAndRead('scripts/fixtures/linea-base-semicolon.csv', 'Excel ;');
const c = r2.stored.find(a => a.name === 'Conciliar extractos "banco; tarjeta"');
if (!c || c.minutesPerRun !== 45.5 || c.minutesWithAI !== 12 || c.timesPerMonth !== 8) fail('Excel ;: ' + JSON.stringify(r2.stored));
if (r2.stored.length !== 2) fail(`Excel ;: ${r2.stored.length} actividades ≠ 2`);
console.log('(2) Excel con ";" OK · comillas con separador dentro y decimal "45,5" leídos bien');

// (3) La plantilla propia de CostIQ sigue importando por la ruta de siempre
const tpl = 'Actividad,Categoría,Min por ejecución,Empleados afectados,Potencial IA,% Reducción,Min con IA,Veces al mes\r\n"Informe, mensual",Reportes y documentación,240,2,Alto,60,95,1\r\n';
fs.writeFileSync('scripts/fixtures/plantilla-costiq.csv', tpl);
const p3 = await b.newPage(); p3.on('dialog', d => d.accept());
await p3.goto(URL); await p3.evaluate(() => localStorage.setItem('ciq-acts-v2', '[]')); await p3.reload();
await p3.getByRole('button', { name: /Actividades/ }).first().click();
await p3.locator('input[type=file][accept*=".csv"]').setInputFiles('scripts/fixtures/plantilla-costiq.csv'); await p3.waitForTimeout(300);
const st3 = await p3.evaluate(() => JSON.parse(localStorage.getItem('ciq-acts-v2')));
if (st3.length !== 1 || st3[0].name !== 'Informe, mensual' || st3[0].minutesPerRun !== 240 || st3[0].timesPerMonth !== 1 || st3[0].affectedEmployees !== 2) fail('plantilla CostIQ: ' + JSON.stringify(st3));
console.log('(3) Plantilla CostIQ OK · nombre con coma entre comillas ya no se parte');
await b.close(); console.log('QA importador: todo OK');
