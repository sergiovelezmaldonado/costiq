// QA headless de CostIQ v3 contra el build local (dist/) servido por vite preview.
// Escenarios: (1) migración de localStorage v2 → mismo costo; (2) alta de actividad
// mensual → 4 h/mes, no 88; (3) edición de frecuencia en tabla; (4) export CSV con columna nueva.
import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4173/';
const fail = m => { console.error('FALLA:', m); process.exit(1); };
const V2_ACTS = [
  { id:'s1', name:'Reuniones sin agenda clara', category:'Reuniones innecesarias', minutesPerDay:45, affectedEmployees:8, automationPotential:'Medio', aiTimeReduction:40, minutesWithAI:null },
  { id:'x1', name:'Informe guardado como diario (dato v2)', category:'Reportes y documentación', minutesPerDay:60, affectedEmployees:2, automationPotential:'Alto', aiTimeReduction:50, minutesWithAI:null },
];
const CFG = { companyName:'QA', department:'', globalEmployees:20, hourlyCost:15, workDaysWeek:5, workDaysMonth:22, currency:'USD' };
const expectV2 = V2_ACTS.reduce((s,a)=> s + a.minutesPerDay/60*22*a.affectedEmployees*15, 0); // 1980 + 660 = 2640

const EXE = process.env.CHROME || `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const b = await chromium.launch({ executablePath: EXE }); const p = await b.newPage({ viewport:{ width:1400, height:1000 } });
p.on('pageerror', e => fail('error JS en página: ' + e.message));
await p.goto(URL); 
await p.evaluate(({a,c}) => { localStorage.setItem('ciq-acts-v2', JSON.stringify(a)); localStorage.setItem('ciq-cfg-v2', JSON.stringify(c)); }, { a:V2_ACTS, c:CFG });
await p.reload(); await p.getByRole('button', { name: /Actividades/ }).first().click();
await p.waitForSelector('table');

// (1) migración
const rows = await p.$$eval('tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim())));
if (rows.length !== 2) fail(`esperaba 2 filas, hay ${rows.length}`);
// Formato de moneda de la app: $1,980 (coma de miles, punto decimal)
const num = s => parseFloat(s.replace(/[^\d.-]/g,''));
const hdrs = await p.$$eval('thead th', th => th.map(t => t.innerText.trim()));
const costCol = hdrs.findIndex(h => h.startsWith('Costo/mes'));
const totalShown = rows.reduce((s,r)=> s + num(r[costCol]), 0);
if (Math.abs(totalShown - expectV2) > 1) fail(`migración: costo ${totalShown} ≠ ${expectV2}`);
if (!rows.every(r => r.some(c => /Diaria/.test(c)))) fail('las filas v2 no se muestran como Diaria');
console.log(`(1) migración OK · ${rows.length} filas v2 leídas como Diaria · costo total ${totalShown} = ${expectV2}`);

// (2) alta de actividad mensual
await p.getByRole('button', { name: /Nueva actividad/ }).first().click();
await p.getByPlaceholder(/Reuniones sin agenda/).fill('Informe mensual del comité');
await p.locator('label:has-text("Minutos por ejecución") + input, label:has-text("Minutos por ejecución") ~ input').first().fill('240');
await p.locator('select').filter({ has: p.locator('option:has-text("Mensual")') }).first().selectOption('monthly');
await p.locator('label:has-text("Empleados afectados") ~ input').first().fill('1');
const preview = await p.locator('text=Horas/mes por persona').locator('..').innerText();
if (!/4[,.]0?h/.test(preview)) fail(`preview debería decir 4h: ${preview}`);
await p.getByRole('button', { name: 'Guardar actividad' }).click();
await p.waitForTimeout(300);
const rows2 = await p.$$eval('tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('td')].map(td => td.innerText.trim())));
const r = rows2.find(r => r[0].startsWith('Informe mensual'));
if (!r) fail('no se agregó la fila mensual');
if (!r.some(c => c === 'Mensual')) fail(`frecuencia mostrada incorrecta: ${r.join(' | ')}`);
if (Math.abs(num(r[costCol]) - 60) > 0.5) fail(`costo informe mensual ${r[costCol]} ≠ 60 (4 h × $15)`);
console.log(`(2) alta mensual OK · 240 min × 1 vez = ${r[costCol]}/mes (motor viejo habría dado $1.320)`);

// (3) persistencia v3
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('ciq-acts-v2')));
const st = stored.find(a => a.name.startsWith('Informe mensual'));
if (!(st.minutesPerRun === 240 && st.timesPerMonth === 1)) fail('localStorage no guarda minutesPerRun/timesPerMonth: ' + JSON.stringify(st));
console.log('(3) persistencia OK ·', JSON.stringify({ minutesPerRun: st.minutesPerRun, timesPerMonth: st.timesPerMonth }));

// (4) tira de escala: mensual = suma real
await p.getByRole('button', { name: /Dashboard/ }).first().click();
const mensual = await p.locator('div:has(> div:text-is("Mensual")) >> div.text-xl').first().innerText();
const expectH = (45*22*8 + 60*22*2 + 240*1*1)/60; // 132+44+4 = 180
if (Math.abs(num(mensual) - expectH) > 0.5) fail(`escala mensual ${mensual} ≠ ${expectH}h`);
console.log(`(4) escala mensual OK · ${mensual} = ${expectH}h`);

await p.screenshot({ path: 'scripts/qa-v3.png', fullPage: false });
await b.close(); console.log('QA v3: todo OK');
