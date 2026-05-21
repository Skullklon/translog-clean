import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: "b1", name: "Sucursal A — Norte", budget: 18000, color: "#00d4aa" },
  { id: "b2", name: "Sucursal B — Sur",   budget: 18000, color: "#ff6b35" },
  { id: "b3", name: "Sucursal C — Este",  budget: 10000, color: "#7c6eff" },
];

const VEHICLES = [
  { id: "v1", plate: "PJD-1190", type: "Bus",     capacity: 48, driver: "Rafael Domínguez",  fuel: "Diesel"  },
  { id: "v2", plate: "PJD-2244", type: "Van",      capacity: 18, driver: "Carlos Méndez",     fuel: "Gasolina"},
  { id: "v3", plate: "PJD-3311", type: "Minibus",  capacity: 26, driver: "Luis Polanco",      fuel: "Diesel"  },
  { id: "v4", plate: "PJD-4421", type: "Van",      capacity: 18, driver: "Mario Solano",      fuel: "Gasolina"},
  { id: "v5", plate: "PJD-5502", type: "Minibus",  capacity: 26, driver: "José Ramírez",      fuel: "Diesel"  },
];

const ROUTES = [
  { id: "r1", code: "R-01", name: "Norte — Zona Industria",      branchId: "b1", vehicleId: "v1", baseCost: 580, distKm: 24, active: true  },
  { id: "r2", code: "R-02", name: "Sur — Residencial Beta",      branchId: "b2", vehicleId: "v2", baseCost: 420, distKm: 18, active: true  },
  { id: "r3", code: "R-03", name: "Este — Urbanización Palma",   branchId: "b3", vehicleId: "v3", baseCost: 396, distKm: 21, active: true  },
  { id: "r4", code: "R-04", name: "Oeste — Centro Histórico",    branchId: "b1", vehicleId: "v4", baseCost: 340, distKm: 15, active: true  },
  { id: "r5", code: "R-05", name: "Norte — Colinas del Sur",     branchId: "b2", vehicleId: "v5", baseCost: 310, distKm: 19, active: true  },
  { id: "r6", code: "R-06", name: "Este — Los Praditos",         branchId: "b3", vehicleId: "v3", baseCost: 290, distKm: 16, active: false },
];

const EMPLOYEES = [
  { id: "e1",  name: "María González Díaz",     branchId: "b1", code: "EMP-001" },
  { id: "e2",  name: "Carlos Eduardo Peña",      branchId: "b1", code: "EMP-002" },
  { id: "e3",  name: "Ana Patricia Vargas",      branchId: "b2", code: "EMP-003" },
  { id: "e4",  name: "Luis Antonio Herrera",     branchId: "b2", code: "EMP-004" },
  { id: "e5",  name: "Sandra Lucía Torres",      branchId: "b3", code: "EMP-005" },
  { id: "e6",  name: "Miguel Ángel Castro",      branchId: "b3", code: "EMP-006" },
  { id: "e7",  name: "Paola Jiménez Reyes",      branchId: "b1", code: "EMP-007" },
  { id: "e8",  name: "Roberto Martínez Núñez",   branchId: "b2", code: "EMP-008" },
  { id: "e9",  name: "Laura Beatriz Soto",       branchId: "b1", code: "EMP-009" },
  { id: "e10", name: "Pedro José Almánzar",      branchId: "b3", code: "EMP-010" },
];

const TRIPS_DATA = [
  { id: "t1",  routeId: "r1", vehicleId: "v1", date: "2025-06-19", passengers: 44, totalCost: 580,  source: "QR"  },
  { id: "t2",  routeId: "r2", vehicleId: "v2", date: "2025-06-19", passengers: 12, totalCost: 420,  source: "OCR" },
  { id: "t3",  routeId: "r3", vehicleId: "v3", date: "2025-06-19", passengers: 21, totalCost: 396,  source: "QR"  },
  { id: "t4",  routeId: "r4", vehicleId: "v4", date: "2025-06-19", passengers: 8,  totalCost: 340,  source: "QR"  },
  { id: "t5",  routeId: "r5", vehicleId: "v5", date: "2025-06-18", passengers: 24, totalCost: 310,  source: "OCR" },
  { id: "t6",  routeId: "r1", vehicleId: "v1", date: "2025-06-18", passengers: 46, totalCost: 580,  source: "QR"  },
  { id: "t7",  routeId: "r2", vehicleId: "v2", date: "2025-06-18", passengers: 15, totalCost: 420,  source: "QR"  },
  { id: "t8",  routeId: "r3", vehicleId: "v3", date: "2025-06-17", passengers: 20, totalCost: 396,  source: "OCR" },
  { id: "t9",  routeId: "r1", vehicleId: "v1", date: "2025-06-17", passengers: 43, totalCost: 580,  source: "QR"  },
  { id: "t10", routeId: "r4", vehicleId: "v4", date: "2025-06-17", passengers: 9,  totalCost: 340,  source: "MANUAL"},
];

const ALERTS = [
  { id: "a1", title: "Ruta R-01 sobre presupuesto",        message: "+18% vs objetivo mensual",              severity: "CRITICAL", routeId: "r1", resolved: false, time: "14:22" },
  { id: "a2", title: "PJD-4421 baja ocupación",            message: "Promedio 44% esta semana",              severity: "WARNING",  routeId: "r4", resolved: false, time: "09:10" },
  { id: "a3", title: "12 registros OCR sin validar",       message: "Importación del 18/06 pendiente",        severity: "INFO",     routeId: null, resolved: false, time: "ayer"  },
  { id: "a4", title: "Sucursal B excede límite mensual",   message: "Gasto: $19,200 / Límite: $18,000",      severity: "CRITICAL", routeId: null, resolved: false, time: "lun"   },
  { id: "a5", title: "Chofer PJD-3311 sin reporte hoy",   message: "R-03 no tiene viaje registrado",        severity: "WARNING",  routeId: "r3", resolved: false, time: "18:00" },
];

const OCR_NAMES = [
  { raw: "María González Díaz",   conf: 0.97, sig: true,  matched: "e1" },
  { raw: "Carlos Eduardo Peña",   conf: 0.95, sig: true,  matched: "e2" },
  { raw: "Luis Antonio Herrera",  conf: 0.91, sig: true,  matched: "e4" },
  { raw: "Ana Patricia Vargas",   conf: 0.88, sig: false, matched: "e3" },
  { raw: "Rob??o Mart??ez N.",    conf: 0.61, sig: false, matched: null },
  { raw: "Sandra Lucía Torres",   conf: 0.93, sig: true,  matched: "e5" },
  { raw: "Miguel Ángel Castro",   conf: 0.96, sig: true,  matched: "e6" },
  { raw: "Paola Jiménez R.",      conf: 0.84, sig: true,  matched: "e7" },
];

