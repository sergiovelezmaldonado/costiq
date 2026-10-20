// QA del desglose capacidad/caja (v3.1) sobre dist/.
// Con los 6 ejemplos de la app: 4 salario fijo (capacidad), 1 horas extras (caja), 1 calidad.
import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4173/';
const EXE = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const fail = m => { console.error('FALLA:', m); process.exit(1); };
const num = s => parseFloat(String(s).replace(/[^\d.-]/g,''));
const H = 15, D = 22;
// Réplica independiente del motor con los ejemplos actuales
const ex = [
  { min:45,  t:D, n:8,  red:40, ia:null, src:'capacity' },
  { min:30,  t:D, n:12, red:70, ia:9,    src:'capacity' },
  { min:240, t:1, n:2,  red:60, ia:95,   src:'capacity' },
  { min:25,  t:D, n:15, red:60, ia:null, src:'capacity' },
  { min:480, t:1, n:3,  red:50, ia:null, src:'cash' },
  { min:90,  t:4, n:1,  red:60, ia:35,   src:'quality' },
];
const exp = { capacity:0, cash:0, quality:0 }; let expTotal = 0, expH = 0;
for (const e of ex) { const ratio = e.ia!=null ? e.ia/e.min : 1-e.red/100; const hMon = e.min*e.t/60; const sav = hMon*(1-ratio)*e.n*H; exp[e.src]+=sav; expTotal+=sav; expH += hMon*(1-ratio)*e.n; }

const b = await chromium.launch({ executablePath: EXE }); const p = await b.newPage({ viewport:{ width:1400, height:1000 } });
p.on('pageerror', e => fail('error JS: ' + e.message));
await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.getByRole('button', { name: /Dashboard/ }).first().click();
const card = p.locator('text=¿Qué parte del ahorro es dinero?').first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
await card.waitFor();
const txt = await card.innerText();
const grab = label => { const m = txt.match(new RegExp(label + '[\\s\\S]*?\\$([\\d,]+)/mes · (\\d+)%')); return m ? { v: num(m[1]), pct: +m[2] } : null; };
const cap = grab('Capacidad liberada'), cash = grab('Con vía de caja'), qual = grab('No monetizado');
if (!cap || !cash || !qual) fail('faltan filas del desglose: ' + txt);
for (const [k, got] of [['capacity', cap], ['cash', cash], ['quality', qual]]) {
  if (Math.abs(got.v - Math.round(exp[k])) > 1) fail(`${k}: ${got.v} ≠ ${exp[k].toFixed(0)}`);
  if (Math.abs(got.pct - Math.round(exp[k]/expTotal*100)) > 1) fail(`${k} %: ${got.pct} ≠ ${Math.round(exp[k]/expTotal*100)}`);
}
if (!/La mayor parte del ahorro es capacidad/.test(txt)) fail('falta el aviso de capacidad predominante');
if (/sin origen del beneficio/.test(txt)) fail('los ejemplos no deberían tener actividades sin clasificar');
const hLine = txt.match(/([\d.]+) h liberadas\/mes/); if (!hLine || Math.abs(num(hLine[1]) - expH) > 0.1) fail(`horas liberadas ${hLine?.[1]} ≠ ${expH.toFixed(1)}`);
console.log(`Dashboard OK · capacidad $${cap.v} (${cap.pct}%) · caja $${cash.v} (${cash.pct}%) · no monetizado $${qual.v} (${qual.pct}%) · ${expH.toFixed(1)} h`);

// Sin IA / Con IA muestra el mismo desglose (compacto)
await p.getByRole('button', { name: /Sin IA \/ Con IA/ }).first().click();
await p.locator('text=¿Qué parte del ahorro es dinero?').first().waitFor();
console.log('Sin IA/Con IA OK · desglose presente');

// Reporte: conclusión con la frase de desglose
await p.getByRole('button', { name: /Reporte/ }).first().click();
const concl = await p.locator('text=Conclusión ejecutiva').first().locator('xpath=..').innerText();
if (!/corresponden a capacidad liberada/.test(concl) || !/vía de caja identificada/.test(concl)) fail('conclusión sin desglose: ' + concl.slice(0, 300));
if (/está perdiendo|baja productividad/.test(concl)) fail('la conclusión conserva el lenguaje antiguo');
console.log('Reporte OK ·', concl.slice(0, 160).replace(/\n/g,' ') + '…');

// Editar el origen en la tabla cambia la vista
await p.getByRole('button', { name: /Actividades/ }).first().click();
// Al editar, el nombre pasa a un <input> y la fila deja de matchear por texto: se fija por índice
const rows = p.locator('tbody tr'); const names = await rows.allInnerTexts();
const idx = names.findIndex(t => t.includes('Reuniones sin agenda clara')); if (idx < 0) fail('fila no encontrada');
const row = rows.nth(idx);
await row.getByRole('button', { name: 'Editar' }).click();
const sel = row.locator('select').last(); await sel.waitFor();
await sel.selectOption('vendor');
await p.getByRole('button', { name: /Dashboard/ }).first().click();
const txt2 = await card.innerText(); const cash2 = grab.call(null, 'Con vía de caja');
const cash2v = (txt2.match(/Con vía de caja[\s\S]*?\$([\d,]+)\/mes/) || [])[1];
if (!cash2v || num(cash2v) <= cash.v) fail(`cambiar origen a proveedor no movió caja: ${cash2v}`);
console.log(`Edición OK · caja pasó de $${cash.v} a $${num(cash2v)} al reclasificar una actividad`);
await b.close(); console.log('QA v3.1: todo OK');
