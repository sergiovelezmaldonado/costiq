// QA del HelpTip: el tooltip debe quedar íntegro dentro del viewport y no recortado
// por la tarjeta. Prueba el caso reportado (ROI → "Costo mensual de herramientas IA")
// y un muestreo de todos los "?" de cada pestaña.
import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:4173/';
const EXE = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1228/chrome-win64/chrome.exe`;
const fail = m => { console.error('FALLA:', m); process.exit(1); };
const b = await chromium.launch({ executablePath: EXE });
const p = await b.newPage({ viewport: { width: 1920, height: 1040 } });
p.on('pageerror', e => fail('error JS: ' + e.message));
await p.goto(URL);

const check = async (tip, label) => {
  await tip.hover();
  const tt = p.locator('[role="tooltip"]');
  await tt.waitFor({ timeout: 2000 });
  const box = await tt.boundingBox(); const vw = 1920, vh = 1040;
  if (!box) fail(`${label}: sin caja`);
  if (box.x < 0 || box.y < 0 || box.x + box.width > vw || box.y + box.height > vh) fail(`${label}: fuera del viewport ${JSON.stringify(box)}`);
  // Nada recortado: el texto completo debe ser visible según elementFromPoint en sus 4 esquinas
  // Puntos 10 px hacia dentro: a 2 px caen fuera de las esquinas redondeadas (rounded-lg) y dan falso positivo
  const clipped = await tt.evaluate(el => {
    const r = el.getBoundingClientRect(); const i = 10;
    const pts = [[r.left+i,r.top+i],[r.right-i,r.top+i],[r.left+i,r.bottom-i],[r.right-i,r.bottom-i],[r.left+r.width/2,r.top+r.height/2]];
    return pts.filter(([x,y]) => { const e = document.elementFromPoint(x,y); return !(e === el || el.contains(e)); }).length;
  });
  if (clipped) fail(`${label}: ${clipped} esquina(s) tapadas por otro elemento`);
  const txt = (await tt.innerText()).trim();
  await p.mouse.move(5, 5); await tt.waitFor({ state: 'detached', timeout: 2000 });
  return txt;
};

// Caso reportado
await p.getByRole('button', { name: /^ROI$|ROI/ }).first().click();
const roiTip = p.locator('label:has-text("Costo mensual de herramientas IA") button[aria-label="Ayuda"]').first();
const txt = await check(roiTip, 'ROI/Costo mensual');
if (!/Make/.test(txt)) fail('texto del tooltip incompleto: ' + txt);
console.log('caso reportado OK ·', txt.length, 'car visibles ·', txt.slice(0, 60) + '…');

// Muestreo: todos los ? de cada pestaña
let total = 0;
for (const tab of ['Configuración', 'Actividades', 'Dashboard', 'Sin IA / Con IA', 'ROI', 'Reporte']) {
  await p.getByRole('button', { name: tab }).first().click(); await p.waitForTimeout(150);
  const tips = p.locator('button[aria-label="Ayuda"]'); const n = await tips.count();
  for (let i = 0; i < n; i++) { const t = tips.nth(i); if (await t.isVisible()) { await t.scrollIntoViewIfNeeded(); await check(t, `${tab}#${i}`); total++; } }
}
await b.close(); console.log(`HelpTip OK · ${total} tooltips íntegros en viewport`);