const LIVE_FEED = [
  { time: "18:51", name: "María González", route: "R-01", method: "QR",  ok: true  },
  { time: "18:50", name: "Carlos Peña",    route: "R-01", method: "QR",  ok: true  },
  { time: "18:49", name: "Luis Herrera",   route: "R-03", method: "QR",  ok: true  },
  { time: "18:47", name: "Ana Vargas",     route: "R-02", method: "QR",  ok: true  },
  { time: "18:44", name: "Nombre ilegible",route: "R-01", method: "OCR", ok: false },
  { time: "18:41", name: "Pedro Almánzar", route: "R-05", method: "QR",  ok: true  },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt  = (n) => "$" + n.toLocaleString("es-DO", { minimumFractionDigits: 0 });
const fmtD = (n) => "$" + n.toFixed(2);
const pct  = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

function getRoute(id)   { return ROUTES.find(r => r.id === id) || {}; }
function getVehicle(id) { return VEHICLES.find(v => v.id === id) || {}; }
function getBranch(id)  { return BRANCHES.find(b => b.id === id) || {}; }

// Aggregate route stats for current "month"
const ROUTE_STATS = ROUTES.filter(r => r.active).map(r => {
  const trips = TRIPS_DATA.filter(t => t.routeId === r.id);
  const totalCost = trips.reduce((s, t) => s + t.totalCost, 0);
  const totalPass = trips.reduce((s, t) => s + t.passengers, 0);
  const v = getVehicle(r.vehicleId);
  const avgOcc = trips.length ? trips.reduce((s, t) => s + pct(t.passengers, v.capacity || 1), 0) / trips.length : 0;
  return {
    ...r, trips: trips.length, totalCost, totalPass,
    avgCPP: totalPass > 0 ? totalCost / totalPass : 0,
    avgOcc: Math.round(avgOcc),
  };
}).sort((a, b) => b.totalCost - a.totalCost);

const TOTAL_COST  = ROUTE_STATS.reduce((s, r) => s + r.totalCost, 0);
const TOTAL_TRIPS = TRIPS_DATA.length;
const TOTAL_PASS  = TRIPS_DATA.reduce((s, t) => s + t.passengers, 0);
const AVG_CPP     = TOTAL_PASS > 0 ? TOTAL_COST / TOTAL_PASS : 0;

// Employee cost simulation
const EMP_COSTS = EMPLOYEES.map(e => {
  const branch = getBranch(e.branchId);
  const cost = 90 + Math.random() * 100;
  const trips = 8 + Math.floor(Math.random() * 14);
  return { ...e, branch: branch.name, totalCost: cost, trips };
}).sort((a, b) => b.totalCost - a.totalCost);

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────

const C = {
  bg:       "#080b0f",
  surface:  "#0f1318",
  surface2: "#161c24",
  surface3: "#1c2430",
  border:   "#1e2a38",
  border2:  "#243040",
  accent:   "#00e5b3",
  orange:   "#ff6b35",
  purple:   "#8b7fff",
  yellow:   "#fbbf24",
  red:      "#f43f5e",
  text:     "#e8f0fe",
  muted:    "#5a7a9a",
  dim:      "#2d3f52",
};

const FONT_DISPLAY = "'Syne', sans-serif";
const FONT_MONO    = "'JetBrains Mono', monospace";
const FONT_BODY    = "'DM Sans', sans-serif";

// ─── STYLE HELPERS ──────────────────────────────────────────────────────────

const tag = (color, bg) => ({
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "3px 9px", borderRadius: 5,
  fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "0.5px",
  color, background: bg, border: `1px solid ${color}33`,
  whiteSpace: "nowrap",
});

const TAGS = {
  ok:      tag(C.accent,  "rgba(0,229,179,.1)"),
  warn:    tag(C.yellow,  "rgba(251,191,36,.1)"),
  bad:     tag(C.red,     "rgba(244,63,94,.1)"),
  purple:  tag(C.purple,  "rgba(139,127,255,.1)"),
  orange:  tag(C.orange,  "rgba(255,107,53,.1)"),
  muted:   tag(C.muted,   "rgba(90,122,154,.1)"),
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Card({ children, style = {}, noPad = false }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, overflow: "hidden",
      ...(noPad ? {} : {}),
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, right, icon }) {
  return (
    <div style={{
      padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: C.text, display:"flex", alignItems:"center", gap:8 }}>
        {icon && <span>{icon}</span>}{title}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <Card style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{
        position:"absolute", top:0, right:0, width:70, height:70,
        borderRadius:"0 14px 0 70px", background: color, opacity:.08,
      }}/>
      <div style={{ fontFamily: FONT_MONO, fontSize:10, color: C.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:10 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 800, color, letterSpacing:"-1px", lineHeight:1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 7, fontFamily: FONT_MONO }}>
        {sub}
      </div>
    </Card>
  );
}

function Btn({ children, primary, small, onClick, style={} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: small ? "6px 13px" : "9px 18px",
        borderRadius: 8, fontSize: small ? 11 : 13,
        fontFamily: FONT_BODY, fontWeight: 600, cursor: "pointer", border:"none",
        background: primary
          ? (hov ? "#00ffcc" : C.accent)
          : (hov ? C.surface3 : C.surface2),
        color: primary ? C.bg : C.muted,
        border: primary ? "none" : `1px solid ${C.border}`,
        display: "inline-flex", alignItems:"center", gap:6,
        transition: "all .15s",
        ...style,
      }}
    >{children}</button>
  );
}

