// ── Stats Cards ─────────────────────────────────────────────
let tStock = 0, tCap = 0, tRec = 0, tDisp = 0;
if (isGeneral) {
  tStock = DAILY_STATS.total_stock;
  tCap = DAILY_STATS.total_capacity;
  tRec = DAILY_STATS.today_received;
  tDisp = DAILY_STATS.today_dispatched;
} else {
  const mySilo = filteredSilos[0];
  tStock = mySilo.stock; // بالطن
  tCap = mySilo.cap;     // بالطن
  // r.net بالكيلوجرام، للتحويل إلى طن نقسم على 1000
  tRec = filteredReceipts.filter(r => r.type === 'استلام').reduce((acc, r) => acc + (r.net / 1000), 0);
  tDisp = filteredReceipts.filter(r => r.type === 'صرف').reduce((acc, r) => acc + (r.net / 1000), 0);
}

// تحويل إحصائيات الإدارة العامة من كجم إلى طن إن لزم
if (isGeneral) {
  tRec = tRec / 1000;
  tDisp = tDisp / 1000;
  DAILY_STATS.monthly_received = DAILY_STATS.monthly_received / 1000;
}

const stockPct = Math.round((tStock / tCap) * 100) || 0;
const statsData = [
  { icon:'fa-wheat-awn',    cls:'ic-gold',   label:'إجمالي المخزون الحالي',     val:Math.round(tStock),     unit:'طن', change:'', dir:'up' },
  { icon:'fa-building',     cls:'ic-blue',   label: isGeneral ? 'الصوامع النشطة' : 'سعة الصومعة', val: isGeneral ? DAILY_STATS.active_silos : Math.round(tCap), unit: isGeneral ? '' : 'طن', change:'', dir:'up' },
  { icon:'fa-arrow-down',   cls:'ic-green',  label:'الاستلام اليومي',            val:Math.round(tRec),  unit:'طن', change:'', dir:'up' },
  { icon:'fa-arrow-up',     cls:'ic-purple', label:'الصرف اليومي',               val:Math.round(tDisp), unit:'طن', change:'', dir:'down' },
  { icon:'fa-gauge',        cls:'ic-amber',  label:'نسبة الامتلاء',             val:stockPct, unit:'%',  change:'', dir:'up' },
  { icon:'fa-triangle-exclamation', cls:'ic-red', label:'تنبيهات مفتوحة',      val:openAlerts.length, unit:'', change:'', dir:'down' },
  { icon:'fa-wrench',       cls:'ic-cyan',   label:'صيانة جارية',               val:openMaint.length, unit:'', change:'', dir:'down' },
  { icon:'fa-chart-line',   cls:'ic-gold',   label:'الاستلام الشهري (تقريبي)',  val: isGeneral ? Math.round(DAILY_STATS.monthly_received) : Math.round(tRec*10), unit:'طن', change:'', dir:'up' },
];

const grid = document.getElementById('statsGrid');
statsData.forEach((s,i) => {
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.style.animationDelay = `${i * 0.07}s`;
  card.innerHTML = `
    <div class="stat-icon ${s.cls}"><i class="fa-solid ${s.icon}"></i></div>
    <div class="stat-body">
      <div class="stat-value"><span class="count-el" data-val="${s.val}">0</span><span class="unit">${s.unit}</span></div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change ${s.dir}">
        <i class="fa-solid ${s.dir === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
        ${s.change}
      </div>
    </div>`;
  grid.appendChild(card);
});

// Animate counts
document.querySelectorAll('.count-el').forEach(el => {
  animateCount(el, +el.dataset.val);
});

// ── Weekly Chart ─────────────────────────────────────────────
new Chart(document.getElementById('weeklyChart'), {
  type: 'bar',
  data: {
    labels: WEEKLY_CHART.labels,
    datasets: [
      { label:'استلام (طن)', data: WEEKLY_CHART.received,   backgroundColor:'rgba(34,197,94,0.7)',  borderRadius:6 },
      { label:'صرف (طن)',    data: WEEKLY_CHART.dispatched,  backgroundColor:'rgba(239,68,68,0.7)',   borderRadius:6 },
    ]
  },
  options: {
    responsive:true, maintainAspectRatio:false,
    plugins: { legend:{ labels:{ color:'#7a8ba8', font:{family:'Cairo',size:12} } } },
    scales: {
      x: { grid:{color:'#1a2d50'}, ticks:{color:'#7a8ba8', font:{family:'Cairo'}} },
      y: { grid:{color:'#1a2d50'}, ticks:{color:'#7a8ba8', font:{family:'Cairo'},
           callback: v => (v/1000).toFixed(0)+'K طن'} }
    }
  }
});

// ── Grain Donut Chart ─────────────────────────────────────────
new Chart(document.getElementById('grainChart'), {
  type: 'doughnut',
  data: {
    labels: GRAIN_DIST.labels,
    datasets: [{ data: GRAIN_DIST.data, backgroundColor: GRAIN_DIST.colors, borderWidth:0, hoverOffset:8 }]
  },
  options: {
    responsive:true, maintainAspectRatio:false, cutout:'60%',
    plugins: { legend:{display:false}, tooltip:{
      callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString('en-US')} طن` }
    }}
  }
});

// ملخص محلي / مستورد
if (typeof WHEAT_SUMMARY !== 'undefined') {
  const wb = document.getElementById('wheatSummaryBar');
  const totW = (WHEAT_SUMMARY.total_local + WHEAT_SUMMARY.total_imported) || 1;
  const lPct = Math.round(WHEAT_SUMMARY.total_local / totW * 100);
  const iPct = 100 - lPct;
  wb.innerHTML = `
    <div style="flex:1;background:rgba(253,224,71,0.1);border:1px solid rgba(253,224,71,0.3);border-radius:8px;padding:8px;text-align:center">
      <div style="font-size:0.7rem;color:#fde047">قمح محلي</div>
      <div style="font-size:1.1rem;font-weight:800;color:#fde047">${(WHEAT_SUMMARY.total_local/1000).toFixed(0)}K طن</div>
      <div style="font-size:0.7rem;color:#aaa">${lPct}%</div>
    </div>
    <div style="flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:8px;text-align:center">
      <div style="font-size:0.7rem;color:#60a5fa">قمح مستورد</div>
      <div style="font-size:1.1rem;font-weight:800;color:#60a5fa">${(WHEAT_SUMMARY.total_imported/1000).toFixed(0)}K طن</div>
      <div style="font-size:0.7rem;color:#aaa">${iPct}%</div>
    </div>
    <div style="flex:1;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:8px;text-align:center">
      <div style="font-size:0.7rem;color:#22c55e">ذرة</div>
      <div style="font-size:1.1rem;font-weight:800;color:#22c55e">${(WHEAT_SUMMARY.total_corn/1000).toFixed(0)}K طن</div>
    </div>
  `;
}

// Custom legend
const leg = document.getElementById('grainLegend');
GRAIN_DIST.labels.forEach((l,i) => {
  if (GRAIN_DIST.data[i] === 0) return;
  leg.innerHTML += `<div style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:#7a8ba8">
    <span style="width:9px;height:9px;border-radius:50%;background:${GRAIN_DIST.colors[i]};display:inline-block;flex-shrink:0"></span>
    ${l}: <strong style="color:#e8eaf0">${(GRAIN_DIST.data[i]/1000).toFixed(0)}K</strong>
  </div>`;
});
