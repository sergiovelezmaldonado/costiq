// Verificación del motor de CostIQ v3 (frecuencia real) — ejecutar con node.
// Reproduce la fórmula de App.jsx de forma independiente y la compara con:
//  (a) el Sheet "Mi línea base" del Módulo 2 (33,6 h/mes con 10 actividades)
//  (b) la invariante de migración: datos antiguos (sin timesPerMonth) deben dar
//      exactamente el mismo costo que con el motor viejo (min/día × 22).
const assert = (c, m) => { if (!c) { console.error('FALLA:', m); process.exit(1); } };

const cfg = { hourlyCost: 15, workDaysMonth: 22, workDaysWeek: 5 };
const migrate = a => ({ ...a, minutesPerRun: a.minutesPerRun ?? a.minutesPerDay, timesPerMonth: a.timesPerMonth ?? cfg.workDaysMonth });
const engine = a => {
  const hMon = (a.minutesPerRun * a.timesPerMonth) / 60;
  const costMon = hMon * a.affectedEmployees * cfg.hourlyCost;
  const isMeasured = a.minutesWithAI != null && a.minutesWithAI >= 0 && a.minutesWithAI < a.minutesPerRun;
  const aiRatio = isMeasured ? a.minutesWithAI / a.minutesPerRun : (1 - a.aiTimeReduction / 100);
  const savMon = costMon * (1 - aiRatio);
  return { hMon, costMon, savMon, hDay: hMon / cfg.workDaysMonth, hWeek: hMon / cfg.workDaysMonth * cfg.workDaysWeek };
};
const oldEngine = a => { const hMon = a.minutesPerDay / 60 * cfg.workDaysMonth; return { hMon, costMon: hMon * a.affectedEmployees * cfg.hourlyCost }; };

// (a) Las 10 filas del Sheet "Mi línea base" → 33,6 h/mes liberadas (una persona)
const sheet = [
  [240,95,1],[90,35,4],[45,20,12],[120,null,8],[30,10,20],[60,null,10],[120,40,4],[180,75,6],[90,null,1],[150,null,8],
].map(([m,ia,v]) => ({ minutesPerRun:m, minutesWithAI:ia, timesPerMonth:v, affectedEmployees:1, aiTimeReduction:0 }));
const freed = sheet.reduce((s,a) => s + (a.minutesWithAI!=null ? (a.minutesPerRun-a.minutesWithAI)*a.timesPerMonth/60 : 0), 0);
// El Sheet muestra 33,6 (un decimal); el valor exacto es 33,583
assert(Math.abs(freed - 33.6) < 0.05, `Sheet: horas liberadas ${freed} ≠ 33,6`);
const freedEngine = sheet.filter(a=>a.minutesWithAI!=null).reduce((s,a)=> s + engine(a).savMon/cfg.hourlyCost, 0);
assert(Math.abs(freedEngine - freed) < 1e-9, `Motor ${freedEngine} ≠ cálculo directo ${freed}`);

// (b) Migración: SAMPLE_ACTIVITIES de App.jsx, viejo vs nuevo
const samples = [
  { minutesPerDay:45, affectedEmployees:8,  aiTimeReduction:40, minutesWithAI:null },
  { minutesPerDay:30, affectedEmployees:12, aiTimeReduction:70, minutesWithAI:9   },
  { minutesPerDay:60, affectedEmployees:5,  aiTimeReduction:80, minutesWithAI:null },
  { minutesPerDay:25, affectedEmployees:15, aiTimeReduction:60, minutesWithAI:null },
  { minutesPerDay:40, affectedEmployees:6,  aiTimeReduction:85, minutesWithAI:6   },
  { minutesPerDay:20, affectedEmployees:10, aiTimeReduction:50, minutesWithAI:null },
];
let oldTot=0, newTot=0;
for (const s of samples) { const o=oldEngine(s), n=engine(migrate(s)); assert(Math.abs(o.costMon-n.costMon)<1e-9, `migración rompe costo: ${o.costMon} vs ${n.costMon}`); oldTot+=o.costMon; newTot+=n.costMon; }
assert(Math.abs(oldTot-newTot)<1e-9, 'total migrado difiere');

// (c) El caso que motivó el cambio: informe mensual de 240 min
const informe = engine({ minutesPerRun:240, timesPerMonth:1, affectedEmployees:1, aiTimeReduction:0, minutesWithAI:95 });
assert(Math.abs(informe.hMon-4)<1e-9, `informe mensual: ${informe.hMon} h ≠ 4`);
const informeViejo = oldEngine({ minutesPerDay:240, affectedEmployees:1 });
assert(Math.abs(informeViejo.hMon-88)<1e-9, 'control del motor viejo');

console.log(`OK · Sheet 33,6 h reproducido · migración ${oldTot.toFixed(2)} = ${newTot.toFixed(2)} · informe mensual 88 h → ${informe.hMon} h`);