function EffBar({ pct: p, color = C.accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:70, height:5, background: C.surface3, borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${p}%`, height:"100%", background:color, borderRadius:3 }}/>
      </div>
      <span style={{ fontSize:11, fontFamily:FONT_MONO, color:C.muted }}>{p}%</span>
    </div>
  );
}

function Ring({ value, color, label, size=90 }) {
  const r = 35; const circ = 2 * Math.PI * r;
  const dash = circ - (value / 100) * circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} viewBox="0 0 90 90" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="45" cy="45" r={r} fill="none" stroke={C.surface3} strokeWidth="8"/>
          <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontSize:18, fontWeight:800, color }}>{value}%</span>
        </div>
      </div>
      <span style={{ fontSize:10, color:C.muted, fontFamily:FONT_MONO }}>{label}</span>
    </div>
  );
}

// ─── PAGES ──────────────────────────────────────────────────────────────────

function PageDashboard() {
  const branchTotals = BRANCHES.map(b => {
    const routes = ROUTES.filter(r => r.branchId === b.id);
    const cost = routes.reduce((s, r) => {
      return s + TRIPS_DATA.filter(t => t.routeId === r.id).reduce((ss, t) => ss + t.totalCost, 0);
    }, 0);
    const trips = routes.reduce((s, r) => s + TRIPS_DATA.filter(t => t.routeId === r.id).length, 0);
    return { ...b, cost, trips };
  });
  const maxCost = Math.max(...branchTotals.map(b => b.cost));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KpiCard label="Gasto Mensual"   value={fmt(TOTAL_COST)}  sub="↑ 3.2% vs mes anterior"  color={C.accent}  icon="💰"/>
        <KpiCard label="Viajes"           value={TOTAL_TRIPS}      sub={`${ROUTES.filter(r=>r.active).length} rutas activas`} color={C.orange}  icon="🚌"/>
        <KpiCard label="Pasajeros"        value={TOTAL_PASS.toLocaleString()} sub="Ocupación prom. 76%" color={C.purple}  icon="👥"/>
        <KpiCard label="Costo / Persona"  value={fmtD(AVG_CPP)}   sub="↓ $0.32 del objetivo"    color={C.yellow}  icon="📊"/>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:12 }}>
        {/* Bar chart */}
        <Card>
          <CardHeader title="Costo Mensual por Ruta" icon="📈"
            right={<span style={TAGS.ok}>6 rutas activas</span>}/>
          <div style={{ padding:"20px 20px 14px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:130 }}>
              {ROUTE_STATS.map((r, i) => {
                const colors = [C.accent, C.purple, C.orange, C.yellow, C.accent, C.purple];
                const h = Math.round((r.totalCost / Math.max(...ROUTE_STATS.map(x=>x.totalCost))) * 100);
                return (
                  <div key={r.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{ fontFamily:FONT_MONO, fontSize:9, color:colors[i] }}>{fmt(r.totalCost)}</div>
                    <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                      <div style={{
                        width:"100%", height:`${h}%`, minHeight:8,
                        background:`linear-gradient(180deg,${colors[i]},${colors[i]}88)`,
                        borderRadius:"4px 4px 0 0", cursor:"pointer",
                        transition:"opacity .2s",
                      }}/>
                    </div>
                    <div style={{ fontFamily:FONT_MONO, fontSize:9, color:C.muted }}>{r.code}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader title="Alertas Activas" icon="⚠️"
            right={<span style={TAGS.bad}>{ALERTS.filter(a=>!a.resolved).length} pendientes</span>}/>
          <div>
            {ALERTS.filter(a=>!a.resolved).slice(0,5).map(a => (
              <div key={a.id} style={{
                padding:"11px 16px", borderBottom:`1px solid ${C.border}`,
                display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer",
              }}>
                <div style={{
                  width:28, height:28, borderRadius:7, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
                  background: a.severity==="CRITICAL" ? "rgba(244,63,94,.12)"
                    : a.severity==="WARNING" ? "rgba(251,191,36,.1)" : "rgba(139,127,255,.1)",
                }}>
                  {a.severity==="CRITICAL" ? "🔴" : a.severity==="WARNING" ? "⚠️" : "ℹ️"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{a.title}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{a.message}</div>
                </div>
                <div style={{ fontSize:10, color:C.muted, fontFamily:FONT_MONO, flexShrink:0 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Route table + branch compare */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:12 }}>
        <Card>
          <CardHeader title="Ranking de Rutas" icon="🏆"
            right={<Btn small>Ver todas →</Btn>}/>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["#","Ruta","Costo Mes","$/Persona","Ocupación","Estado"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10,
                    textTransform:"uppercase", letterSpacing:"1px", color:C.muted,
                    fontFamily:FONT_MONO, fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROUTE_STATS.map((r, i) => {
                const v = getVehicle(r.vehicleId);
                const effColor = r.avgOcc >= 80 ? C.accent : r.avgOcc >= 60 ? C.yellow : C.red;
                const stTag = r.avgOcc >= 80 ? TAGS.ok : r.avgOcc >= 60 ? TAGS.warn : TAGS.bad;
                const stLabel = r.avgOcc >= 80 ? "✓ OK" : r.avgOcc >= 60 ? "⚡ Rev." : "⚠ Inef.";
                return (
                  <tr key={r.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontFamily:FONT_MONO, fontSize:11, color:C.muted }}>{String(i+1).padStart(2,"0")}</span>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{r.name}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{v.type} {v.capacity}p · {v.plate} · {r.trips} viajes</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.accent }}>{fmt(r.totalCost)}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontFamily:FONT_MONO, fontSize:12, color:C.text }}>
                      {fmtD(r.avgCPP)}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <EffBar pct={r.avgOcc} color={effColor}/>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={stTag}>{stLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Branch compare */}
        <Card>
          <CardHeader title="Por Sucursal" icon="🏢"/>
          <div style={{ padding:"16px 20px" }}>
            {branchTotals.map(b => (
              <div key={b.id} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{b.name}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{b.trips} viajes</div>
                  </div>
                  <span style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:b.color }}>{fmt(b.cost)}</span>
                </div>
                <div style={{ height:5, background:C.surface3, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct(b.cost, maxCost)}%`, height:"100%", background:b.color, borderRadius:3 }}/>
                </div>
                {b.budget && (
                  <div style={{ fontSize:10, color: b.cost > b.budget ? C.red : C.muted, marginTop:3, fontFamily:FONT_MONO }}>
                    {pct(b.cost, b.budget)}% del presupuesto {b.cost > b.budget ? "⚠ EXCEDIDO" : ""}
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop:12, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:12 }}>Ocupación Promedio</div>
              <div style={{ display:"flex", justifyContent:"space-around" }}>
                <Ring value={91} color={C.accent}  label="R-01"/>
                <Ring value={68} color={C.purple}  label="R-02"/>
                <Ring value={44} color={C.red}     label="R-04"/>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee costs + recent trips */}
      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:12 }}>
        <Card>
          <CardHeader title="Top Empleados" icon="👤"/>
          <div style={{ padding:"0 0 4px" }}>
            {EMP_COSTS.slice(0,8).map((e, i) => {
              const colors = [C.accent,C.purple,C.orange,C.yellow,C.accent,C.purple,C.orange,C.yellow];
              return (
                <div key={e.id} style={{
                  padding:"9px 16px", borderBottom:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ fontFamily:FONT_MONO, fontSize:10, color:C.muted, width:16 }}>{i+1}</span>
                  <div style={{
                    width:28, height:28, borderRadius:"50%",
                    background:colors[i], color:C.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:800, flexShrink:0,
                  }}>{e.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.name}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{e.trips} viajes</div>
                  </div>
                  <span style={{ fontFamily:FONT_MONO, fontSize:11, color:C.yellow, flexShrink:0 }}>{fmtD(e.totalCost)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Viajes Recientes" icon="🕐"
            right={<Btn small>Ver todos →</Btn>}/>
          <div style={{ padding:"0 0 4px" }}>
            {TRIPS_DATA.slice(0,7).map(t => {
              const r = getRoute(t.routeId);
              const v = getVehicle(t.vehicleId);
              const occ = pct(t.passengers, v.capacity||1);
              const occTag = occ >= 80 ? TAGS.ok : occ >= 60 ? TAGS.warn : TAGS.bad;
              return (
                <div key={t.id} style={{
                  padding:"10px 20px", borderBottom:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", gap:14,
                }}>
                  <div style={{ fontFamily:FONT_MONO, fontSize:10, color:C.muted, width:50, flexShrink:0 }}>{t.date.slice(5)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{r.name}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{v.plate} · {v.driver} · {t.passengers}/{v.capacity}p · {t.source}</div>
                  </div>
                  <span style={occTag}>{occ}% occ.</span>
                  <span style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.accent }}>{fmt(t.totalCost)}</span>
                  <span style={{ fontFamily:FONT_MONO, fontSize:11, color:C.muted }}>{fmtD(t.totalCost/t.passengers)}/p</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGE: CHECK-IN ──────────────────────────────────────────────────────────

function PageCheckin() {
  const [tab, setTab]         = useState("ocr");
  const [ocrState, setOcrState] = useState("idle"); // idle | processing | done
  const [ocrNames, setOcrNames] = useState([]);
  const [selectedRoute, setSelRoute] = useState(null);
  const [liveFeed, setLiveFeed] = useState(LIVE_FEED);
  const [qrForm, setQrForm]   = useState({ name:"", code:"", confirmed:false });
  const [qrResult, setQrResult] = useState(null);

  const runOcr = () => {
    setOcrState("processing");
    setOcrNames([]);
    setTimeout(() => {
      setOcrNames(OCR_NAMES);
      setOcrState("done");
    }, 2200);
  };

  const submitQr = () => {
    if (!qrForm.name || !qrForm.confirmed || !selectedRoute) return;
    const r = getRoute(selectedRoute);
    setTimeout(() => {
      setQrResult({ name: qrForm.name, route: r.name });
      const entry = { time: new Date().toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"}), name: qrForm.name, route: r.code, method:"QR", ok: true };
      setLiveFeed(f => [entry, ...f]);
      setQrForm({ name:"", code:"", confirmed:false });
      setTimeout(() => setQrResult(null), 3000);
    }, 800);
  };

  const validateOcr = (idx, val) => {
    setOcrNames(ns => ns.map((n, i) => i===idx ? {...n, validated: val} : n));
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        <Card>
          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.border}` }}>
            {[["ocr","📷 OCR"],["qr","📱 QR"],["batch","📦 Batch"]].map(([k,l]) => (
              <div key={k} onClick={() => setTab(k)} style={{
                padding:"12px 20px", fontSize:12, cursor:"pointer", fontWeight:600,
                color: tab===k ? C.accent : C.muted,
                borderBottom: tab===k ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom:-1, transition:"all .15s",
              }}>{l}</div>
            ))}
          </div>

          {/* OCR TAB */}
          {tab==="ocr" && (
            <div style={{ padding:20 }}>
              {ocrState==="idle" && (
                <div onClick={runOcr} style={{
                  border:`2px dashed ${C.border2}`, borderRadius:10, padding:"40px 20px",
                  textAlign:"center", cursor:"pointer",
                  transition:"all .2s",
                }}>
                  <div style={{ fontSize:48, marginBottom:10 }}>📋</div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>Toca para simular carga de foto</div>
                  <div style={{ fontSize:12, color:C.muted }}>JPG, PNG · El sistema detecta nombres y firmas automáticamente</div>
                  <div style={{ marginTop:14 }}>
                    <Btn primary>Simular OCR →</Btn>
                  </div>
                </div>
              )}

              {ocrState==="processing" && (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:6 }}>Procesando con Google Vision API…</div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Extrayendo nombres y detectando firmas</div>
                  <div style={{ height:4, background:C.surface3, borderRadius:2, overflow:"hidden" }}>
                    <div style={{
                      height:"100%", background:`linear-gradient(90deg,${C.accent},${C.purple})`,
                      borderRadius:2, animation:"progress 2s ease-out forwards",
                      width:"0%",
                    }}/>
                  </div>
                  <style>{`@keyframes progress{to{width:95%}}`}</style>
                </div>
              )}

              {ocrState==="done" && (
                <div>
                  <div style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginBottom:14, padding:"10px 14px",
                    background:C.surface2, borderRadius:8, border:`1px solid ${C.border}`,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, animation:"pulse_ 1.5s infinite" }}/>
                      <style>{`@keyframes pulse_{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                      <span style={{ fontSize:12, fontWeight:600, color:C.text }}>OCR Completado · R-01 · 19/06/2025</span>
                      <span style={TAGS.ok}>Confianza: 91.4%</span>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn small onClick={() => setOcrState("idle")}>← Reintentar</Btn>
                      <Btn small primary>✓ Confirmar {ocrNames.length} registros</Btn>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px", gap:"0 8px",
                    padding:"6px 10px", fontSize:10, color:C.muted, fontFamily:FONT_MONO,
                    textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:`1px solid ${C.border}` }}>
                    <span>Nombre extraído</span><span>Empleado mapeado</span><span>Firma / Conf.</span><span>Acción</span>
                  </div>
                  {ocrNames.map((n, i) => (
                    <div key={i} style={{
                      display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px", gap:"0 8px",
                      padding:"10px 10px", fontSize:12, borderBottom:`1px solid ${C.border}`,
                      alignItems:"center",
                      background: n.validated===false ? "rgba(244,63,94,.04)" : "transparent",
                    }}>
                      <span style={{ fontFamily:FONT_MONO, color: n.conf < 0.8 ? C.yellow : C.text }}>{n.raw}</span>
                      <span style={{ color: n.matched ? C.accent : C.muted }}>
                        {n.matched ? EMPLOYEES.find(e=>e.id===n.matched)?.name : "—Sin match—"}
                      </span>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={n.sig ? TAGS.ok : TAGS.muted}>{n.sig ? "✍ firma" : "sin firma"}</span>
                        <span style={n.conf >= 0.85 ? TAGS.ok : TAGS.warn}>{Math.round(n.conf*100)}%</span>
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => validateOcr(i, true)} style={{
                          width:28, height:28, borderRadius:6, border:"none", cursor:"pointer",
                          background: n.validated===true ? C.accent : C.surface3, color: n.validated===true ? C.bg : C.muted, fontSize:13,
                        }}>✓</button>
                        <button onClick={() => validateOcr(i, false)} style={{
                          width:28, height:28, borderRadius:6, border:"none", cursor:"pointer",
                          background: n.validated===false ? C.red : C.surface3, color: n.validated===false ? "#fff" : C.muted, fontSize:13,
                        }}>✗</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QR TAB */}
          {tab==="qr" && (
            <div style={{ padding:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>1. Selecciona la ruta:</div>
                  {ROUTES.filter(r=>r.active).slice(0,4).map(r => (
                    <div key={r.id} onClick={() => setSelRoute(r.id)} style={{
                      padding:"10px 14px", marginBottom:6,
                      background: selectedRoute===r.id ? "rgba(0,229,179,.08)" : C.surface2,
                      border:`1px solid ${selectedRoute===r.id ? C.accent : C.border}`,
                      borderRadius:8, cursor:"pointer", fontSize:13, transition:"all .15s",
                    }}>
                      🛣️ {r.code} · {r.name}
                    </div>
                  ))}
                  {selectedRoute && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>2. Simular check-in de empleado:</div>
                      <input value={qrForm.name} onChange={e=>setQrForm(f=>({...f,name:e.target.value}))}
                        placeholder="Nombre del empleado"
                        style={{ width:"100%", background:C.surface3, border:`1px solid ${C.border2}`,
                          borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13, marginBottom:8, boxSizing:"border-box" }}/>
                      <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:C.muted }}>
                        <input type="checkbox" checked={qrForm.confirmed} onChange={e=>setQrForm(f=>({...f,confirmed:e.target.checked}))}
                          style={{ width:16, height:16, accentColor:C.accent }}/>
                        Confirmo abordaje
                      </label>
                      <Btn primary style={{ marginTop:10, width:"100%" }}
                        onClick={submitQr}>✓ Registrar Abordaje</Btn>
                      {qrResult && (
                        <div style={{ marginTop:10, padding:"10px 14px",
                          background:"rgba(0,229,179,.1)", border:`1px solid ${C.accent}33`,
                          borderRadius:8, fontSize:12, color:C.accent }}>
                          ✅ {qrResult.name} registrado en {qrResult.route}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* QR Visual */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  {selectedRoute ? (
                    <>
                      <div style={{ fontSize:11, color:C.muted }}>QR generado para {getRoute(selectedRoute).code}:</div>
                      <div style={{ background:"white", padding:16, borderRadius:12, width:140, height:140,
                        display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                        {Array.from({length:49}, (_,i) => {
                          const border = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48].includes(i);
                          const rand = (i * 7 + 3) % 3 === 0;
                          return <div key={i} style={{ borderRadius:1, background: (border||rand) ? "#000":"#fff" }}/>;
                        })}
                      </div>
                      <div style={{ fontFamily:FONT_MONO, fontSize:10, color:C.accent }}>TRANSLOG-{getRoute(selectedRoute).code}-2025</div>
                      <Btn small primary>⬇ Descargar QR</Btn>
                      <div style={{ fontSize:10, color:C.muted }}>Válido hoy · Expira 23:59</div>
                    </>
                  ) : (
                    <div style={{ fontSize:12, color:C.muted, textAlign:"center", padding:20 }}>
                      ← Selecciona una ruta para generar su QR
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BATCH TAB */}
          {tab==="batch" && (
            <div style={{ padding:20 }}>
              <div style={{
                border:`2px dashed ${C.border2}`, borderRadius:10, padding:"30px 20px",
                textAlign:"center", marginBottom:14,
              }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📁</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>Subida masiva de imágenes históricas</div>
                <div style={{ fontSize:12, color:C.muted }}>Múltiples archivos · Cola de procesamiento automática</div>
              </div>
              {[
                { name:"listado_01_may.jpg", status:"done",       employees:44, note:"" },
                { name:"listado_02_may.jpg", status:"processing", employees:null, note:"" },
                { name:"listado_03_may.jpg", status:"review",     employees:null, note:"3 nombres ilegibles" },
                { name:"listado_04_abr.jpg", status:"done",       employees:38, note:"" },
                { name:"listado_05_abr.jpg", status:"done",       employees:41, note:"" },
              ].map((f,i) => (
                <div key={i} style={{
                  padding:"10px 14px", marginBottom:6,
                  background:C.surface2, border:`1px solid ${C.border}`,
                  borderRadius:8, display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ fontSize:16 }}>📷</span>
                  <span style={{ flex:1, fontSize:12, color:C.text }}>{f.name}</span>
                  {f.status==="done"       && <><span style={TAGS.ok}>✓ Procesado</span><span style={{ fontSize:11, color:C.muted }}>{f.employees} empleados</span></>}
                  {f.status==="processing" && <><div style={{ width:8,height:8,borderRadius:"50%",background:C.accent,animation:"pulse_ 1s infinite" }}/><span style={TAGS.warn}>Procesando…</span></>}
                  {f.status==="review"     && <><span style={TAGS.bad}>⚠ Revisión manual</span><span style={{ fontSize:11, color:C.muted }}>{f.note}</span></>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Live feed */}
      <Card>
        <CardHeader title="Check-ins en Vivo" icon="🔴"
          right={<div style={{ width:8,height:8,borderRadius:"50%",background:C.accent,animation:"pulse_ 1.5s infinite" }}/>}/>
        <div>
          {liveFeed.slice(0,10).map((c,i) => (
            <div key={i} style={{
              padding:"10px 16px", borderBottom:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{ fontFamily:FONT_MONO, fontSize:10, color: i < 2 ? C.accent : C.muted, width:36 }}>{c.time}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{c.name}</div>
                <div style={{ fontSize:10, color:C.muted }}>{c.method} · {c.route}</div>
              </div>
              <span style={c.ok ? TAGS.ok : TAGS.warn}>{c.ok ? "✓" : "Rev"}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, fontSize:12, color:C.muted, textAlign:"center" }}>
          {liveFeed.length} registros hoy
        </div>
      </Card>
    </div>
  );
}

// ─── PAGE: ROUTES ────────────────────────────────────────────────────────────

function PageRoutes() {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ name:"", code:"", branchId:"b1", vehicleId:"v1", baseCost:"" });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {ROUTES.map(r => {
          const v = getVehicle(r.vehicleId);
          const b = getBranch(r.branchId);
          const trips = TRIPS_DATA.filter(t=>t.routeId===r.id);
          const cost = trips.reduce((s,t)=>s+t.totalCost,0);
          const avgOcc = trips.length ? trips.reduce((s,t)=>s+pct(t.passengers,v.capacity||1),0)/trips.length : 0;
          return (
            <Card key={r.id} style={{ padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontFamily:FONT_MONO, fontSize:11, color:C.accent }}>{r.code}</span>
                <span style={r.active ? TAGS.ok : TAGS.muted}>{r.active ? "Activa" : "Inactiva"}</span>
              </div>
              <div style={{ fontFamily:FONT_DISPLAY, fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{r.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>
                {v.type} {v.capacity}p · {v.plate} · {v.driver}<br/>
                {b.name} · {r.distKm}km
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                <div style={{ background:C.surface2, borderRadius:7, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:C.muted, fontFamily:FONT_MONO, textTransform:"uppercase" }}>Costo base</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.accent }}>{fmt(r.baseCost)}</div>
                </div>
                <div style={{ background:C.surface2, borderRadius:7, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:C.muted, fontFamily:FONT_MONO, textTransform:"uppercase" }}>Ocupación</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color: avgOcc>=70?C.accent:C.yellow }}>{Math.round(avgOcc)}%</div>
                </div>
              </div>
              <EffBar pct={Math.round(avgOcc)} color={avgOcc>=70?C.accent:C.yellow}/>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE: REPORTS ────────────────────────────────────────────────────────────

function PageReports() {
  const [exported, setExported] = useState(false);

  const rows = ROUTE_STATS.map(r => ({
    ruta: `${r.code} — ${r.name}`,
    sucursal: getBranch(r.branchId).name,
    viajes: r.trips,
    pasajeros: r.totalPass,
    costoTotal: fmt(r.totalCost),
    costoXpersona: fmtD(r.avgCPP),
    ocupacion: `${r.avgOcc}%`,
    eficiencia: r.avgOcc >= 80 ? "Óptima" : r.avgOcc >= 60 ? "Revisar" : "Ineficiente",
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Filters */}
      <Card style={{ padding:18 }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:FONT_MONO }}>DESDE</div>
            <input type="date" defaultValue="2025-06-01"
              style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8,
                padding:"8px 12px", color:C.text, fontSize:12 }}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:FONT_MONO }}>HASTA</div>
            <input type="date" defaultValue="2025-06-30"
              style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8,
                padding:"8px 12px", color:C.text, fontSize:12 }}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:FONT_MONO }}>SUCURSAL</div>
            <select style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8,
              padding:"8px 12px", color:C.text, fontSize:12 }}>
              <option>Todas</option>
              {BRANCHES.map(b=><option key={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:FONT_MONO }}>RUTA</div>
            <select style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8,
              padding:"8px 12px", color:C.text, fontSize:12 }}>
              <option>Todas</option>
              {ROUTES.map(r=><option key={r.id}>{r.code}</option>)}
            </select>
          </div>
          <Btn primary onClick={() => { setExported(true); setTimeout(()=>setExported(false), 2500); }}>
            {exported ? "✅ Generado!" : "⬇ Exportar Excel"}
          </Btn>
        </div>
      </Card>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        <KpiCard label="Costo Total" value={fmt(TOTAL_COST)} sub="Jun 2025" color={C.accent} icon="💰"/>
        <KpiCard label="Costo/Persona" value={fmtD(AVG_CPP)} sub="Promedio rutas" color={C.yellow} icon="👤"/>
        <KpiCard label="Ruta más cara" value="R-01" sub={fmt(ROUTE_STATS[0]?.totalCost||0)} color={C.orange} icon="🔺"/>
        <KpiCard label="Mejor eficiencia" value="R-01" sub="91% ocupación" color={C.purple} icon="⭐"/>
      </div>

      {/* Table */}
      <Card>
        <CardHeader title="Reporte: Costo por Persona por Ruta — Junio 2025" icon="📋"/>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Ruta","Sucursal","Viajes","Pasajeros","Costo Total","$/Persona","Ocupación","Estado"].map(h=>(
                <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10,
                  textTransform:"uppercase", letterSpacing:"1px", color:C.muted,
                  fontFamily:FONT_MONO, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const r = ROUTE_STATS[i];
              const stTag = r.avgOcc >= 80 ? TAGS.ok : r.avgOcc >= 60 ? TAGS.warn : TAGS.bad;
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"11px 16px", fontSize:13, fontWeight:600, color:C.text }}>{row.ruta}</td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:C.muted }}>{row.sucursal}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12 }}>{row.viajes}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12 }}>{row.pasajeros}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.accent }}>{row.costoTotal}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12, color:C.yellow }}>{row.costoXpersona}</td>
                  <td style={{ padding:"11px 16px" }}><EffBar pct={r.avgOcc} color={r.avgOcc>=70?C.accent:C.yellow}/></td>
                  <td style={{ padding:"11px 16px" }}><span style={stTag}>{row.eficiencia}</span></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop:`2px solid ${C.border2}` }}>
              <td colSpan={3} style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>TOTAL</td>
              <td style={{ padding:"12px 16px", fontFamily:FONT_MONO, fontSize:13, fontWeight:700 }}>{TOTAL_PASS}</td>
              <td style={{ padding:"12px 16px", fontFamily:FONT_DISPLAY, fontSize:15, fontWeight:800, color:C.accent }}>{fmt(TOTAL_COST)}</td>
              <td style={{ padding:"12px 16px", fontFamily:FONT_MONO, fontSize:13, fontWeight:700, color:C.yellow }}>{fmtD(AVG_CPP)}</td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}

// ─── PAGE: TRIPS ─────────────────────────────────────────────────────────────

function PageTrips() {
  const [newTrip, setNewTrip] = useState(false);
  const [form, setForm] = useState({ routeId:"r1", vehicleId:"v1", date:"2025-06-20", cost:"" });
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {newTrip ? (
        <Card style={{ padding:24 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:16, fontWeight:700, color:C.text, marginBottom:18 }}>Nuevo Viaje</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            {[
              { label:"Ruta", key:"routeId", type:"select", opts: ROUTES.filter(r=>r.active).map(r=>({v:r.id,l:`${r.code} · ${r.name}`})) },
              { label:"Vehículo", key:"vehicleId", type:"select", opts: VEHICLES.map(v=>({v:v.id,l:`${v.plate} · ${v.driver}` })) },
              { label:"Fecha", key:"date", type:"date" },
              { label:"Costo Total ($)", key:"cost", type:"number", placeholder:"580.00" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:5, fontFamily:FONT_MONO, textTransform:"uppercase" }}>{f.label}</div>
                {f.type==="select" ? (
                  <select value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                    style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13 }}>
                    {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                    onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                    style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13, boxSizing:"border-box" }}/>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={()=>setNewTrip(false)}>Cancelar</Btn>
            <Btn primary onClick={()=>{ setSaved(true); setTimeout(()=>{ setSaved(false); setNewTrip(false); },1500); }}>
              {saved ? "✅ Guardado!" : "✓ Crear Viaje"}
            </Btn>
          </div>
        </Card>
      ) : (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <Btn primary onClick={()=>setNewTrip(true)}>+ Nuevo Viaje</Btn>
        </div>
      )}

      <Card>
        <CardHeader title={`Todos los Viajes (${TRIPS_DATA.length})`} icon="🗺️"/>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Fecha","Ruta","Vehículo / Chofer","Pasajeros","Ocupación","Costo","$/Persona","Fuente"].map(h=>(
                <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10,
                  textTransform:"uppercase", letterSpacing:"1px", color:C.muted, fontFamily:FONT_MONO, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRIPS_DATA.map(t => {
              const r = getRoute(t.routeId);
              const v = getVehicle(t.vehicleId);
              const occ = pct(t.passengers, v.capacity||1);
              const srcTag = t.source==="QR" ? TAGS.ok : t.source==="OCR" ? TAGS.purple : TAGS.muted;
              return (
                <tr key={t.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:11, color:C.muted }}>{t.date}</td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{r.code}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{r.name}</div>
                  </td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ fontSize:12, color:C.text }}>{v.plate}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{v.driver}</div>
                  </td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12 }}>{t.passengers}/{v.capacity}</td>
                  <td style={{ padding:"11px 16px" }}><EffBar pct={occ} color={occ>=70?C.accent:C.yellow}/></td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.accent }}>{fmt(t.totalCost)}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:11, color:C.yellow }}>{fmtD(t.totalCost/t.passengers)}</td>
                  <td style={{ padding:"11px 16px" }}><span style={srcTag}>{t.source}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── PAGE: VEHICLES ───────────────────────────────────────────────────────────

