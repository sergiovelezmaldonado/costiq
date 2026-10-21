// QA de alineación y suma de totales en todas las tablas, a varios anchos de pantalla.
// Usa los datos de la captura de Sergio: 3 actividades, costo/hora 9.
import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4173/';
const EXE = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const fail = m => { console.error('FALLA:', m); process.exit(1); };
const num = s => parseFloat(String(s).replace(/[^\d.-]/g, ''));
const ACTS = [
  { id:'a1', name:'Buscar archivos y documentos', category:'Búsqueda de información',  minutesPerRun:60, timesPerMonth:4,  affectedEmployees:1, automationPotential:'Alto', aiTimeReduction:50, minutesWithAI:10, benefitSource:'unknown' },
  { id:'a2', name:'Elaborar reportes manuales',    category:'Reportes y documentación', minutesPerRun:90, timesPerMonth:22, affectedEmployees:1, automationPotential:'Alto', aiTimeReduction:50, minutesWithAI:20, benefitSource:'unknown' },
  { id:'a3', name:'Responder correos repetitivos', category:'Comunicación interna',     minutesPerRun:60, timesPerMonth:22, affectedEmployees:1, automationPotential:'Alto', aiTimeReduction:50, minutesWithAI:10, benefitSource:'unknown' },
];
const CFG = { companyName:'QA', department:'', globalEmployees:1, hourlyCost:9, workDaysWeek:5, workDaysMonth:22, currency:'USD' };
// Esperado, calculado aparte: 4 h·9=36 · 33 h·9=297 · 22 h·9=198
const EXP = { mon: 531, yr: 6372, sav: 30 + 231 + 165 };

const b = await chromium.launch({ executablePath: EXE });
let checks = 0;
for (const width of [1920, 1280, 1000, 760, 600]) {
  const p = await b.newPage({ viewport: { width, height: 1000 } });
  p.on('pageerror', e => fail('error JS: ' + e.message));
  await p.goto(URL);
  await p.evaluate(({ a, c }) => { localStorage.setItem('ciq-acts-v2', JSON.stringify(a)); localStorage.setItem('ciq-cfg-v2', JSON.stringify(c)); }, { a: ACTS, c: CFG });
  await p.reload();
  for (const tab of ['Actividades', 'Sin IA / Con IA']) {
    await p.getByRole('button', { name: tab }).first().click(); await p.waitForTimeout(200);
    const tables = p.locator('table:has(thead)');
    for (let t = 0; t < await tables.count(); t++) {
      const res = await tables.nth(t).evaluate(tb => {
        const vis = el => el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'none';
        const heads = [...tb.querySelectorAll('thead th')].filter(vis).map(th => ({ t: th.innerText.replace(/\?/g, '').trim(), r: th.getBoundingClientRect() }));
        const totRow = tb.querySelector('tfoot tr') || [...tb.querySelectorAll('tbody tr')].find(tr => /TOTAL/i.test(tr.innerText));
        if (!totRow) return { heads: heads.map(h => h.t), cells: [] };
        const cells = [...totRow.children].filter(vis).map(td => ({ t: td.innerText.trim(), r: td.getBoundingClientRect() }));
        // Para cada celda con cifra, qué encabezado tiene encima (por centro horizontal)
        const map = cells.filter(c => /\$|\d/.test(c.t) && !/TOTAL/i.test(c.t)).map(c => {
          const cx = c.r.left + c.r.width / 2;
          const h = heads.find(h => cx >= h.r.left - 1 && cx <= h.r.right + 1);
          const spans = heads.filter(h => h.r.left < c.r.right - 1 && h.r.right > c.r.left + 1).map(h => h.t);
          return { val: c.t, head: h?.t ?? null, spans };
        });
        const rowsW = [...tb.querySelectorAll('tbody tr')].map(tr => [...tr.children].filter(vis).length);
        return { heads: heads.map(h => h.t), map, nHeads: heads.length, nCells: cells.reduce((s, c, i) => s + 1, 0), rowsW };
      });
      if (!res.map?.length) continue;
      const label = `${tab} · tabla ${t} · ${width}px`;
      for (const m of res.map) {
        const v = num(m.val);
        if (/Ahorro/.test(m.val)) { if (Math.abs(v - EXP.sav) > 1) fail(`${label}: ahorro ${v} ≠ ${EXP.sav}`); continue; }
        if (Math.abs(v - EXP.mon) < 1) { if (!m.spans.some(h => /mes|Sin IA/i.test(h) && !/año|Veces|Con IA/i.test(h))) fail(`${label}: total mensual ${m.val} bajo «${m.spans.join(' + ')}»`); }
        else if (Math.abs(v - EXP.yr) < 1) { if (!m.spans.some(h => /año/i.test(h))) fail(`${label}: total anual ${m.val} bajo «${m.spans.join(' + ')}»`); }
        else if (Math.abs(v - (EXP.mon - EXP.sav)) < 1) { if (!m.spans.some(h => /Con IA/i.test(h))) fail(`${label}: total con IA ${m.val} bajo «${m.spans.join(' + ')}»`); }
        else if (Math.abs(v - EXP.sav * 12) < 1) { if (!m.spans.some(h => /año|anual/i.test(h))) fail(`${label}: ahorro anual ${m.val} bajo «${m.spans.join(' + ')}»`); }
        else if (Math.abs(v - EXP.sav) < 1) { if (!m.spans.some(h => /Ahorro/i.test(h))) fail(`${label}: ahorro ${m.val} bajo «${m.spans.join(' + ')}»`); }
        else if (v === 3) { if (!m.spans.some(h => /Personas|Pers/i.test(h))) fail(`${label}: suma de personas bajo «${m.spans.join(' + ')}»`); }
        else if (/%/.test(m.val) || /h$/.test(m.val)) { /* promedios/horas: no se valida posición */ }
        else fail(`${label}: cifra inesperada en totales: ${m.val} (bajo «${m.spans.join(' + ')}»)`);
        checks++;
      }
      // Que la fila de totales no tenga más celdas visibles que columnas
      const maxRow = Math.max(...res.rowsW); if (maxRow !== res.nHeads) fail(`${label}: filas con ${maxRow} celdas y ${res.nHeads} encabezados`);
    }
  }
  await p.close();
}
await b.close();
console.log(`Totales OK · ${checks} cifras de total verificadas en posición y valor (5 anchos de pantalla)`);
