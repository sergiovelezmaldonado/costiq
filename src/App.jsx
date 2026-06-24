import { useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  red: '#b00020', redDark: '#8c001a', blue: '#2A5B8C',
  charcoal: '#222222', gray: '#333333', grayMid: '#757575',
  border: '#e5e5e5', white: '#ffffff', softPink: '#fff5f6',
  green: '#16a34a', greenBg: '#dcfce7',
  yellow: '#854d0e', yellowBg: '#fef9c3',
  errorBg: '#fee2e2', errorText: '#b91c1c',
};

const PIE_PALETTE = ['#b00020','#2A5B8C','#d97706','#16a34a','#7c3aed','#0891b2','#be185d','#065f46','#92400e','#1e40af'];

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Reuniones innecesarias',
  'Búsqueda de información',
  'Reportes y documentación',
  'Comunicación interna',
  'Procesos manuales repetitivos',
  'Revisiones y aprobaciones',
  'Entrada de datos manual',
  'Coordinación y seguimiento',
  'Otra',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'Dólar (USD)' },
  { code: 'MXN', symbol: '$',  name: 'Peso mexicano (MXN)' },
  { code: 'COP', symbol: '$',  name: 'Peso colombiano (COP)' },
  { code: 'EUR', symbol: '€',  name: 'Euro (EUR)' },
  { code: 'ARS', symbol: '$',  name: 'Peso argentino (ARS)' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano (PEN)' },
  { code: 'CLP', symbol: '$',  name: 'Peso chileno (CLP)' },
];

const SAMPLE_ACTIVITIES = [
  { id:'s1', name:'Reuniones sin agenda clara',       category:'Reuniones innecesarias',         minutesPerDay:45, affectedEmployees:8,  automationPotential:'Medio', aiTimeReduction:40, minutesWithAI:null },
  { id:'s2', name:'Buscar archivos y documentos',     category:'Búsqueda de información',        minutesPerDay:30, affectedEmployees:12, automationPotential:'Alto',  aiTimeReduction:70, minutesWithAI:9   },
  { id:'s3', name:'Elaborar reportes manuales',       category:'Reportes y documentación',       minutesPerDay:60, affectedEmployees:5,  automationPotential:'Alto',  aiTimeReduction:80, minutesWithAI:null },
  { id:'s4', name:'Responder correos repetitivos',    category:'Comunicación interna',           minutesPerDay:25, affectedEmployees:15, automationPotential:'Alto',  aiTimeReduction:60, minutesWithAI:null },
  { id:'s5', name:'Captura de datos en formularios',  category:'Entrada de datos manual',        minutesPerDay:40, affectedEmployees:6,  automationPotential:'Alto',  aiTimeReduction:85, minutesWithAI:6   },
  { id:'s6', name:'Revisiones y aprobaciones lentas', category:'Revisiones y aprobaciones',      minutesPerDay:20, affectedEmployees:10, automationPotential:'Medio', aiTimeReduction:50, minutesWithAI:null },
];

const SAMPLE_IDS = new Set(SAMPLE_ACTIVITIES.map(s => s.id));