function PageVehicles() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
      {VEHICLES.map(v => {
        const trips = TRIPS_DATA.filter(t=>t.vehicleId===v.id);
        const totalPass = trips.reduce((s,t)=>s+t.passengers,0);
        const avgOcc = trips.length ? trips.reduce((s,t)=>s+pct(t.passengers,v.capacity),0)/trips.length : 0;
        const totalCost = trips.reduce((s,t)=>s+t.totalCost,0);
        return (
          <Card key={v.id} style={{ padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontFamily:FONT_MONO, fontSize:11, color:C.accent }}>{v.plate}</span>
              <span style={TAGS.muted}>{v.type}</span>
            </div>
            <div style={{ fontSize:16, fontWeight:700, fontFamily:FONT_DISPLAY, color:C.text, marginBottom:4 }}>{v.driver}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>
              Capacidad: {v.capacity}p · {v.fuel}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                { label:"Viajes", val:trips.length },
                { label:"Pasajeros", val:totalPass },
                { label:"Costo mes", val:fmt(totalCost) },
              ].map(s => (
                <div key={s.label} style={{ background:C.surface2, borderRadius:7, padding:"8px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:C.muted, fontFamily:FONT_MONO, textTransform:"uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontSize:14, fontWeight:700, color:C.text }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:5 }}>Ocupación promedio</div>
            <EffBar pct={Math.round(avgOcc)} color={avgOcc>=70?C.accent:C.yellow}/>
          </Card>
        );
      })}
    </div>
  );
}

// ─── PAGE: EMPLOYEES ──────────────────────────────────────────────────────────

function PageEmployees() {
  const [search, setSearch] = useState("");
  const filtered = EMPLOYEES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.code.includes(search));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:12 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Buscar empleado por nombre o código…"
          style={{ flex:1, background:C.surface, border:`1px solid ${C.border2}`,
            borderRadius:9, padding:"10px 14px", color:C.text, fontSize:13 }}/>
        <Btn primary>+ Empleado</Btn>
      </div>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["Empleado","Código","Sucursal","Viajes Jun","Costo Jun","Estado"].map(h=>(
                <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10,
                  textTransform:"uppercase", letterSpacing:"1px", color:C.muted, fontFamily:FONT_MONO, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const stat = EMP_COSTS.find(x=>x.id===e.id) || { trips:0, totalCost:0 };
              const b = getBranch(e.branchId);
              const colors = [C.accent,C.purple,C.orange,C.yellow];
              return (
                <tr key={e.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:colors[i%4], color:C.bg,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>
                        {e.name.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:11, color:C.muted }}>{e.code}</td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:C.muted }}>{b.name}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12 }}>{stat.trips}</td>
                  <td style={{ padding:"11px 16px", fontFamily:FONT_MONO, fontSize:12, color:C.yellow }}>{fmtD(stat.totalCost)}</td>
                  <td style={{ padding:"11px 16px" }}><span style={TAGS.ok}>Activo</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const NAV = [
  { id:"dashboard",  label:"Dashboard",   icon:"📊", group:"Principal" },
  { id:"trips",      label:"Viajes",       icon:"🗺️", group:"Principal", badge:3 },
  { id:"checkin",    label:"Check-in",     icon:"📷", group:"Principal" },
  { id:"routes",     label:"Rutas",        icon:"🛣️", group:"Gestión"  },
  { id:"vehicles",   label:"Vehículos",    icon:"🚐", group:"Gestión"  },
  { id:"employees",  label:"Empleados",    icon:"👥", group:"Gestión"  },
  { id:"reports",    label:"Reportes",     icon:"📋", group:"Análisis" },
];