const ACTIVITY_LIBRARY = [
  { area:'Operaciones', color:'#2A5B8C', bg:'#dbeafe', activities:[
    { name:'Reuniones de seguimiento sin agenda clara',              category:'Reuniones innecesarias',         minutesPerDay:45, affectedEmployees:8, automationPotential:'Medio', aiTimeReduction:40 },
    { name:'Aprobación manual de solicitudes internas',              category:'Revisiones y aprobaciones',      minutesPerDay:30, affectedEmployees:6, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Coordinación de entregas por correo o WhatsApp',         category:'Coordinación y seguimiento',    minutesPerDay:25, affectedEmployees:5, automationPotential:'Medio', aiTimeReduction:50 },
    { name:'Registro manual de inventario',                          category:'Entrada de datos manual',       minutesPerDay:40, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Elaboración de informes de estado semanales',            category:'Reportes y documentación',      minutesPerDay:35, affectedEmployees:4, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Seguimiento de tareas por correo en lugar de sistema',   category:'Coordinación y seguimiento',    minutesPerDay:20, affectedEmployees:8, automationPotential:'Medio', aiTimeReduction:55 },
    { name:'Actualización manual de hojas de cálculo compartidas',   category:'Entrada de datos manual',       minutesPerDay:30, affectedEmployees:5, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Verificación manual de cumplimiento de procesos',        category:'Revisiones y aprobaciones',     minutesPerDay:25, affectedEmployees:4, automationPotential:'Medio', aiTimeReduction:45 },
  ]},
  { area:'Recursos Humanos', color:'#7c3aed', bg:'#ede9fe', activities:[
    { name:'Revisión manual de CVs y postulaciones',                 category:'Procesos manuales repetitivos', minutesPerDay:60, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Coordinación de entrevistas por correo',                 category:'Comunicación interna',          minutesPerDay:20, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:60 },
    { name:'Onboarding sin materiales digitales estandarizados',     category:'Procesos manuales repetitivos', minutesPerDay:45, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Gestión de solicitudes de vacaciones por correo',        category:'Comunicación interna',          minutesPerDay:15, affectedEmployees:4, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Elaboración de contratos desde cero',                    category:'Reportes y documentación',      minutesPerDay:50, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Seguimiento manual de evaluaciones de desempeño',        category:'Coordinación y seguimiento',    minutesPerDay:30, affectedEmployees:3, automationPotential:'Medio', aiTimeReduction:50 },
    { name:'Recopilación de firmas en documentos físicos',           category:'Procesos manuales repetitivos', minutesPerDay:25, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Actualización de nómina en hojas de cálculo',            category:'Entrada de datos manual',       minutesPerDay:35, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:75 },
  ]},
  { area:'Marketing y Comunicaciones', color:'#be185d', bg:'#fce7f3', activities:[
    { name:'Redacción manual de publicaciones para redes sociales',  category:'Reportes y documentación',      minutesPerDay:45, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Reportes de métricas copiados manualmente',              category:'Reportes y documentación',      minutesPerDay:40, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Respuesta manual a comentarios en redes sociales',       category:'Comunicación interna',          minutesPerDay:30, affectedEmployees:2, automationPotential:'Medio', aiTimeReduction:50 },
    { name:'Creación de materiales gráficos sin plantillas base',    category:'Procesos manuales repetitivos', minutesPerDay:60, affectedEmployees:2, automationPotential:'Medio', aiTimeReduction:45 },
    { name:'Segmentación manual de listas de contactos',             category:'Entrada de datos manual',       minutesPerDay:35, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Elaboración de informes de campañas en PowerPoint',      category:'Reportes y documentación',      minutesPerDay:50, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Transcripción manual de grabaciones o entrevistas',      category:'Procesos manuales repetitivos', minutesPerDay:60, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:90 },
  ]},
  { area:'Finanzas y Contabilidad', color:'#065f46', bg:'#d1fae5', activities:[
    { name:'Conciliación bancaria en hojas de cálculo',              category:'Entrada de datos manual',       minutesPerDay:60, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Elaboración de facturas una por una',                    category:'Procesos manuales repetitivos', minutesPerDay:40, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Seguimiento de cuentas por cobrar por correo',           category:'Coordinación y seguimiento',    minutesPerDay:30, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Cálculo manual de comisiones de ventas',                 category:'Entrada de datos manual',       minutesPerDay:45, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Preparación de reportes financieros mensuales',          category:'Reportes y documentación',      minutesPerDay:90, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Digitalización manual de comprobantes físicos',          category:'Entrada de datos manual',       minutesPerDay:30, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Consolidación de datos de múltiples hojas de cálculo',   category:'Entrada de datos manual',       minutesPerDay:50, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Revisión manual de gastos y reembolsos',                 category:'Revisiones y aprobaciones',     minutesPerDay:25, affectedEmployees:3, automationPotential:'Medio', aiTimeReduction:55 },
  ]},
  { area:'Ventas y CRM', color:'#b45309', bg:'#fef3c7', activities:[
    { name:'Actualización manual del CRM después de llamadas',       category:'Entrada de datos manual',       minutesPerDay:30, affectedEmployees:8, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Elaboración de cotizaciones en Word o Excel',            category:'Reportes y documentación',      minutesPerDay:45, affectedEmployees:5, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Seguimiento de leads por correo o WhatsApp',             category:'Coordinación y seguimiento',    minutesPerDay:25, affectedEmployees:6, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Preparación manual de presentaciones de ventas',         category:'Reportes y documentación',      minutesPerDay:60, affectedEmployees:4, automationPotential:'Medio', aiTimeReduction:50 },
    { name:'Registro de llamadas y visitas en planillas',            category:'Entrada de datos manual',       minutesPerDay:20, affectedEmployees:8, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Elaboración de reportes de pipeline manualmente',        category:'Reportes y documentación',      minutesPerDay:40, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Envío manual de propuestas comerciales a prospectos',    category:'Comunicación interna',          minutesPerDay:20, affectedEmployees:5, automationPotential:'Alto',  aiTimeReduction:60 },
  ]},
  { area:'Tecnología / TI', color:'#1e40af', bg:'#dbeafe', activities:[
    { name:'Documentación técnica sin plantillas estandarizadas',    category:'Reportes y documentación',      minutesPerDay:45, affectedEmployees:4, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Seguimiento de tickets de soporte por correo',           category:'Coordinación y seguimiento',    minutesPerDay:30, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Actualización manual de registros en múltiples sistemas',category:'Entrada de datos manual',       minutesPerDay:40, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Generación manual de reportes de bugs o incidentes',     category:'Reportes y documentación',      minutesPerDay:30, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Revisión manual de logs de error del sistema',           category:'Búsqueda de información',       minutesPerDay:25, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Comunicación de cambios sin gestión formal de releases',  category:'Comunicación interna',          minutesPerDay:20, affectedEmployees:4, automationPotential:'Medio', aiTimeReduction:50 },
  ]},
  { area:'Atención al Cliente', color:'#0891b2', bg:'#cffafe', activities:[
    { name:'Respuesta manual a preguntas frecuentes por correo',     category:'Comunicación interna',          minutesPerDay:60, affectedEmployees:5, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Escalamiento de casos sin sistema de tickets',           category:'Coordinación y seguimiento',    minutesPerDay:20, affectedEmployees:5, automationPotential:'Medio', aiTimeReduction:55 },
    { name:'Elaboración manual de reportes de satisfacción',         category:'Reportes y documentación',      minutesPerDay:35, affectedEmployees:2, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Seguimiento de quejas en hojas de cálculo',              category:'Entrada de datos manual',       minutesPerDay:25, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Redacción de respuestas personalizadas desde cero',      category:'Comunicación interna',          minutesPerDay:45, affectedEmployees:4, automationPotential:'Alto',  aiTimeReduction:65 },
    { name:'Transferencia de información entre turnos sin registro',  category:'Reportes y documentación',      minutesPerDay:20, affectedEmployees:6, automationPotential:'Medio', aiTimeReduction:50 },
  ]},
  { area:'Dirección y Gerencia', color:'#9f1239', bg:'#ffe4e6', activities:[
    { name:'Preparación manual de presentaciones ejecutivas',        category:'Reportes y documentación',      minutesPerDay:60, affectedEmployees:3, automationPotential:'Medio', aiTimeReduction:55 },
    { name:'Consolidación de reportes de diferentes áreas',          category:'Búsqueda de información',       minutesPerDay:45, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Agendamiento manual de reuniones ejecutivas',            category:'Coordinación y seguimiento',    minutesPerDay:20, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Elaboración de actas de reunión sin estructura',         category:'Reportes y documentación',      minutesPerDay:30, affectedEmployees:4, automationPotential:'Alto',  aiTimeReduction:80 },
    { name:'Seguimiento de compromisos por correo o notas físicas',  category:'Coordinación y seguimiento',    minutesPerDay:25, affectedEmployees:5, automationPotential:'Medio', aiTimeReduction:60 },
  ]},
  { area:'Logística y Compras', color:'#92400e', bg:'#fef9c3', activities:[
    { name:'Cotización con múltiples proveedores por correo',        category:'Comunicación interna',          minutesPerDay:45, affectedEmployees:3, automationPotential:'Medio', aiTimeReduction:50 },
    { name:'Seguimiento de órdenes de compra en hojas de cálculo',   category:'Coordinación y seguimiento',    minutesPerDay:30, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:70 },
    { name:'Elaboración manual de órdenes de compra',                category:'Entrada de datos manual',       minutesPerDay:25, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:75 },
    { name:'Control de inventario en planillas físicas',             category:'Entrada de datos manual',       minutesPerDay:40, affectedEmployees:3, automationPotential:'Alto',  aiTimeReduction:85 },
    { name:'Coordinación de entregas y embarques por WhatsApp',      category:'Coordinación y seguimiento',    minutesPerDay:20, affectedEmployees:4, automationPotential:'Medio', aiTimeReduction:45 },
  ]},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);

const todayISO = () => new Date().toISOString().slice(0, 10);
const slugify = (s) =>
  String(s || 'empresa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'empresa';

const fmt = (n, currency = 'USD', dec = 0) => {
  const s = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$';
  return `${s}${Number(n).toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
};

const fmtN = (n, d = 1) =>
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

const parseXLSRows = (text) => {
  let startIdx = text.indexOf('Name="Plantilla CostIQ"');
  if (startIdx < 0) startIdx = text.indexOf('<Worksheet');
  if (startIdx < 0) return [];
  const endIdx = text.indexOf('</Worksheet>', startIdx);
  const wsText = endIdx > 0 ? text.slice(startIdx, endIdx) : text.slice(startIdx);
  const rows = [];
  const rowRE = /<Row[^>]*>([\s\S]*?)<\/Row>/g;
  let rowMatch; let firstRow = true;
  while ((rowMatch = rowRE.exec(wsText)) !== null) {
    if (firstRow) { firstRow = false; continue; }
    const cells = [];
    const dataRE = /<Data[^>]*>([\s\S]*?)<\/Data>/g;
    let dm;
    while ((dm = dataRE.exec(rowMatch[1])) !== null) cells.push(dm[1].trim());
    if (cells[0]) rows.push(cells);
  }
  return rows;
};

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────────
function usePersisted(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = useCallback(fn => {
    setVal(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

// ─── SMALL UI PRIMITIVES ─────────────────────────────────────────────────────
function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        className="text-[#2A5B8C] font-bold text-[10px] border border-[#2A5B8C] rounded-full w-[15px] h-[15px] inline-flex items-center justify-center leading-none"
      >?</button>
      {open && (
        <div className="absolute z-50 bg-white border border-[#e5e5e5] rounded-lg shadow-xl p-3 text-xs text-[#333] w-56 left-5 top-0 leading-relaxed">
          {text}
        </div>
      )}
    </span>
  );
}

function KPI({ label, value, sub, color = C.red, icon, highlight, help }) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${highlight ? 'border-[#b00020]' : 'border-[#e5e5e5]'}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] text-[#757575] font-semibold uppercase tracking-wider leading-tight flex items-center gap-0.5">
          {label}{help && <HelpTip text={help} />}
        </span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className="text-xl font-bold leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[#757575] mt-0.5 leading-tight">{sub}</div>}
    </div>
  );
}

function Card({ title, action, children, noPad, help }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden mb-6">
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5] bg-[#fff5f6]">
          <h3 className="text-sm font-semibold text-[#222] flex items-center">
            {title}{help && <HelpTip text={help} />}
          </h3>
          {action}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

function Fld({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#333] mb-1">
        {label}{help && <HelpTip text={help} />}
      </label>
      {children}
    </div>
  );
}

function PotBadge({ v }) {
  const m = { Alto: ['#dcfce7','#15803d'], Medio: ['#fef9c3','#854d0e'], Bajo: ['#fee2e2','#b91c1c'] }[v] || ['#f3f4f6','#6b7280'];
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m[0], color: m[1] }}>{v}</span>;
}

function SavBadge({ pct, measured }) {
  const color = pct >= 60 ? C.green : pct >= 30 ? C.yellow : C.red;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[11px] font-bold" style={{ color }}>-{pct}%</span>
      <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full ${measured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-[#757575]'}`}>
        {measured ? '✓ Medido' : 'Estimado'}
      </span>
    </div>
  );
}

const inp = "w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm text-[#222] focus:outline-none focus:border-[#b00020] focus:ring-1 focus:ring-[#b00020] transition-colors bg-white";
const btnR = "bg-[#b00020] hover:bg-[#8c001a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer";
const btnO = "border border-[#e5e5e5] hover:border-[#b00020] text-[#333] hover:text-[#b00020] text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-white cursor-pointer";

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#222] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{fmt(p.value, currency)}</strong></p>
      ))}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {

  // ── Persistent state ──────────────────────────────────────────────────────
  const [cfg, setCfg] = usePersisted('ciq-cfg-v2', {
    companyName: 'Mi Empresa',
    department: '',
    globalEmployees: 20,
    hourlyCost: 15,
    workDaysWeek: 5,
    workDaysMonth: 22,
    currency: 'USD',
  });

  const [acts, setActs] = usePersisted('ciq-acts-v2', SAMPLE_ACTIVITIES);

  const [roi, setRoi] = usePersisted('ciq-roi-v2', {
    aiToolMonthly: 200,
    aiToolOneTime: 500,
    implCost: 1000,
    implMonths: 2,
    adoptionRate: 80,
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('guide');
  const [about, setAbout] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLib, setSelectedLib] = useState({});
  const [libFilter, setLibFilter] = useState('Todas');

  const blankAct = { name:'', category:CATEGORIES[0], minutesPerDay:30, affectedEmployees:cfg.globalEmployees, automationPotential:'Medio', aiTimeReduction:50, minutesWithAI:null };
  const [draft, setDraft] = useState(blankAct);

  const curr = CURRENCIES.find(c => c.code === cfg.currency) || CURRENCIES[0];

  // True while the loaded activities are the built-in sample set (used for the banner + confirm guard)
  const isSampleData = acts.length > 0 && acts.every(a => SAMPLE_IDS.has(a.id));

  // ── Calculations ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => acts.map(a => {
    const hDay  = a.minutesPerDay / 60;
    const hMon  = hDay * cfg.workDaysMonth;
    const hYear = hMon * 12;
    const costMon  = hMon  * a.affectedEmployees * cfg.hourlyCost;
    const costYear = costMon * 12;
    // If measured AI time exists, derive reduction from it; otherwise use estimated slider
    const isMeasured = a.minutesWithAI != null && a.minutesWithAI >= 0 && a.minutesWithAI < a.minutesPerDay;
    const aiRatio    = isMeasured ? a.minutesWithAI / a.minutesPerDay : (1 - a.aiTimeReduction / 100);
    const effectiveReduction = Math.round((1 - aiRatio) * 100);
    const aiHMon    = hMon * aiRatio;
    const aiCostMon = aiHMon * a.affectedEmployees * cfg.hourlyCost;
    const savMon  = costMon - aiCostMon;
    const savYear = savMon * 12;
    return { ...a, hDay, hMon, hYear, costMon, costYear, aiHMon, aiCostMon, savMon, savYear, isMeasured, effectiveReduction };
  }), [acts, cfg]);

  const tot = useMemo(() => {
    const totalHMon    = metrics.reduce((s, m) => s + m.hMon * m.affectedEmployees, 0);
    const totalCostMon = metrics.reduce((s, m) => s + m.costMon, 0);
    const totalCostYr  = totalCostMon * 12;
    const totalSavMon  = metrics.reduce((s, m) => s + m.savMon, 0);
    const totalSavYr   = totalSavMon * 12;
    const avgRed       = metrics.length ? metrics.reduce((s, m) => s + m.aiTimeReduction, 0) / metrics.length : 0;
    const topCost      = metrics.length ? [...metrics].sort((a,b) => b.costMon - a.costMon)[0] : null;
    const topSav       = metrics.length ? [...metrics].sort((a,b) => b.savMon  - a.savMon)[0]  : null;
    return { totalHMon, totalCostMon, totalCostYr, totalSavMon, totalSavYr, avgRed, topCost, topSav };
  }, [metrics]);

  const roiCalc = useMemo(() => {
    const monthlySav   = tot.totalSavMon * (roi.adoptionRate / 100);
    const initInvest   = roi.aiToolOneTime + roi.implCost;
    const monthlyOngoing = roi.aiToolMonthly;
    let breakEven = null;
    const projection = Array.from({ length: 36 }, (_, i) => {
      const m   = i + 1;
      const inv = initInvest + monthlyOngoing * m;
      const sav = m <= roi.implMonths ? 0 : monthlySav * (m - roi.implMonths);
      const net = sav - inv;
      if (!breakEven && net >= 0) breakEven = m;
      return { m, inv: Math.round(inv), sav: Math.round(sav), net: Math.round(net) };
    });
    const roi12 = projection[11]  ? ((projection[11].sav  - projection[11].inv)  / Math.max(projection[11].inv,  1)) * 100 : 0;
    const roi24 = projection[23]  ? ((projection[23].sav  - projection[23].inv)  / Math.max(projection[23].inv,  1)) * 100 : 0;
    const roi36 = projection[35]  ? ((projection[35].sav  - projection[35].inv)  / Math.max(projection[35].inv,  1)) * 100 : 0;
    return { monthlySav, initInvest, monthlyOngoing, breakEven, projection, roi12, roi24, roi36 };
  }, [tot, roi]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartActs = useMemo(() =>
    [...metrics].sort((a,b) => b.costMon - a.costMon).slice(0, 8).map(m => ({
      name: m.name.length > 22 ? m.name.slice(0,22)+'…' : m.name,
      'Sin IA': Math.round(m.costMon),
      'Con IA': Math.round(m.aiCostMon),
      Ahorro:   Math.round(m.savMon),
    })), [metrics]);

  const chartCat = useMemo(() => {
    const by = {};
    metrics.forEach(m => { by[m.category] = (by[m.category] || 0) + m.costMon; });
    return Object.entries(by).map(([name, value]) => ({
      name: name.length > 28 ? name.slice(0,28)+'…' : name,
      value: Math.round(value),
    }));
  }, [metrics]);

  const chart12 = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    mes: `M${i+1}`,
    'Sin IA': Math.round(tot.totalCostMon * (i+1)),
    'Con IA': Math.round((tot.totalCostMon - tot.totalSavMon) * (i+1)),
    Ahorro:   Math.round(tot.totalSavMon * (i+1)),
  })), [tot]);

  // ── Activity CRUD ─────────────────────────────────────────────────────────
  const addAct = () => {
    if (!draft.name.trim()) return;
    setActs(p => [...p, { ...draft, id: uid() }]);
    setDraft(blankAct);
    setAddOpen(false);
  };

  const updAct = (id, field, val) =>
    setActs(p => p.map(a => a.id === id ? { ...a, [field]: val } : a));

  const delAct = id => {
    const act = acts.find(a => a.id === id);
    if (!window.confirm(`¿Eliminar la actividad "${act?.name || ''}"? Esta acción no se puede deshacer.`)) return;
    setActs(p => p.filter(a => a.id !== id));
  };

  const loadSample = () => {
    if (acts.length > 0 && !isSampleData &&
        !window.confirm('Esto reemplazará las actividades actuales con los datos de ejemplo. ¿Continuar?')) return;
    setActs(SAMPLE_ACTIVITIES);
  };

  const clearAll = () => {
    if (!window.confirm('¿Limpiar todos los datos?')) return;
    setActs([]);
    setCfg({ companyName:'Mi Empresa', department:'', globalEmployees:20, hourlyCost:15, workDaysWeek:5, workDaysMonth:22, currency:'USD' });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const hdr = ['Actividad','Categoría','Min/día','Min con IA (medido)','Empleados','Horas/mes (total)','Costo mensual','Costo anual','Costo mensual con IA','Ahorro mensual','Ahorro anual','% Reducción efectiva','Origen reducción','Potencial IA'];
    const rows = metrics.map(m => [
      `"${m.name}"`, `"${m.category}"`, m.minutesPerDay,
      m.minutesWithAI != null ? m.minutesWithAI : '',
      m.affectedEmployees,
      (m.hMon * m.affectedEmployees).toFixed(1),
      m.costMon.toFixed(2), m.costYear.toFixed(2),
      m.aiCostMon.toFixed(2), m.savMon.toFixed(2), m.savYear.toFixed(2),
      m.effectiveReduction, m.isMeasured ? 'Medido' : 'Estimado',
      m.automationPotential,
    ]);
    const csv = [hdr, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `costiq-reporte-${slugify(cfg.companyName)}-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      app: 'CostIQ', version: 2,
      empresa: cfg.companyName, departamento: cfg.department,
      fecha: new Date().toLocaleDateString('es-MX'),
      // Bloque restaurable — lo lee "Cargar análisis"
      estado: { cfg, acts, roi },
      // Resumen legible (no se usa al reimportar)
      resumen: {
        actividades: metrics,
        totales: { costoMensual: tot.totalCostMon, costoAnual: tot.totalCostYr, ahorroMensual: tot.totalSavMon, ahorroAnual: tot.totalSavYr },
        roi: { breakEven: roiCalc.breakEven, roi12: roiCalc.roi12, roi24: roiCalc.roi24, roi36: roiCalc.roi36 },
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `costiq-${slugify(cfg.companyName)}-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // Restaura un análisis completo desde un .json exportado por CostIQ
  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data;
      try { data = JSON.parse(ev.target.result); }
      catch { alert('No se pudo leer el archivo. Asegúrate de que sea un JSON exportado por CostIQ.'); return; }
      // Acepta el formato v2 (estado) y, por compatibilidad, el antiguo (config/actividades)
      const st = data?.estado || (data?.config ? { cfg: data.config, acts: data.actividades, roi: null } : null);
      if (!st || !st.cfg || !Array.isArray(st.acts)) {
        alert('Este archivo no es un análisis de CostIQ válido. Usa un archivo exportado con "Exportar JSON".');
        return;
      }
      if (acts.length > 0 && !isSampleData &&
          !window.confirm('Esto reemplazará el análisis actual con el del archivo. ¿Continuar?')) return;
      const clean = st.acts.filter(a => a && a.name).map(a => ({
        id: a.id || uid(),
        name: String(a.name),
        category: CATEGORIES.includes(a.category) ? a.category : CATEGORIES[0],
        minutesPerDay: Math.max(1, parseInt(a.minutesPerDay) || 30),
        affectedEmployees: Math.max(1, parseInt(a.affectedEmployees) || 1),
        automationPotential: ['Alto','Medio','Bajo'].includes(a.automationPotential) ? a.automationPotential : 'Medio',
        aiTimeReduction: Math.min(100, Math.max(0, parseInt(a.aiTimeReduction) || 50)),
        minutesWithAI: (a.minutesWithAI != null && a.minutesWithAI !== '' && !isNaN(+a.minutesWithAI)) ? +a.minutesWithAI : null,
      }));
      setCfg(c => ({ ...c, ...st.cfg }));
      setActs(clean);
      if (st.roi) setRoi(r => ({ ...r, ...st.roi }));
      setTab('dashboard');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // ── Word export (HTML → .doc, sin librerías) ───────────────────────────────
  const exportWord = () => {
    const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const dateStr = new Date().toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' });
    const sorted = [...metrics].sort((a,b) => b.costMon - a.costMon);

    const kpiCard = (label, value, color) =>
      `<td style="border:1px solid #e5e5e5;padding:10px 12px;text-align:center;">
         <div style="font-size:9pt;color:#757575;margin-bottom:4px;">${esc(label)}</div>
         <div style="font-size:15pt;font-weight:bold;color:${color};">${esc(value)}</div>
       </td>`;

    const actRows = sorted.map(m => `
      <tr>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;">${esc(m.name)}<div style="font-size:8pt;color:#757575;">${esc(m.category)}</div></td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:center;">${m.affectedEmployees}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#b00020;font-weight:bold;">${esc(fmt(m.costMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#2A5B8C;">${esc(fmt(m.aiCostMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#16a34a;font-weight:bold;">${esc(fmt(m.savMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:center;color:#16a34a;">-${m.effectiveReduction}%${m.isMeasured ? ' ✓' : ''}</td>
      </tr>`).join('');

    const conclusion = roiCalc.breakEven
      ? `La inversión en IA estimada se recuperaría en aproximadamente <b>${roiCalc.breakEven} meses</b>, generando un ROI del <b>${fmtN(roiCalc.roi12, 0)}%</b> a los 12 meses.`
      : `Ajusta los parámetros de inversión en la pestaña ROI para calcular el período de retorno.`;

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Reporte CostIQ</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
</head>
<body style="font-family:Calibri,Arial,sans-serif;color:#222222;font-size:11pt;">
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;"><tr>
    <td style="width:42px;vertical-align:middle;">
      <table style="border-collapse:collapse;"><tr><td bgcolor="#b00020" style="width:36px;height:36px;text-align:center;color:#ffffff;font-weight:bold;font-size:16pt;border-radius:8px;">F</td></tr></table>
    </td>
    <td style="vertical-align:middle;padding-left:10px;">
      <div style="font-size:16pt;font-weight:bold;color:#222222;">${esc(cfg.companyName)}${cfg.department ? ' · ' + esc(cfg.department) : ''}</div>
      <div style="font-size:10pt;color:#757575;">Análisis de costos ocultos por ineficiencia operativa</div>
    </td>
    <td style="vertical-align:middle;text-align:right;color:#757575;font-size:9pt;">
      CostIQ · <b style="color:#b00020;">FuturIA</b><br>${esc(dateStr)}
    </td>
  </tr></table>

  <h3 style="color:#b00020;border-bottom:2px solid #b00020;padding-bottom:4px;">Resumen ejecutivo</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr>
    ${kpiCard('Costo mensual actual', fmt(tot.totalCostMon, cfg.currency), '#b00020')}
    ${kpiCard('Costo anual actual', fmt(tot.totalCostYr, cfg.currency), '#b00020')}
    ${kpiCard('Ahorro mensual c/IA', fmt(tot.totalSavMon, cfg.currency), '#16a34a')}
    ${kpiCard('Ahorro anual c/IA', fmt(tot.totalSavYr, cfg.currency), '#16a34a')}
  </tr></table>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr>
    ${kpiCard('Break-even estimado', roiCalc.breakEven ? 'Mes ' + roiCalc.breakEven : '> 36 meses', '#2A5B8C')}
    ${kpiCard('ROI a 12 meses', fmtN(roiCalc.roi12, 0) + '%', roiCalc.roi12 > 0 ? '#16a34a' : '#b00020')}
    ${kpiCard('Reducción promedio con IA', fmtN(tot.avgRed, 0) + '%', '#16a34a')}
  </tr></table>

  <h3 style="color:#b00020;border-bottom:2px solid #b00020;padding-bottom:4px;">Actividades analizadas (${acts.length})</h3>
  <table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:20px;">
    <thead><tr style="background:#fff5f6;">
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:left;">Actividad</th>
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:center;">Pers.</th>
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;">Sin IA/mes</th>
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;">Con IA/mes</th>
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;">Ahorro/mes</th>
      <th style="border:1px solid #e5e5e5;padding:6px 8px;text-align:center;">Reducción</th>
    </tr></thead>
    <tbody>${actRows}
      <tr style="background:#fff5f6;font-weight:bold;">
        <td colspan="2" style="border:1px solid #e5e5e5;padding:6px 8px;">TOTAL</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#b00020;">${esc(fmt(tot.totalCostMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#2A5B8C;">${esc(fmt(tot.totalCostMon - tot.totalSavMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:right;color:#16a34a;">${esc(fmt(tot.totalSavMon, cfg.currency))}</td>
        <td style="border:1px solid #e5e5e5;padding:6px 8px;text-align:center;color:#16a34a;">-${fmtN(tot.avgRed, 0)}%</td>
      </tr>
    </tbody>
  </table>

  <h3 style="color:#b00020;border-bottom:2px solid #b00020;padding-bottom:4px;">Conclusión ejecutiva</h3>
  <p style="line-height:1.5;"><b>${esc(cfg.companyName)}</b> está perdiendo <b>${esc(fmt(tot.totalCostYr, cfg.currency))} anuales</b> en ${acts.length} actividad${acts.length !== 1 ? 'es' : ''} de baja productividad identificadas. Con la adopción de herramientas de inteligencia artificial, se estima un ahorro potencial de <b>${esc(fmt(tot.totalSavYr, cfg.currency))} por año</b> (${fmtN(tot.avgRed, 0)}% de reducción promedio en tiempo). ${conclusion}</p>
  ${tot.topCost ? `<p style="font-size:9pt;color:#757575;">La actividad de mayor costo es <b>"${esc(tot.topCost.name)}"</b> con un impacto de <b>${esc(fmt(tot.topCost.costMon, cfg.currency))}/mes</b> (${esc(fmt(tot.topCost.costYear, cfg.currency))}/año).</p>` : ''}
  <p style="font-size:8pt;color:#b00020;margin-top:14px;">* Los cálculos son estimaciones basadas en los datos ingresados. Los resultados reales dependerán de la herramienta seleccionada, la tasa de adopción del equipo y la calidad de implementación.</p>
  <p style="font-size:8pt;color:#757575;border-top:1px solid #e5e5e5;padding-top:8px;margin-top:18px;">Generado con CostIQ — una herramienta de FuturIA · futuria.substack.com</p>
</body></html>`;

    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `costiq-reporte-${slugify(cfg.companyName)}-${todayISO()}.doc`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSTemplate = () => {
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const nc = (v, t='String', sid='') => `<Cell${sid ? ` ss:StyleID="${sid}"`:''}><Data ss:Type="${t}">${esc(v)}</Data></Cell>`;
    const nr = cells => `<Row>${cells}</Row>`;
    const hdrRow = cols => nr(cols.map(c => nc(c,'String','H')).join(''));

    // Sheet 1: template with examples
    const s1cols = ['Actividad','Categoría','Min/día','Empleados afectados','Potencial IA (Alto/Medio/Bajo)','% Reducción estimada con IA','Min con IA (opcional - tiempo real medido)'];
    const s1ex = [
      ['Reuniones sin agenda clara','Reuniones innecesarias',45,8,'Medio',40,''],
      ['Buscar archivos y documentos','Búsqueda de información',30,12,'Alto',70,9],
      ['Elaborar reportes manuales','Reportes y documentación',60,5,'Alto',80,''],
      ['Tu actividad aquí','Categoría',30,5,'Alto',60,''],
    ];
    const s1rows = [
      hdrRow(s1cols),
      ...s1ex.map(r => nr([
        nc(r[0]), nc(r[1]), nc(r[2],'Number'), nc(r[3],'Number'),
        nc(r[4]), nc(r[5],'Number'), nc(r[6] !== '' ? r[6] : ''),
      ].join(''))),
    ].join('\n   ');

    // Sheet 2: 60 reference activities from library
    const s2cols = ['Área','Actividad','Categoría','Min/día','Empleados','Potencial IA','% Reducción estimada'];
    const s2rows = [
      hdrRow(s2cols),
      ...ACTIVITY_LIBRARY.flatMap(area =>
        area.activities.map(act => nr([
          nc(area.area), nc(act.name), nc(act.category),
          nc(act.minutesPerDay,'Number'), nc(act.affectedEmployees,'Number'),
          nc(act.automationPotential), nc(act.aiTimeReduction,'Number'),
        ].join('')))
      ),
    ].join('\n   ');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="H"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#b00020" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Plantilla CostIQ">
  <Table>
   ${s1rows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Actividades de referencia">
  <Table>
   ${s2rows}
  </Table>
 </Worksheet>
</Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `costiq-plantilla-${todayISO()}.xls`; a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isXLS = file.name.toLowerCase().endsWith('.xls');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result || '';
      let dataRows;
      if (isXLS) {
        dataRows = parseXLSRows(text);
      } else {
        const lines = text.replace(/^﻿/, '').split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) { alert('El archivo no tiene datos. Usa la plantilla de CostIQ.'); return; }
        dataRows = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      }
      if (!dataRows.length) { alert('No se encontraron actividades. Asegúrate de usar la plantilla de CostIQ.'); return; }
      const parsed = [];
      for (const cols of dataRows) {
        if (!cols[0]) continue;
        const min = Math.max(1, parseInt(cols[2]) || 30);
        const emp = Math.max(1, parseInt(cols[3]) || cfg.globalEmployees);
        const pot = ['Alto','Medio','Bajo'].includes(cols[4]) ? cols[4] : 'Medio';
        const red = Math.min(100, Math.max(0, parseInt(cols[5]) || 50));
        const mAIRaw = cols[6] !== undefined && cols[6] !== '' ? parseInt(cols[6]) : null;
        const mAI = (mAIRaw != null && !isNaN(mAIRaw) && mAIRaw >= 0 && mAIRaw < min) ? mAIRaw : null;
        const cat = CATEGORIES.includes(cols[1]) ? cols[1] : CATEGORIES[0];
        parsed.push({ id: uid(), name: cols[0], category: cat, minutesPerDay: min, affectedEmployees: emp, automationPotential: pot, aiTimeReduction: red, minutesWithAI: mAI });
      }
      if (parsed.length === 0) { alert('No se encontraron actividades válidas. Revisa que el archivo use la plantilla de CostIQ.'); return; }
      if (window.confirm(`¿Importar ${parsed.length} actividad${parsed.length !== 1 ? 'es' : ''}?${acts.length > 0 ? ' Se agregarán a las existentes.' : ''}`)) {
        setActs(p => [...p, ...parsed]);
        setTab('activities');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // ── Tabs config ───────────────────────────────────────────────────────────
  const TABS = [
    { id:'guide',       label:'Cómo usar',    icon:'🗺️' },
    { id:'config',      label:'Configuración', icon:'⚙️' },
    { id:'activities',  label:'Actividades',  icon:'📋' },
    { id:'dashboard',   label:'Dashboard',    icon:'📊' },
    { id:'comparison',  label:'Sin IA / Con IA', icon:'⚡' },
    { id:'roi',         label:'ROI',          icon:'💰' },
    { id:'report',      label:'Reporte',      icon:'📄' },
  ];

  const hasData = acts.length > 0;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter','Roboto','Open Sans',sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.red }}>
              <span className="text-white font-black text-sm">F</span>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#757575] font-medium">FuturIA</span>
                <span className="text-[#e5e5e5]">|</span>
                <span className="text-sm font-semibold text-[#222]">CostIQ</span>
              </div>
              <p className="text-[11px] text-[#757575] hidden sm:block">Calculadora de costos ocultos e impacto IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAbout(true)} className={btnO + ' text-xs px-3 py-1.5'}>Acerca de</button>
            <a href="https://futuria.substack.com/" target="_blank" rel="noopener noreferrer"
               className={btnR + ' text-xs px-3 py-1.5 no-print'}>Únete a FuturIA →</a>
          </div>
        </div>
      </header>

      {/* ── TAB NAV ── */}
      <div className="bg-white border-b border-[#e5e5e5] sticky top-14 z-30 no-print tab-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex overflow-x-auto gap-1 py-1.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-[#fff5f6] text-[#b00020] border border-[#b00020]'
                    : 'text-[#757575] hover:text-[#222] hover:bg-gray-50'
                }`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ════════════════════════════════════════════════════════════════════
            TAB: GUIDE — CÓMO USAR
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'guide' && (
          <div>
            {/* Hero */}
            <div className="bg-[#fff5f6] border border-[#e5e5e5] rounded-xl p-6 mb-6 text-center">
              <p className="text-3xl mb-2">💡</p>
              <h1 className="text-xl font-black text-[#222] mb-1">¿Cómo usar CostIQ?</h1>
              <p className="text-sm text-[#757575] max-w-xl mx-auto">
                CostIQ te ayuda a descubrir cuánto dinero pierde tu empresa por ineficiencias operativas
                y cuánto podrías ahorrar adoptando inteligencia artificial. Sigue estos 6 pasos en orden.
              </p>
              <button onClick={() => setTab('config')} className={btnR + ' mt-4'}>
                Comenzar ahora →
              </button>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                {
                  step: '1', icon: '⚙️', tab: 'config', color: '#2A5B8C', bg: '#dbeafe',
                  title: 'Configura tu empresa',
                  desc: 'Ingresa el nombre de tu empresa, el número de empleados y el costo por hora promedio. Este dato es la base de todos los cálculos.',
                  tip: '💡 Si no sabes el costo/hora exacto, usa la calculadora rápida: salario mensual ÷ 176 horas.',
                  fields: ['Nombre de empresa', 'Empleados', 'Costo/hora', 'Moneda', 'Días laborales'],
                },
                {
                  step: '2', icon: '📋', tab: 'activities', color: '#b00020', bg: '#fde8ec',
                  title: 'Registra las actividades ineficientes',
                  desc: 'Agrega cada tarea que consume tiempo sin generar valor. Puedes hacerlo una a una, usando la 📚 Biblioteca con 60 actividades de referencia por área, o importando directamente el archivo Excel de plantilla.',
                  tip: '💡 Descarga la Plantilla Excel (2 pestañas: formulario + 60 actividades de referencia), complétala y luego usa "Importar archivo" para cargarla.',
                  fields: ['Nueva actividad', '📚 Biblioteca (60+)', '📥 Plantilla Excel', '📤 Importar .xls/.csv', 'Min. con IA (medido)'],
                },
                {
                  step: '3', icon: '📊', tab: 'dashboard', color: '#d97706', bg: '#fef9c3',
                  title: 'Revisa el Dashboard',
                  desc: 'Aquí verás el costo total mensual y anual de las ineficiencias registradas, junto con la proyección de ahorro usando IA. Los gráficos muestran qué actividades generan más pérdidas.',
                  tip: '💡 El "costo mensual total" es el dinero que estás perdiendo HOY. El "ahorro estimado" es lo que podrías recuperar.',
                  fields: ['KPIs actuales', 'KPIs con IA', 'Gráfico por actividad', 'Distribución por categoría'],
                },
                {
                  step: '4', icon: '⚡', tab: 'comparison', color: '#16a34a', bg: '#dcfce7',
                  title: 'Compara: Sin IA vs Con IA',
                  desc: 'Visualiza el impacto real de aplicar IA a cada actividad. Verás el costo actual vs el costo proyectado, el ahorro mensual y anual, y la reducción porcentual de tiempo.',
                  tip: '💡 Esta sección es ideal para presentar a tu equipo directivo el caso de negocio para invertir en IA.',
                  fields: ['Costo actual vs proyectado', 'Ahorro por actividad', 'Gráfico comparativo', 'Proyección 12 meses'],
                },
                {
                  step: '5', icon: '💰', tab: 'roi', color: '#7c3aed', bg: '#ede9fe',
                  title: 'Calcula el ROI de la inversión',
                  desc: 'Ingresa cuánto costarían las herramientas de IA (mensual + inicial), el costo de implementación y capacitación. La app calcula automáticamente cuándo se recupera la inversión y el ROI a 12, 24 y 36 meses.',
                  tip: '💡 El "break-even" es el mes en que los ahorros superan la inversión total. Antes de ese mes, vas en pérdida; después, en ganancia neta.',
                  fields: ['Costo mensual herramientas IA', 'Inversión inicial', 'Capacitación', 'Tasa de adopción', 'Break-even'],
                },
                {
                  step: '6', icon: '📄', tab: 'report', color: '#065f46', bg: '#d1fae5',
                  title: 'Genera el reporte ejecutivo',
                  desc: 'Con un solo clic genera un resumen ejecutivo completo con gráficos, listo para presentar. Descárgalo en Word, CSV o JSON, o imprímelo como PDF. Con "Guardar análisis" exportas todo tu trabajo a un archivo que puedes volver a cargar cuando quieras.',
                  tip: '💡 Guarda un análisis por cliente o escenario y recárgalo con "Cargar análisis". El reporte incluye conclusión ejecutiva automática — personaliza primero el nombre de empresa en Configuración.',
                  fields: ['Resumen de KPIs', 'Gráficos', 'Conclusión ejecutiva', 'Word / CSV / JSON / PDF', 'Guardar y cargar análisis'],
                },
              ].map(s => (
                <div key={s.step} className="bg-white border border-[#e5e5e5] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white" style={{ background: s.color }}>
                        {s.step}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{s.icon}</span>
                        <h3 className="text-sm font-bold text-[#222]">{s.title}</h3>
                      </div>
                      <p className="text-xs text-[#333] leading-relaxed mb-2">{s.desc}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.fields.map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={{ background: s.bg, color: s.color, borderColor: 'transparent' }}>{f}</span>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#757575] leading-relaxed border-t border-[#e5e5e5] pt-2">{s.tip}</p>
                      <button onClick={() => setTab(s.tab)} className="mt-3 text-xs font-semibold transition-colors" style={{ color: s.color }}>
                        Ir a {s.title} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import / Library tools section */}
            <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5] bg-[#fff5f6]">
                <h3 className="text-sm font-semibold text-[#222]">Herramientas para cargar actividades</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      icon: '📚', color: '#2A5B8C', bg: '#dbeafe',
                      title: 'Biblioteca de actividades',
                      desc: 'Más de 60 actividades preconfiguradas distribuidas en 9 áreas: Operaciones, RRHH, Marketing, Finanzas, Ventas, TI, Atención al cliente, Dirección y Logística. Selecciona las que apliquen a tu empresa con un clic.',
                    },
                    {
                      icon: '📥', color: '#065f46', bg: '#d1fae5',
                      title: 'Plantilla Excel (.xls)',
                      desc: 'Descarga un archivo Excel con dos pestañas: "Plantilla CostIQ" (donde ingresas tus actividades) y "Actividades de referencia" (con las 60+ actividades de ejemplo). Complétala y luego impórtala.',
                    },
                    {
                      icon: '📤', color: '#b45309', bg: '#fef3c7',
                      title: 'Importar archivo (.xls o .csv)',
                      desc: 'Carga directamente la plantilla Excel descargada o cualquier CSV compatible. El sistema valida y agrega las actividades automáticamente. Las actividades se suman a las ya registradas.',
                    },
                    {
                      icon: '✓', color: '#15803d', bg: '#dcfce7',
                      title: 'Min. con IA — Dato medido',
                      desc: 'Campo opcional en cada actividad. Si ya mides cuánto tarda la actividad usando IA, ingrésalo aquí. El porcentaje de ahorro se calculará desde ese dato real (marcado con ✓) en lugar del estimado manual.',
                    },
                  ].map(tool => (
                    <div key={tool.title} className="rounded-xl p-4" style={{ background: tool.bg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{tool.icon}</span>
                        <p className="text-xs font-bold" style={{ color: tool.color }}>{tool.title}</p>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#555]">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Concept glossary */}
            <Card title="Glosario rápido — ¿Qué significa cada término?">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  { term: 'Costo mensual (Sin IA)', def: 'El dinero que pierde tu empresa cada mes en tiempo improductivo. Se calcula: minutos/día × días/mes × empleados afectados × costo/hora.' },
                  { term: 'Reducción con IA (%)', def: 'Porcentaje del tiempo que se estima reducir aplicando herramientas de IA a esa actividad. Alto potencial = 60-85%, Medio = 30-60%, Bajo = 10-30%.' },
                  { term: 'Potencial de automatización', def: 'Clasificación del nivel de facilidad para automatizar la actividad: Alto (se puede automatizar con herramientas disponibles hoy), Medio (requiere configuración), Bajo (automatización parcial).' },
                  { term: 'Ahorro mensual con IA', def: 'Diferencia entre el costo actual y el costo proyectado después de implementar IA. Es el dinero que dejarías de perder cada mes.' },
                  { term: 'Break-even (ROI)', def: 'El mes en que los ahorros acumulados superan la inversión total en IA. A partir de ese punto, cada mes genera valor neto positivo.' },
                  { term: 'Tasa de adopción', def: 'Porcentaje real del equipo que usará activamente las herramientas de IA. Un 100% es ideal pero poco realista. 70-80% es un objetivo razonable.' },
                  { term: 'ROI a 12/24 meses', def: 'Retorno sobre la inversión. Fórmula: (ahorro acumulado − inversión acumulada) ÷ inversión acumulada × 100. Un ROI positivo significa que ganaste más de lo que invertiste.' },
                  { term: 'Inversión inicial única', def: 'Gastos que solo ocurren una vez: licencias perpetuas, consultoría de implementación, configuración inicial, capacitación del equipo.' },
                  { term: 'Costo mensual recurrente', def: 'Suscripciones mensuales a herramientas IA: ChatGPT Plus ($20/usuario), Microsoft 365 Copilot ($30/usuario), Zapier, Make, etc.' },
                  { term: 'Min. con IA (medido)', def: 'Tiempo real que toma la actividad cuando ya se usa IA, expresado en minutos/día. Si lo ingresas, el % de ahorro se calcula desde ese dato real (más preciso). Si no, se usa el estimado del slider.' },
                  { term: 'Reducción medida vs estimada', def: 'Medida (✓): calculada desde el tiempo real observado con IA. Estimada: basada en el porcentaje manual del slider. El badge verde oscuro con ✓ indica dato medido.' },
                ].map(g => (
                  <div key={g.term} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-bold text-[#222] mb-1" style={{ fontSize: 11 }}>{g.term}</p>
                    <p className="text-[#757575] leading-relaxed">{g.def}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center py-4">
              <p className="text-sm text-[#757575] mb-3">¿Listo para descubrir cuánto le cuesta la ineficiencia a tu empresa?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => { loadSample(); setTab('dashboard'); }} className={btnO}>Ver con datos de ejemplo</button>
                <button onClick={() => setTab('config')} className={btnR}>Empezar con mis datos →</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: DASHBOARD
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div>
            {/* Empty state */}
            {!hasData && (
              <div className="bg-[#fff5f6] border border-[#b00020] rounded-xl p-8 mb-6 text-center">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-[#b00020] font-semibold text-base mb-1">No hay actividades registradas</p>
                <p className="text-[#757575] text-sm mb-5">Carga datos de ejemplo para explorar el dashboard, o registra tus propias actividades.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={loadSample} className={btnR}>Cargar datos de ejemplo</button>
                  <button onClick={() => setTab('activities')} className={btnO}>Agregar actividades</button>
                </div>
              </div>
            )}

            {/* Sample-data banner */}
            {hasData && isSampleData && (
              <div className="flex items-start gap-2 bg-[#fef9c3] border border-[#854d0e]/30 rounded-xl px-4 py-3 mb-5 text-xs text-[#854d0e]">
                <span className="text-sm">💡</span>
                <span className="flex-1">Estás viendo <strong>datos de ejemplo</strong>. Reemplázalos con los de tu empresa en la pestaña Actividades, o ajusta los parámetros en Configuración.</span>
                <button onClick={clearAll} className="font-semibold underline whitespace-nowrap">Empezar de cero</button>
              </div>
            )}

            {/* KPI grid — current state */}
            <div className="mb-1">
              <p className="text-[10px] font-bold text-[#757575] uppercase tracking-widest mb-2">Estado actual · Sin IA</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <KPI label="Costo mensual total"  value={fmt(tot.totalCostMon, cfg.currency)}  sub="en tiempo improductivo"             color={C.red}   icon="💸" highlight
                  help="Cuánto dinero pierde tu empresa cada mes en actividades de baja productividad. Se calcula sumando: (minutos/día ÷ 60) × días laborales/mes × personas afectadas × costo/hora, para cada actividad." />
                <KPI label="Costo anual total"    value={fmt(tot.totalCostYr, cfg.currency)}   sub="proyección a 12 meses"              color={C.red}   icon="📅"
                  help="Proyección del costo mensual multiplicado por 12. Es el impacto anual total de mantener las ineficiencias actuales sin ningún cambio." />
                <KPI label="Horas perdidas/mes"   value={`${fmtN(tot.totalHMon)}h`}            sub="suma total todos los empleados"     color="#d97706" icon="⏰"
                  help="Total de horas improductivas al mes sumando todos los empleados afectados en todas las actividades. Si son 10 personas perdiendo 1h/día cada una, el total son 220h/mes (10 × 22 días)." />
                <KPI label="Actividades"          value={acts.length}                           sub={tot.topCost ? `Más costosa: ${tot.topCost.name.slice(0,18)}…` : '—'} color={C.blue} icon="📋"
                  help="Número de actividades ineficientes registradas. Cuantas más registres, más preciso será el análisis. Se muestra también cuál es la que genera mayor costo mensual." />
              </div>
            </div>

            {/* KPI grid — with AI */}
            {hasData && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-[#757575] uppercase tracking-widest mb-2">Proyección · Con IA</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KPI label="Ahorro mensual estimado" value={fmt(tot.totalSavMon, cfg.currency)}  sub={`adoptando herramientas IA`}     color={C.green} icon="✅" highlight
                    help="Cuánto dejarías de perder cada mes al aplicar IA a las actividades registradas. Es la diferencia entre el costo actual y el costo proyectado con IA. Depende del % de reducción estimado en cada actividad." />
                  <KPI label="Ahorro anual estimado"   value={fmt(tot.totalSavYr, cfg.currency)}   sub="proyección 12 meses"             color={C.green} icon="🚀"
                    help="El ahorro mensual proyectado multiplicado por 12. Representa el valor total que generaría la adopción de IA en un año completo, sin contar el costo de las herramientas." />
                  <KPI label="Reducción promedio"      value={`${fmtN(tot.avgRed, 0)}%`}           sub="en tiempo por actividad"         color={C.green} icon="📉"
                    help="Promedio del porcentaje de reducción de tiempo estimado en todas las actividades. Si tienes 3 actividades con 40%, 70% y 80%, el promedio es 63%. Refleja qué tan automatizable es tu operación en general." />
                  <KPI label="Break-even"              value={roiCalc.breakEven ? `Mes ${roiCalc.breakEven}` : 'N/A'} sub="meses para recuperar inversión" color={roiCalc.breakEven ? C.blue : '#757575'} icon="⚡"
                    help="El mes en que los ahorros acumulados superan la inversión total en IA. Antes de ese mes, la empresa va en pérdida neta. A partir de ahí, cada mes genera valor positivo. Configura los costos de inversión en la pestaña ROI." />
                </div>
              </div>
            )}

            {/* Charts */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <Card
                  title="Costo mensual por actividad — Sin IA vs Con IA"
                  help="Compara el costo mensual actual (rojo = Sin IA) contra el costo proyectado con herramientas de IA (azul = Con IA) para cada actividad registrada. Las barras más altas indican dónde está el mayor desperdicio de tiempo."
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartActs} margin={{ top:30, right:10, left:5, bottom:65 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="name" tick={{ fontSize:9, fill:'#757575' }} angle={-35} textAnchor="end" interval={0} height={70} />
                      <YAxis tick={{ fontSize:10, fill:'#757575' }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(1)}k`} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Legend verticalAlign="top" iconSize={10} wrapperStyle={{ fontSize:11, paddingBottom:6 }} />
                      <Bar dataKey="Sin IA" fill={C.red}  radius={[3,3,0,0]} />
                      <Bar dataKey="Con IA" fill={C.blue} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card
                  title="Distribución de costo por categoría"
                  help="Muestra qué tipo de actividades generan mayor costo total. Cada segmento es una categoría (reuniones, reportes, comunicación, etc.). Los más grandes son los que vale la pena atacar primero."
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={chartCat} cx="50%" cy="48%" outerRadius={95} dataKey="value"
                        label={({ percent }) => `${(percent*100).toFixed(0)}%`} labelLine>
                        {chartCat.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v, cfg.currency)} />
                      <Legend formatter={v => <span style={{ fontSize:10, color:'#333' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card
                  title="Ahorro acumulado proyectado — 12 meses"
                  help="Proyección del costo acumulado a 12 meses con y sin IA. La brecha entre la línea roja (Sin IA) y la azul (Con IA) es el ahorro total que generarías en un año al implementar herramientas de inteligencia artificial."
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chart12} margin={{ top:5, right:10, left:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="mes" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:10 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize:11 }} />
                      <Area type="monotone" dataKey="Sin IA" stroke={C.red}   fill="#fde8ec" fillOpacity={0.5} strokeWidth={2} />
                      <Area type="monotone" dataKey="Con IA" stroke={C.blue}  fill="#dbeafe" fillOpacity={0.5} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card
                  title="Ranking de actividades por costo mensual"
                  help="Las actividades ordenadas de mayor a menor costo mensual. La más costosa aparece primero. Usa este ranking para priorizar qué automatizar primero — el mayor retorno estará en las barras más largas."
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartActs} layout="vertical" margin={{ left:10, right:20, top:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(1)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:'#333' }} width={110} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Bar dataKey="Sin IA" fill={C.red} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: ACTIVITIES
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'activities' && (
          <div>
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#222]">Actividades e ineficiencias</h1>
                <p className="text-sm text-[#757575]">Registra cada tarea que consume tiempo sin generar valor directo.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={loadSample} className={btnO}>Cargar ejemplos</button>
                <button onClick={() => { setSelectedLib({}); setLibFilter('Todas'); setLibraryOpen(true); }} className={btnO}>📚 Biblioteca</button>
                <button onClick={exportXLSTemplate} className={btnO}>📥 Plantilla Excel</button>
                <label className={btnO + ' cursor-pointer'}>
                  📤 Importar archivo
                  <input type="file" accept=".xls,.csv,text/csv" className="hidden" onChange={importFile} />
                </label>
                <button onClick={() => { setDraft(blankAct); setAddOpen(true); }} className={btnR}>+ Nueva actividad</button>
              </div>
            </div>

            {/* Sample-data banner */}
            {hasData && isSampleData && (
              <div className="flex items-start gap-2 bg-[#fef9c3] border border-[#854d0e]/30 rounded-xl px-4 py-3 mb-5 text-xs text-[#854d0e]">
                <span className="text-sm">💡</span>
                <span className="flex-1">Estas son <strong>actividades de ejemplo</strong>. Edítalas, elimínalas o agrega las tuyas. Para partir de una hoja en blanco usa "Empezar de cero".</span>
                <button onClick={clearAll} className="font-semibold underline whitespace-nowrap">Empezar de cero</button>
              </div>
            )}

            {/* Add form */}
            {addOpen && (
              <div className="bg-[#fff5f6] border border-[#b00020] rounded-xl p-5 mb-5">
                <h3 className="font-semibold text-[#222] mb-4 text-sm">Nueva actividad</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Fld label="Descripción de la actividad" help="¿Qué tarea genera la ineficiencia? Sé específico. Ej: 'Reuniones de seguimiento sin agenda previa'.">
                      <input className={inp} value={draft.name} placeholder="Ej: Reuniones sin agenda clara" onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
                    </Fld>
                  </div>
                  <Fld label="Categoría">
                    <select className={inp} value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Fld>
                  <Fld label="Minutos perdidos por día" help="Tiempo promedio que cada empleado afectado pierde en esta actividad. Si es semanal, divide entre 5.">
                    <input type="number" min="1" max="480" className={inp} value={draft.minutesPerDay} onChange={e => setDraft(p => ({ ...p, minutesPerDay: +e.target.value }))} />
                  </Fld>
                  <Fld label="Empleados afectados" help="¿Cuántas personas en tu empresa realizan esta actividad?">
                    <input type="number" min="1" className={inp} value={draft.affectedEmployees} onChange={e => setDraft(p => ({ ...p, affectedEmployees: +e.target.value }))} />
                  </Fld>
                  <Fld label="Potencial de automatización con IA" help="Alto: la actividad es repetitiva y estructurada — herramientas como ChatGPT, Zapier o Make pueden automatizarla hoy. Medio: requiere configuración o supervisión humana. Bajo: solo se puede automatizar parcialmente.">
                    <select className={inp} value={draft.automationPotential} onChange={e => setDraft(p => ({ ...p, automationPotential: e.target.value }))}>
                      <option>Alto</option><option>Medio</option><option>Bajo</option>
                    </select>
                  </Fld>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Fld label="Reducción estimada con IA (%)" help="¿Qué porcentaje del tiempo se puede reducir con IA? Alto potencial ≈ 60-85%, Medio ≈ 30-60%, Bajo ≈ 10-30%.">
                      <div className="flex items-center gap-3">
                        <input type="range" min="0" max="100" className="flex-1" value={draft.aiTimeReduction} onChange={e => setDraft(p => ({ ...p, aiTimeReduction: +e.target.value }))} style={{ accentColor: C.red }} />
                        <span className="text-sm font-bold text-[#16a34a] w-10 text-right">{draft.aiTimeReduction}%</span>
                      </div>
                    </Fld>
                  </div>
                  <Fld label="Min. con IA (opcional)" help="Si ya mediste cuánto tarda esta actividad cuando se usa IA, ingrésalo aquí. El % de ahorro se calculará automáticamente desde datos reales, más preciso que la estimación. Déjalo vacío si aún no has medido.">
                    <input type="number" min="0" placeholder="Ej: 9 (opcional)" className={inp} value={draft.minutesWithAI ?? ''} onChange={e => setDraft(p => ({ ...p, minutesWithAI: e.target.value === '' ? null : +e.target.value }))} />
                  </Fld>
                </div>
                {/* Preview calc */}
                {draft.name && draft.minutesPerDay > 0 && draft.affectedEmployees > 0 && (
                  <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 mb-4 text-xs text-[#333] flex flex-wrap gap-4">
                    <span>Costo/mes: <strong className="text-[#b00020]">{fmt((draft.minutesPerDay/60) * cfg.workDaysMonth * draft.affectedEmployees * cfg.hourlyCost, cfg.currency, 0)}</strong></span>
                    <span>Ahorro estimado: <strong className="text-[#16a34a]">{fmt((draft.minutesPerDay/60) * cfg.workDaysMonth * draft.affectedEmployees * cfg.hourlyCost * draft.aiTimeReduction / 100, cfg.currency, 0)}/mes</strong></span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={addAct} className={btnR}>Guardar actividad</button>
                  <button onClick={() => setAddOpen(false)} className={btnO}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Table */}
            {!hasData ? (
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-10 text-center">
                <p className="text-[#757575] text-sm mb-4">No hay actividades registradas todavía.</p>
                <button onClick={loadSample} className={btnR}>Cargar datos de ejemplo</button>
              </div>
            ) : (
              <Card noPad>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e5e5] bg-[#fff5f6]">
                        <th className="text-left px-4 py-3 font-semibold text-[#333] text-xs">Actividad</th>
                        <th className="text-left px-3 py-3 font-semibold text-[#333] text-xs hidden md:table-cell">Categoría</th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">
                          Min/día sin IA
                          <HelpTip text="Minutos que cada persona afectada pierde en esta actividad por día laboral (sin usar IA). Si la actividad es semanal, divide el total entre 5." />
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">
                          Min/día con IA
                          <HelpTip text="Tiempo real medido de esta actividad cuando ya se usa IA. Si lo ingresas, el % de ahorro se calcula desde datos reales (más preciso que la estimación manual). Deja vacío si aún no has medido." />
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">
                          Personas
                          <HelpTip text="Número de empleados que realizan esta actividad. El costo total se multiplica por este número." />
                        </th>
                        <th className="text-right px-3 py-3 font-semibold text-[#333] text-xs">
                          Costo/mes
                          <HelpTip text="Costo total mensual de esta actividad. Fórmula: (min/día ÷ 60) × días laborales/mes × personas × costo/hora." />
                        </th>
                        <th className="text-right px-3 py-3 font-semibold text-[#333] text-xs hidden sm:table-cell">
                          Costo/año
                          <HelpTip text="Proyección anual: costo mensual × 12." />
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">
                          Potencial IA
                          <HelpTip text="¿Qué tan fácil es automatizar esta actividad con IA hoy? Alto = herramientas disponibles y listas, Medio = requiere configuración, Bajo = automatización parcial." />
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">
                          % Ahorro con IA
                          <HelpTip text="Porcentaje del tiempo que se estima reducir al aplicar IA a esta actividad. Por ejemplo, 70% significa que una tarea que toma 30 min pasaría a tomar ~9 min." />
                        </th>
                        <th className="text-center px-3 py-3 font-semibold text-[#333] text-xs">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, idx) => (
                        <tr key={m.id} className={`border-b border-[#e5e5e5] hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            {editing === m.id
                              ? <input className={inp + ' py-1 text-xs'} value={m.name} onChange={e => updAct(m.id, 'name', e.target.value)} />
                              : <span className="font-medium text-[#222] text-xs">{m.name}</span>
                            }
                          </td>
                          <td className="px-3 py-3 text-[#757575] text-[11px] hidden md:table-cell">{m.category}</td>
                          <td className="px-3 py-3 text-center text-xs">
                            {editing === m.id
                              ? <input type="number" min="1" className={inp + ' py-1 w-16 text-xs text-center'} value={m.minutesPerDay} onChange={e => updAct(m.id, 'minutesPerDay', +e.target.value)} />
                              : m.minutesPerDay
                            }
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            {editing === m.id
                              ? <input type="number" min="0" max="480" placeholder="—" className={inp + ' py-1 w-16 text-xs text-center'} value={m.minutesWithAI ?? ''} onChange={e => updAct(m.id, 'minutesWithAI', e.target.value === '' ? null : +e.target.value)} />
                              : m.minutesWithAI != null
                                ? <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">{m.minutesWithAI}min</span>
                                : <span className="text-[#ccc]">—</span>
                            }
                          </td>
                          <td className="px-3 py-3 text-center text-xs">
                            {editing === m.id
                              ? <input type="number" min="1" className={inp + ' py-1 w-16 text-xs text-center'} value={m.affectedEmployees} onChange={e => updAct(m.id, 'affectedEmployees', +e.target.value)} />
                              : m.affectedEmployees
                            }
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-[#b00020] text-xs">{fmt(m.costMon, cfg.currency)}</td>
                          <td className="px-3 py-3 text-right text-xs text-[#757575] hidden sm:table-cell">{fmt(m.costYear, cfg.currency)}</td>
                          <td className="px-3 py-3 text-center"><PotBadge v={m.automationPotential} /></td>
                          <td className="px-3 py-3 text-center">
                            {editing === m.id
                              ? <input type="number" min="0" max="100" className={inp + ' py-1 w-16 text-xs text-center'} value={m.aiTimeReduction} onChange={e => updAct(m.id, 'aiTimeReduction', +e.target.value)} />
                              : <SavBadge pct={m.effectiveReduction} measured={m.isMeasured} />
                            }
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              {editing === m.id
                                ? <button onClick={() => setEditing(null)} className="text-[#16a34a] text-[11px] font-semibold px-2 py-1 hover:bg-green-50 rounded">✓ Listo</button>
                                : <button onClick={() => setEditing(m.id)} className="text-[#2A5B8C] text-[11px] font-medium px-2 py-1 hover:bg-blue-50 rounded">Editar</button>
                              }
                              <button onClick={() => delAct(m.id)} className="text-[#b00020] text-[11px] font-medium px-2 py-1 hover:bg-red-50 rounded">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#b00020] bg-[#fff5f6]">
                        <td colSpan={5} className="px-4 py-3 font-bold text-[#222] text-xs">TOTAL ({acts.length} actividades)</td>
                        <td className="px-3 py-3 text-right font-black text-[#b00020]">{fmt(tot.totalCostMon, cfg.currency)}</td>
                        <td className="px-3 py-3 text-right text-[#b00020] font-semibold text-xs hidden sm:table-cell">{fmt(tot.totalCostYr, cfg.currency)}</td>
                        <td colSpan={3} className="px-3 py-3 text-right text-xs text-[#16a34a] font-semibold">Ahorro est.: {fmt(tot.totalSavMon, cfg.currency)}/mes</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: COMPARISON
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'comparison' && (
          <div>
            <div className="mb-5">
              <h1 className="text-lg font-bold text-[#222]">Análisis comparativo: Sin IA vs Con IA</h1>
              <p className="text-sm text-[#757575]">Impacto real de aplicar inteligencia artificial a cada actividad identificada.</p>
            </div>

            {!hasData ? (
              <div className="text-center py-12 text-[#757575]">
                <p className="mb-3">Primero agrega actividades en la pestaña "Actividades".</p>
                <button onClick={() => setTab('activities')} className={btnR}>Ir a Actividades</button>
              </div>
            ) : (
              <>
                {/* Summary trio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border-2 border-[#e5e5e5] rounded-xl p-5 text-center">
                    <div className="text-[10px] text-[#757575] font-bold uppercase tracking-widest mb-1">SIN IA · Mensual</div>
                    <div className="text-3xl font-black text-[#b00020]">{fmt(tot.totalCostMon, cfg.currency)}</div>
                    <div className="text-xs text-[#757575] mt-1">{fmt(tot.totalCostYr, cfg.currency)}/año</div>
                  </div>
                  <div className="bg-white border-2 border-[#2A5B8C] rounded-xl p-5 text-center">
                    <div className="text-[10px] text-[#757575] font-bold uppercase tracking-widest mb-1">CON IA · Mensual</div>
                    <div className="text-3xl font-black text-[#2A5B8C]">{fmt(tot.totalCostMon - tot.totalSavMon, cfg.currency)}</div>
                    <div className="text-xs text-[#757575] mt-1">{fmt((tot.totalCostMon - tot.totalSavMon)*12, cfg.currency)}/año</div>
                  </div>
                  <div className="bg-[#f0fdf4] border-2 border-[#16a34a] rounded-xl p-5 text-center">
                    <div className="text-[10px] text-[#757575] font-bold uppercase tracking-widest mb-1">AHORRO POTENCIAL</div>
                    <div className="text-3xl font-black text-[#16a34a]">{fmt(tot.totalSavMon, cfg.currency)}/mes</div>
                    <div className="text-xs text-[#757575] mt-1">{fmt(tot.totalSavYr, cfg.currency)}/año · -{fmtN(tot.avgRed,0)}% prom.</div>
                  </div>
                </div>

                {/* Horizontal bar chart */}
                <Card title="Comparación por actividad (costo mensual)" help="Barras paralelas para cada actividad: rojo = costo actual (Sin IA), azul = costo proyectado (Con IA). La diferencia entre ambas barras es el ahorro potencial mensual de esa actividad.">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartActs} layout="vertical" margin={{ left:15, right:30, top:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(1)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#333' }} width={120} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize:11 }} />
                      <Bar dataKey="Sin IA" fill={C.red}  radius={[0,3,3,0]} />
                      <Bar dataKey="Con IA" fill={C.blue} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* 12-month area projection */}
                <Card title="Proyección acumulada 12 meses — Costo total con y sin IA" help="Muestra el costo acumulado a lo largo de 12 meses. La línea roja (Sin IA) sube más rápido que la azul (Con IA). La diferencia entre ambas al mes 12 es el ahorro total anual. La línea verde punteada es el ahorro acumulado.">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chart12} margin={{ top:5, right:10, left:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="mes" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:10 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize:11 }} />
                      <Area type="monotone" dataKey="Sin IA" stroke={C.red}  fill="#fde8ec" fillOpacity={0.6} strokeWidth={2} />
                      <Area type="monotone" dataKey="Con IA" stroke={C.blue} fill="#dbeafe" fillOpacity={0.6} strokeWidth={2} />
                      <Area type="monotone" dataKey="Ahorro" stroke={C.green} fill="#dcfce7" fillOpacity={0.4} strokeWidth={1.5} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Detail table */}
                <Card title="Detalle por actividad">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="text-left py-2 px-3 text-[#757575] font-medium">Actividad</th>
                          <th className="text-right py-2 px-3 text-[#757575] font-medium">Sin IA/mes</th>
                          <th className="text-right py-2 px-3 text-[#757575] font-medium">Con IA/mes</th>
                          <th className="text-right py-2 px-3 text-[#757575] font-medium">Ahorro/mes</th>
                          <th className="text-right py-2 px-3 text-[#757575] font-medium">Ahorro/año</th>
                          <th className="text-center py-2 px-3 text-[#757575] font-medium">Reducción</th>
                          <th className="text-center py-2 px-3 text-[#757575] font-medium">Potencial IA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...metrics].sort((a,b) => b.savMon - a.savMon).map(m => (
                          <tr key={m.id} className="border-b border-[#e5e5e5] hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-medium text-[#222]">{m.name}</td>
                            <td className="py-2.5 px-3 text-right text-[#b00020] font-semibold">{fmt(m.costMon, cfg.currency)}</td>
                            <td className="py-2.5 px-3 text-right text-[#2A5B8C] font-semibold">{fmt(m.aiCostMon, cfg.currency)}</td>
                            <td className="py-2.5 px-3 text-right text-[#16a34a] font-bold">{fmt(m.savMon, cfg.currency)}</td>
                            <td className="py-2.5 px-3 text-right text-[#16a34a]">{fmt(m.savYear, cfg.currency)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${m.isMeasured ? 'bg-green-100 text-[#15803d]' : 'bg-green-50 text-[#16a34a]'}`}>
                                -{m.effectiveReduction}%{m.isMeasured ? ' ✓' : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center"><PotBadge v={m.automationPotential} /></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#16a34a] bg-[#f0fdf4]">
                          <td className="py-2.5 px-3 font-bold text-[#222]">TOTAL</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#b00020]">{fmt(tot.totalCostMon, cfg.currency)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#2A5B8C]">{fmt(tot.totalCostMon - tot.totalSavMon, cfg.currency)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#16a34a]">{fmt(tot.totalSavMon, cfg.currency)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#16a34a]">{fmt(tot.totalSavYr, cfg.currency)}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#16a34a]">-{fmtN(tot.avgRed,0)}%</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: ROI
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'roi' && (
          <div>
            <div className="mb-5">
              <h1 className="text-lg font-bold text-[#222]">Calculadora de ROI — Inversión en IA</h1>
              <p className="text-sm text-[#757575]">¿En cuánto tiempo se paga la inversión en herramientas de inteligencia artificial?</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Inputs */}
              <Card title="Parámetros de inversión">
                <div className="space-y-4">
                  <Fld label={`Costo mensual de herramientas IA (${curr.symbol})`} help="Suma de suscripciones mensuales: ChatGPT Plus, Microsoft 365 Copilot, Zapier, Make, etc.">
                    <input type="number" min="0" className={inp} value={roi.aiToolMonthly} onChange={e => setRoi(p => ({ ...p, aiToolMonthly: +e.target.value }))} />
                  </Fld>
                  <Fld label={`Inversión inicial única (${curr.symbol})`} help="Licencias perpetuas, setup inicial, compras únicas de herramientas.">
                    <input type="number" min="0" className={inp} value={roi.aiToolOneTime} onChange={e => setRoi(p => ({ ...p, aiToolOneTime: +e.target.value }))} />
                  </Fld>
                  <Fld label={`Costo de implementación y capacitación (${curr.symbol})`} help="Horas de consultoría, entrenamiento del equipo, configuración. Calcula: horas × costo/hora del equipo.">
                    <input type="number" min="0" className={inp} value={roi.implCost} onChange={e => setRoi(p => ({ ...p, implCost: +e.target.value }))} />
                  </Fld>
                  <Fld label="Meses hasta implementación completa" help="Durante estos meses los ahorros son parciales. Una implementación típica toma 1-3 meses.">
                    <input type="number" min="0" max="18" className={inp} value={roi.implMonths} onChange={e => setRoi(p => ({ ...p, implMonths: +e.target.value }))} />
                  </Fld>
                  <Fld label="Tasa de adopción esperada (%)" help="¿Qué porcentaje del equipo usará activamente las herramientas? Ser realista aquí es clave — un 70-80% es un buen objetivo.">
                    <div className="flex items-center gap-3">
                      <input type="range" min="10" max="100" value={roi.adoptionRate} onChange={e => setRoi(p => ({ ...p, adoptionRate: +e.target.value }))} className="flex-1" style={{ accentColor: C.red }} />
                      <span className="text-sm font-bold text-[#b00020] w-10 text-right">{roi.adoptionRate}%</span>
                    </div>
                  </Fld>

                  {/* Quick summary */}
                  <div className="bg-[#fff5f6] rounded-lg p-3 border border-[#e5e5e5] text-xs space-y-1">
                    <p className="font-semibold text-[#b00020] text-[11px]">Resumen de inversión</p>
                    <p className="text-[#333]">Inversión inicial: <strong>{fmt(roiCalc.initInvest, cfg.currency)}</strong></p>
                    <p className="text-[#333]">Gasto mensual recurrente: <strong>{fmt(roiCalc.monthlyOngoing, cfg.currency)}</strong></p>
                    <p className="text-[#333]">Ahorro mensual con IA (ajustado): <strong className="text-[#16a34a]">{fmt(roiCalc.monthlySav, cfg.currency)}</strong></p>
                  </div>
                </div>
              </Card>

              {/* KPIs + Charts */}
              <div className="lg:col-span-2 space-y-5">

                {/* ROI KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KPI label="Ahorro mensual con IA"    value={fmt(roiCalc.monthlySav, cfg.currency)}      sub={`con ${roi.adoptionRate}% adopción`} color={C.green} icon="💚" />
                  <KPI label="Inversión total inicial"  value={fmt(roiCalc.initInvest, cfg.currency)}      sub="implementación + setup"            color={C.red}   icon="💳" />
                  <KPI label="Gasto mensual recurrente" value={fmt(roiCalc.monthlyOngoing, cfg.currency)}  sub="herramientas y licencias"          color="#d97706" icon="🔄" />
                  <KPI label="Break-even"
                    value={roiCalc.breakEven ? `Mes ${roiCalc.breakEven}` : '> 36 meses'}
                    sub="mes de retorno de inversión"
                    color={roiCalc.breakEven && roiCalc.breakEven <= 12 ? C.green : roiCalc.breakEven && roiCalc.breakEven <= 24 ? "#d97706" : C.red}
                    icon="🎯"
                    highlight={!!roiCalc.breakEven}
                  />
                  <KPI label="ROI a 12 meses"
                    value={`${fmtN(roiCalc.roi12, 0)}%`}
                    sub="retorno sobre inversión"
                    color={roiCalc.roi12 > 0 ? C.green : C.red}
                    icon={roiCalc.roi12 > 0 ? '📈' : '📉'}
                  />
                  <KPI label="ROI a 24 meses"
                    value={`${fmtN(roiCalc.roi24, 0)}%`}
                    sub="retorno sobre inversión"
                    color={roiCalc.roi24 > 0 ? C.green : C.red}
                    icon={roiCalc.roi24 > 0 ? '📈' : '📉'}
                  />
                </div>

                {/* ROI projection chart */}
                <Card title="Proyección acumulada — Inversión vs Ahorro (36 meses)" help="Compara el dinero que acumulas en costos de IA (línea roja) contra el dinero que ahorras (línea verde). El punto donde se cruzan es el break-even. La línea azul punteada es el valor neto: positivo = ganando, negativo = aún recuperando.">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={roiCalc.projection.map(p => ({
                      mes: `M${p.m}`,
                      'Inversión acum.': p.inv,
                      'Ahorro acum.': p.sav,
                      'Valor neto': p.net,
                    }))} margin={{ top:5, right:10, left:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="mes" tick={{ fontSize:9 }} interval={2} />
                      <YAxis tick={{ fontSize:9 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize:10 }} />
                      <Area type="monotone" dataKey="Inversión acum." stroke={C.red}   fill="#fde8ec" fillOpacity={0.5} strokeWidth={2} />
                      <Area type="monotone" dataKey="Ahorro acum."    stroke={C.green} fill="#dcfce7" fillOpacity={0.5} strokeWidth={2} />
                      <Line  type="monotone" dataKey="Valor neto"     stroke={C.blue}  strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                  {roiCalc.breakEven && (
                    <p className="text-xs text-[#16a34a] font-semibold mt-2 text-center">
                      ✓ El ahorro supera la inversión en el mes {roiCalc.breakEven}. A partir de ahí, cada mes genera valor neto creciente.
                    </p>
                  )}
                </Card>

              </div>
            </div>

            {/* ROI interpretation guide */}
            <Card title="¿Cómo interpretar estos resultados?">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#333]">
                <div className="bg-[#dcfce7] rounded-lg p-4">
                  <p className="font-bold text-[#15803d] mb-1 text-sm">✅ Break-even antes del mes 12</p>
                  <p>Excelente señal. La inversión se justifica rápido y el equipo percibe resultados dentro del primer año. Presenta este escenario a dirección con confianza.</p>
                </div>
                <div className="bg-[#fef9c3] rounded-lg p-4">
                  <p className="font-bold text-[#854d0e] mb-1 text-sm">⚠️ Break-even entre meses 12-24</p>
                  <p>Inversión sana pero requiere compromiso de mediano plazo. Asegura métricas de seguimiento durante la implementación para demostrar valor progresivo.</p>
                </div>
                <div className="bg-[#fee2e2] rounded-lg p-4">
                  <p className="font-bold text-[#b91c1c] mb-1 text-sm">🔴 Break-even después del mes 24</p>
                  <p>Revisa los supuestos. Quizás el costo/hora está subestimado, la adopción es demasiado optimista, o el potencial de reducción por actividad necesita ajuste.</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: CONFIG
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'config' && (
          <div>
            <div className="mb-5">
              <h1 className="text-lg font-bold text-[#222]">Configuración</h1>
              <p className="text-sm text-[#757575]">Ajusta los parámetros base para que todos los cálculos reflejen tu empresa.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card title="Datos de la empresa">
                <div className="space-y-4">
                  <Fld label="Nombre de la empresa o equipo" help="Aparecerá en el reporte ejecutivo. Puede ser el nombre de la empresa, una división o un equipo específico (ej: 'Equipo de Operaciones Latam').">
                    <input className={inp} value={cfg.companyName} onChange={e => setCfg(p => ({ ...p, companyName: e.target.value }))} />
                  </Fld>
                  <Fld label="Departamento o área analizada" help="Opcional. Si el análisis es para un área específica (Marketing, Finanzas, RR.HH.), agrégalo aquí para que aparezca en el reporte.">
                    <input className={inp} value={cfg.department} placeholder="Ej: Operaciones, Marketing, Finanzas" onChange={e => setCfg(p => ({ ...p, department: e.target.value }))} />
                  </Fld>
                  <Fld label="Número de empleados (referencial)" help="Total de personas en el área analizada. Este número se usa como valor por defecto al crear nuevas actividades. Puedes cambiarlo por actividad individualmente.">
                    <input type="number" min="1" className={inp} value={cfg.globalEmployees} onChange={e => setCfg(p => ({ ...p, globalEmployees: +e.target.value }))} />
                  </Fld>
                  <Fld label="Moneda" help="Selecciona la moneda de tu empresa. Todos los costos y ahorros se mostrarán en esta moneda. Puedes cambiarla en cualquier momento sin perder los datos.">
                    <select className={inp} value={cfg.currency} onChange={e => setCfg(p => ({ ...p, currency: e.target.value }))}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </Fld>
                </div>
              </Card>

              <Card title="Parámetros laborales">
                <div className="space-y-4">
                  <Fld label={`Costo hora promedio por empleado (${curr.symbol}/h)`} help="Incluye salario + cargas sociales + beneficios. Si no tienes el dato, usa: salario mensual ÷ (días laborales × 8 horas).">
                    <input type="number" min="1" className={inp} value={cfg.hourlyCost} onChange={e => setCfg(p => ({ ...p, hourlyCost: +e.target.value }))} />
                  </Fld>
                  <Fld label="Días laborales por semana" help="Estándar LATAM: 5 días. Algunos equipos trabajan 6.">
                    <input type="number" min="1" max="7" className={inp} value={cfg.workDaysWeek} onChange={e => setCfg(p => ({ ...p, workDaysWeek: +e.target.value }))} />
                  </Fld>
                  <Fld label="Días laborales por mes" help="Promedio estándar: 22 días (260 días/año ÷ 12). Ajusta si hay muchos días festivos.">
                    <input type="number" min="15" max="31" className={inp} value={cfg.workDaysMonth} onChange={e => setCfg(p => ({ ...p, workDaysMonth: +e.target.value }))} />
                  </Fld>

                  {/* Hourly cost estimator */}
                  <div className="border border-[#e5e5e5] rounded-xl p-4 bg-[#fff5f6]">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-base flex-shrink-0">⚡</span>
                      <div>
                        <p className="text-xs font-bold text-[#b00020] leading-tight">¿No sabes el costo/hora exacto?</p>
                        <p className="text-[11px] text-[#757575] mt-0.5 leading-snug">
                          Selecciona el salario mensual más cercano y el costo/hora se aplica automáticamente.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[1500, 2000, 2500, 3500, 5000].map(salary => {
                        const computed = Math.round(salary / (cfg.workDaysMonth * 8));
                        const isActive = cfg.hourlyCost === computed;
                        return (
                          <button
                            key={salary}
                            onClick={() => setCfg(p => ({ ...p, hourlyCost: computed }))}
                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg border-2 transition-all text-left ${
                              isActive
                                ? 'bg-[#b00020] border-[#b00020] text-white shadow-sm'
                                : 'bg-white border-[#e5e5e5] hover:border-[#b00020] text-[#333]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-[#222]'}`}>
                                {curr.symbol}{salary.toLocaleString()}<span className={`font-normal ${isActive ? 'text-red-100' : 'text-[#757575]'}`}>/mes</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] ${isActive ? 'text-red-200' : 'text-[#757575]'}`}>÷ {cfg.workDaysMonth}d × 8h =</span>
                              <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-[#b00020]'}`}>
                                {curr.symbol}{computed}/h
                              </span>
                              {isActive && <span className="text-[10px] bg-white text-[#b00020] font-bold px-1.5 py-0.5 rounded-full">✓ Aplicado</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[#757575] mt-2.5 text-center">
                      O escribe directamente el costo/hora en el campo de arriba.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-3 mt-1 flex-wrap items-center">
              <button onClick={loadSample} className={btnO}>Cargar datos de ejemplo</button>
              <button onClick={exportJSON} className={btnO}>💾 Guardar análisis (JSON)</button>
              <label className={btnO + ' cursor-pointer'}>
                📂 Cargar análisis
                <input type="file" accept=".json,application/json" className="hidden" onChange={importJSON} />
              </label>
              <button onClick={clearAll} className="border border-red-100 hover:border-[#b00020] text-[#b00020] text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-white cursor-pointer">
                Limpiar todo
              </button>
            </div>
            <p className="text-[11px] text-[#757575] mt-2">
              💾 <strong>Guardar análisis</strong> descarga un archivo con todo tu trabajo (empresa, actividades y ROI). Guarda uno por cliente o escenario y vuelve a cargarlo cuando quieras con <strong>Cargar análisis</strong>.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: REPORT
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'report' && (
          <div>
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#222]">Reporte ejecutivo</h1>
                <p className="text-sm text-[#757575]">Genera y descarga el análisis para presentar a tu equipo directivo.</p>
              </div>
              <div className="flex gap-2 flex-wrap no-print">
                <button onClick={exportWord} className={btnO}>📝 Descargar Word</button>
                <button onClick={exportCSV} className={btnO}>📥 Exportar CSV</button>
                <button onClick={exportJSON} className={btnO}>📦 Exportar JSON</button>
                <label className={btnO + ' cursor-pointer'}>
                  📂 Cargar análisis
                  <input type="file" accept=".json,application/json" className="hidden" onChange={importJSON} />
                </label>
                <button onClick={() => window.print()} className={btnR}>🖨️ Imprimir / PDF</button>
              </div>
            </div>

            <div id="report-content">
              {/* Header */}
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 mb-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#222]">{cfg.companyName}{cfg.department ? ` · ${cfg.department}` : ''}</h2>
                    <p className="text-sm text-[#757575]">Análisis de costos ocultos por ineficiencia operativa</p>
                    <p className="text-xs text-[#757575] mt-0.5">Generado: {new Date().toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#757575]">Herramienta</p>
                    <p className="text-sm font-bold text-[#b00020]">CostIQ · FuturIA</p>
                  </div>
                </div>
              </div>

              {/* KPI summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label:'Costo mensual actual', v: fmt(tot.totalCostMon, cfg.currency), color: C.red },
                  { label:'Costo anual actual',   v: fmt(tot.totalCostYr, cfg.currency),  color: C.red },
                  { label:'Ahorro mensual c/IA',  v: fmt(tot.totalSavMon, cfg.currency),  color: C.green },
                  { label:'Ahorro anual c/IA',    v: fmt(tot.totalSavYr, cfg.currency),   color: C.green },
                ].map(k => (
                  <div key={k.label} className="bg-white border border-[#e5e5e5] rounded-xl p-4 text-center">
                    <div className="text-xs text-[#757575] mb-1">{k.label}</div>
                    <div className="text-lg font-black" style={{ color: k.color }}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* ROI highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
                  <p className="text-xs text-[#757575] mb-1">Break-even estimado</p>
                  <p className="text-lg font-black text-[#2A5B8C]">{roiCalc.breakEven ? `Mes ${roiCalc.breakEven}` : '> 36 meses'}</p>
                </div>
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
                  <p className="text-xs text-[#757575] mb-1">ROI a 12 meses</p>
                  <p className="text-lg font-black" style={{ color: roiCalc.roi12 > 0 ? C.green : C.red }}>{fmtN(roiCalc.roi12, 0)}%</p>
                </div>
                <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
                  <p className="text-xs text-[#757575] mb-1">Reducción promedio con IA</p>
                  <p className="text-lg font-black text-[#16a34a]">{fmtN(tot.avgRed, 0)}%</p>
                </div>
              </div>

              {/* Charts — visual summary for the printed report */}
              {hasData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#222] mb-2">Costo mensual por actividad — Sin IA vs Con IA</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartActs} layout="vertical" margin={{ left:10, right:20, top:5, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis type="number" tick={{ fontSize:9 }} tickFormatter={v => `${curr.symbol}${(v/1000).toFixed(1)}k`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize:8, fill:'#333' }} width={110} />
                        <Tooltip content={<ChartTooltip currency={cfg.currency} />} />
                        <Legend iconSize={9} wrapperStyle={{ fontSize:10 }} />
                        <Bar dataKey="Sin IA" fill={C.red}  radius={[0,3,3,0]} />
                        <Bar dataKey="Con IA" fill={C.blue} radius={[0,3,3,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#222] mb-2">Distribución de costo por categoría</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={chartCat} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                          {chartCat.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => fmt(v, cfg.currency)} />
                        <Legend formatter={v => <span style={{ fontSize:9, color:'#333' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Activities list */}
              <Card title={`Actividades analizadas (${acts.length})`}>
                <div className="space-y-2">
                  {[...metrics].sort((a,b) => b.costMon - a.costMon).map((m, i) => (
                    <div key={m.id} className={`flex items-center justify-between py-2.5 border-b border-[#e5e5e5] text-sm flex-wrap gap-2 ${i === 0 ? 'border-t border-[#e5e5e5]' : ''}`}>
                      <div>
                        <span className="font-medium text-[#222]">{m.name}</span>
                        <span className="text-[11px] text-[#757575] ml-2">{m.category}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[#b00020] font-semibold">{fmt(m.costMon, cfg.currency)}/mes</span>
                          <span className="text-[#757575] text-xs ml-1">({m.affectedEmployees} pers.)</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.isMeasured ? 'bg-green-100 text-[#15803d]' : 'bg-green-50 text-[#16a34a]'}`}>↓{m.effectiveReduction}% con IA{m.isMeasured ? ' ✓' : ''}</span>
                        <PotBadge v={m.automationPotential} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Conclusion */}
              <div className="bg-[#fff5f6] border border-[#b00020] rounded-xl p-5">
                <p className="font-bold text-[#b00020] mb-2">Conclusión ejecutiva</p>
                <p className="text-sm text-[#333] leading-relaxed">
                  <strong>{cfg.companyName}</strong> está perdiendo{' '}
                  <strong>{fmt(tot.totalCostYr, cfg.currency)} anuales</strong> en {acts.length} actividad{acts.length !== 1 ? 'es' : ''}{' '}
                  de baja productividad identificadas. Con la adopción de herramientas de inteligencia artificial, se estima un ahorro potencial de{' '}
                  <strong>{fmt(tot.totalSavYr, cfg.currency)} por año</strong> ({fmtN(tot.avgRed, 0)}% de reducción promedio en tiempo).{' '}
                  {roiCalc.breakEven
                    ? `La inversión en IA estimada se recuperaría en aproximadamente ${roiCalc.breakEven} meses, generando un ROI del ${fmtN(roiCalc.roi12, 0)}% a los 12 meses.`
                    : 'Ajusta los parámetros de inversión en la pestaña ROI para calcular el período de retorno.'}
                </p>
                {tot.topCost && (
                  <p className="text-xs text-[#757575] mt-2">
                    La actividad de mayor costo es <strong>"{tot.topCost.name}"</strong> con un impacto de{' '}
                    <strong>{fmt(tot.topCost.costMon, cfg.currency)}/mes</strong> ({fmt(tot.topCost.costYear, cfg.currency)}/año).{' '}
                    Con IA, se estima una reducción del {tot.topCost.effectiveReduction}% en el tiempo dedicado a esta actividad{tot.topCost.isMeasured ? ' (dato medido ✓)' : ''}.
                  </p>
                )}
                <p className="text-[10px] text-[#b00020] mt-3 font-medium">
                  * Los cálculos son estimaciones basadas en los datos ingresados. Los resultados reales dependerán de la herramienta seleccionada, la tasa de adopción del equipo y la calidad de implementación.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#e5e5e5] bg-white mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#757575]">
            CostIQ es una herramienta de{' '}
            <a href="https://futuria.substack.com" target="_blank" rel="noopener noreferrer" className="text-[#b00020] hover:underline">FuturIA</a>.
            Todos los cálculos se procesan localmente en tu navegador — tus datos nunca salen de tu equipo.
          </p>
          <p className="text-xs text-[#757575]">© {new Date().getFullYear()} FuturIA · Todos los derechos reservados</p>
        </div>
      </footer>

      {/* ── LIBRARY MODAL ── */}
      {libraryOpen && (() => {
        const allAreas = ['Todas', ...ACTIVITY_LIBRARY.map(a => a.area)];
        const filtered = libFilter === 'Todas' ? ACTIVITY_LIBRARY : ACTIVITY_LIBRARY.filter(a => a.area === libFilter);
        const totalSelected = Object.values(selectedLib).filter(Boolean).length;
        const addSelected = () => {
          const toAdd = [];
          ACTIVITY_LIBRARY.forEach(area => {
            area.activities.forEach((act, i) => {
              const key = `${area.area}::${i}`;
              if (selectedLib[key]) toAdd.push({ ...act, id: uid(), minutesWithAI: null });
            });
          });
          if (toAdd.length === 0) return;
          setActs(p => [...p, ...toAdd]);
          setLibraryOpen(false);
        };
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setLibraryOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] bg-[#fff5f6] rounded-t-2xl">
                <div>
                  <h2 className="text-base font-bold text-[#222]">📚 Biblioteca de actividades</h2>
                  <p className="text-xs text-[#757575]">60 actividades referenciales en 9 áreas empresariales. Selecciona las que apliquen a tu empresa.</p>
                </div>
                <button onClick={() => setLibraryOpen(false)} className="text-[#757575] hover:text-[#222] text-lg leading-none px-2">✕</button>
              </div>

              {/* Area filter pills */}
              <div className="px-5 py-3 border-b border-[#e5e5e5] overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {allAreas.map(area => {
                    const areaData = ACTIVITY_LIBRARY.find(a => a.area === area);
                    return (
                      <button key={area} onClick={() => setLibFilter(area)}
                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                          libFilter === area
                            ? 'text-white border-transparent'
                            : 'bg-white border-[#e5e5e5] text-[#757575] hover:border-[#b00020] hover:text-[#b00020]'
                        }`}
                        style={libFilter === area ? { background: areaData?.color || '#b00020', borderColor: areaData?.color || '#b00020' } : {}}
                      >{area}</button>
                    );
                  })}
                </div>
              </div>

              {/* Activities list */}
              <div className="overflow-y-auto max-h-[50vh] px-5 py-4 space-y-5">
                {filtered.map(areaData => (
                  <div key={areaData.area}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: areaData.bg, color: areaData.color }}>{areaData.area}</span>
                      <span className="text-[10px] text-[#757575]">{areaData.activities.length} actividades</span>
                    </div>
                    <div className="space-y-1">
                      {areaData.activities.map((act, i) => {
                        const key = `${areaData.area}::${i}`;
                        const checked = !!selectedLib[key];
                        const alreadyAdded = acts.some(a => a.name === act.name);
                        return (
                          <label key={key} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            alreadyAdded ? 'opacity-40 cursor-not-allowed' : checked ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'
                          }`}>
                            <input type="checkbox" checked={checked} disabled={alreadyAdded}
                              onChange={e => setSelectedLib(p => ({ ...p, [key]: e.target.checked }))}
                              className="mt-0.5 accent-[#b00020] cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#222] leading-tight">
                                {act.name}
                                {alreadyAdded && <span className="text-[10px] text-[#757575] ml-1">(ya agregada)</span>}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-[10px] text-[#757575]">{act.minutesPerDay} min/día · {act.affectedEmployees} pers.</span>
                                <PotBadge v={act.automationPotential} />
                                <span className="text-[10px] font-semibold text-[#16a34a]">-{act.aiTimeReduction}% con IA</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e5e5] bg-gray-50 rounded-b-2xl">
                <div className="text-xs text-[#757575]">
                  {totalSelected > 0
                    ? <span className="font-semibold text-[#b00020]">{totalSelected} actividad{totalSelected !== 1 ? 'es' : ''} seleccionada{totalSelected !== 1 ? 's' : ''}</span>
                    : 'Selecciona las actividades que apliquen a tu empresa'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setLibraryOpen(false)} className={btnO}>Cancelar</button>
                  <button onClick={addSelected} disabled={totalSelected === 0}
                    className={`${btnR} ${totalSelected === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    Agregar {totalSelected > 0 ? `(${totalSelected})` : ''} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ABOUT MODAL ── */}
      {about && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setAbout(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.red }}>
                <span className="text-white font-black text-base">F</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#222]">CostIQ · FuturIA</h2>
                <p className="text-xs text-[#757575]">Calculadora de costos ocultos e impacto IA</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-[#333] mb-5">
              <p>CostIQ te ayuda a <strong>cuantificar el costo real de la ineficiencia operativa</strong> en tu empresa y a proyectar el retorno de inversión al adoptar herramientas de inteligencia artificial.</p>
              <p>Desarrollada por <a href="https://futuria.substack.com" target="_blank" rel="noopener noreferrer" className="text-[#b00020] hover:underline font-medium">FuturIA</a> — IA aplicada. En español. Para líderes que actúan.</p>
              <div className="grid grid-cols-3 gap-3 py-3">
                {[['+70K','Profesionales'],['+80','Países'],['100%','Local']].map(([v, l]) => (
                  <div key={l} className="text-center bg-[#fff5f6] rounded-lg p-3">
                    <div className="text-xl font-black text-[#b00020]">{v}</div>
                    <div className="text-[11px] text-[#757575]">{l}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-[#757575] space-y-1 border-t border-[#e5e5e5] pt-3">
                <p>✅ Sin registro · Sin cuenta · Cero instalación</p>
                <p>✅ Todos los cálculos son locales (sin servidor)</p>
                <p>✅ Tus datos se guardan en tu navegador</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="https://futuria.substack.com/" target="_blank" rel="noopener noreferrer" className={btnR + ' flex-1 text-center'}>Únete a FuturIA →</a>
              <button onClick={() => setAbout(false)} className={btnO + ' flex-1'}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