export default function App() {
  const [page, setPage]   = useState("dashboard");
  const [role, setRole]   = useState("coordinator"); // coordinator | provider
  const [period, setPeriod] = useState("MES");

  const PAGE_TITLES = {
    dashboard: "Dashboard Operativo",
    trips:     "Gestión de Viajes",
    checkin:   "Check-in Digital",
    routes:    "Rutas",
    vehicles:  "Vehículos",
    employees: "Empleados",
    reports:   "Reportes & Exportación",
  };

  const PAGE_SUBS = {
    dashboard: "Junio 2025 · 3 sucursales · Actualizado hace 4 min",
    trips:     "Historial completo de viajes con costo y ocupación",
    checkin:   "OCR desde imagen de listado físico · Formulario QR por ruta",
    routes:    "Configuración de rutas y asignación de vehículos",
    vehicles:  "Flota asignada · Rendimiento y ocupación",
    employees: "Directorio de empleados transportados",
    reports:   "Exportación a Excel · Filtros por fecha, ruta y sucursal",
  };

  // Group nav items
  const groups = [...new Set(NAV.map(n=>n.group))];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:FONT_BODY, color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#080b0f; }
        ::-webkit-scrollbar-thumb { background:#1e2a38; border-radius:3px; }
        input, select, button { font-family: inherit; }
        input:focus, select:focus { outline: 1px solid #00e5b3; }
        table tr:hover td { background: rgba(30,42,56,.4); }
      `}</style>

      {/* ─── SIDEBAR ─── */}
      <aside style={{
        width:220, background:C.surface, borderRight:`1px solid ${C.border}`,
        display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100,
      }}>
        {/* Logo */}
        <div style={{ padding:"18px 18px 14px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>
            <span style={{ color:C.accent }}>Trans</span>
            <span style={{ color:C.text }}>Log</span>
            <span style={{ fontSize:11, color:C.muted, marginLeft:6, fontFamily:FONT_MONO }}>v1.0</span>
          </div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", marginTop:3, fontFamily:FONT_MONO }}>
            Transporte Corporativo
          </div>
        </div>

        {/* Role toggle */}
        <div style={{ margin:"10px 14px", padding:"6px", background:C.surface2, borderRadius:8, border:`1px solid ${C.border}`, display:"flex", gap:4 }}>
          {[["coordinator","Coordinador"],["provider","Proveedor"]].map(([r,l])=>(
            <div key={r} onClick={()=>setRole(r)} style={{
              flex:1, textAlign:"center", padding:"5px 0", borderRadius:6,
              fontSize:10, fontFamily:FONT_MONO, cursor:"pointer",
              background: role===r ? C.surface3 : "transparent",
              color: role===r ? C.accent : C.muted,
              transition:"all .15s",
            }}>{l}</div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"4px 0", overflowY:"auto" }}>
          {groups.map(g => (
            <div key={g}>
              <div style={{ padding:"10px 16px 5px", fontSize:9, textTransform:"uppercase",
                letterSpacing:"1.5px", color:C.muted, fontFamily:FONT_MONO }}>{g}</div>
              {NAV.filter(n=>n.group===g).map(n => (
                <div key={n.id} onClick={()=>setPage(n.id)} style={{
                  display:"flex", alignItems:"center", gap:9,
                  padding:"8px 16px", fontSize:13, cursor:"pointer",
                  color: page===n.id ? C.accent : C.muted,
                  borderLeft: `3px solid ${page===n.id ? C.accent : "transparent"}`,
                  background: page===n.id ? "rgba(0,229,179,.06)" : "transparent",
                  fontWeight: page===n.id ? 600 : 400,
                  transition:"all .15s",
                }}>
                  <span style={{ fontSize:14, width:18, textAlign:"center" }}>{n.icon}</span>
                  <span style={{ flex:1 }}>{n.label}</span>
                  {n.badge && <span style={{ background:C.red, color:"#fff", fontSize:9, fontFamily:FONT_MONO,
                    padding:"1px 5px", borderRadius:10 }}>{n.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ width:32, height:32, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.accent},${C.purple})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:800, color:C.bg }}>CR</div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.text }}>Carlos Rivera</div>
            <div style={{ fontSize:10, color:C.muted }}>{role==="coordinator" ? "Coordinador Regional" : "Proveedor de Transporte"}</div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main style={{ marginLeft:220, flex:1, padding:24, minHeight:"100vh" }}>
        {/* Page header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:20, gap:16 }}>
          <div>
            <h1 style={{ fontFamily:FONT_DISPLAY, fontSize:24, fontWeight:800, letterSpacing:"-0.5px", color:C.text }}>
              {PAGE_TITLES[page]}
            </h1>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{PAGE_SUBS[page]}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            {page==="dashboard" && (
              <div style={{ display:"flex", background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:3, gap:2 }}>
                {["7D","MES","TRIM","AÑO"].map(p => (
                  <div key={p} onClick={()=>setPeriod(p)} style={{
                    padding:"5px 12px", borderRadius:6, fontSize:11,
                    cursor:"pointer", fontFamily:FONT_MONO,
                    background: period===p ? C.surface3 : "transparent",
                    color: period===p ? C.text : C.muted,
                    transition:"all .15s",
                  }}>{p}</div>
                ))}
              </div>
            )}
            {(page==="reports" || page==="dashboard") && (
              <Btn primary>⬇ Exportar</Btn>
            )}
            {page==="trips" && <Btn primary onClick={()=>{}}>+ Nuevo Viaje</Btn>}
            {page==="routes" && <Btn primary>+ Nueva Ruta</Btn>}
            {page==="employees" && <Btn primary>+ Empleado</Btn>}
          </div>
        </div>

        {/* Page content */}
        {page==="dashboard"  && <PageDashboard/>}
        {page==="trips"      && <PageTrips/>}
        {page==="checkin"    && <PageCheckin/>}
        {page==="routes"     && <PageRoutes/>}
        {page==="vehicles"   && <PageVehicles/>}
        {page==="employees"  && <PageEmployees/>}
        {page==="reports"    && <PageReports/>}
      </main>
    </div>
  );
}
