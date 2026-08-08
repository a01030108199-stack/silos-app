
// ── Init ────────────────────────────────────────────────────
const user = Auth.require(['manager', 'general_admin']);
buildSidebar('dashboard');
document.getElementById('pageDate').textContent = todayDate();
initClock(document.getElementById('clockEl'));

const isGeneral = user.role === 'general_admin';
if (!isGeneral) {
  document.getElementById('pageTitle').textContent = `لوحة تحكم — ${user.name}`;
} else {
  document.getElementById('pageTitle').textContent = 'لوحة التحكم الرئيسية (الإدارة العامة)';
}

// ── Data Filtering ──────────────────────────────────────────
const filteredSilos = isGeneral ? SILOS : SILOS.filter(s => s.id === user.silo_id);
const filteredReceipts = isGeneral ? RECEIPTS : RECEIPTS.filter(r => r.silo_id === user.silo_id);
const filteredSec = isGeneral ? SECURITY : SECURITY.filter(s => s.silo_id === user.silo_id);
const filteredMaint = isGeneral ? MAINTENANCE : MAINTENANCE.filter(m => m.silo_id === user.silo_id);

const openAlerts = filteredSec.filter(s => s.status !== 'resolved');
const openMaint = filteredMaint.filter(m => m.status === 'in_progress' || m.status === 'pending');

document.getElementById('alertBadge').textContent = openAlerts.length;

// ── Real Data Calculation from Weighbridge ───────────────────
let tStock = 0, tCap = 0, tRec = 0, tDisp = 0;
let localStock = 0, importedStock = 0;
let monthlyRec = 0;

let liveTickets = [];
try {
  liveTickets = JSON.parse(localStorage.getItem('WEIGHBRIDGE_TICKETS') || '[]');
} catch(e) {}
const completedTickets = liveTickets.filter(t => t.status === 'completed');

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const todayIso = `${yyyy}-${mm}-${dd}`;
const currentMonthStr = `${yyyy}-${mm}`;

completedTickets.forEach(t => {
  const netTons = (t.net || 0) / 1000;
  
  if (t.opType === 'وارد' || t.opType === 'وارد (تفريغ)') {
    tStock += netTons;
    if (t.dateStr === todayIso) tRec += netTons;
    if (t.dateStr && t.dateStr.startsWith(currentMonthStr)) monthlyRec += netTons;
    
    if (t.grainType === 'محلي') localStock += netTons;
    else if (t.grainType === 'مستورد') importedStock += netTons;
    
  } else if (t.opType === 'صرف' || t.opType === 'منصرف (شحن)') {
    tStock -= netTons;
    if (t.dateStr === todayIso) tDisp += netTons;
    
    if (t.grainType === 'محلي') localStock -= netTons;
    else if (t.grainType === 'مستورد') importedStock -= netTons;
  }
});

if (isGeneral) {
  tCap = DAILY_STATS.total_capacity;
} else {
  tCap = filteredSilos[0] ? filteredSilos[0].cap : 60000;
}

// Ensure non-negative stocks for edge cases
tStock = Math.max(0, tStock);
localStock = Math.max(0, localStock);
importedStock = Math.max(0, importedStock);

const stockPct = Math.round((tStock / tCap) * 100) || 0;
const statsData = [
  { icon:'fa-wheat-awn',    cls:'ic-gold',   label:'إجمالي المخزون الحالي',     val:Math.round(tStock),     unit:'طن', change:'', dir:'up' },
  { icon:'fa-building',     cls:'ic-blue',   label: isGeneral ? 'الصوامع النشطة' : 'سعة الصومعة', val: isGeneral ? DAILY_STATS.active_silos : Math.round(tCap), unit: isGeneral ? '' : 'طن', change:'', dir:'up' },
  { icon:'fa-arrow-down',   cls:'ic-green',  label:'الاستلام اليومي',            val:Math.round(tRec),  unit:'طن', change:'', dir:'up' },
  { icon:'fa-arrow-up',     cls:'ic-purple', label:'الصرف اليومي',               val:Math.round(tDisp), unit:'طن', change:'', dir:'down' },
  { icon:'fa-gauge',        cls:'ic-amber',  label:'نسبة الامتلاء',             val:stockPct, unit:'%',  change:'', dir:'up' },
  { icon:'fa-triangle-exclamation', cls:'ic-red', label:'تنبيهات مفتوحة',      val:openAlerts.length, unit:'', change:'', dir:'down' },
  { icon:'fa-wrench',       cls:'ic-cyan',   label:'صيانة جارية',               val:openMaint.length, unit:'', change:'', dir:'down' },
  { icon:'fa-chart-line',   cls:'ic-gold',   label:'الاستلام الشهري (تقريبي)',  val: Math.round(monthlyRec), unit:'طن', change:'', dir:'up' },
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
const realWeeklyLabels = [];
const realWeeklyRec = [];
const realWeeklyDisp = [];

for (let i = 6; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const dayIso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
  realWeeklyLabels.push(dayName);
  
  const dayRec = completedTickets.filter(t => t.dateStr === dayIso && (t.opType === 'وارد' || t.opType === 'وارد (تفريغ)')).reduce((sum, t) => sum + ((t.net||0)/1000), 0);
  const dayDisp = completedTickets.filter(t => t.dateStr === dayIso && (t.opType === 'صرف' || t.opType === 'منصرف (شحن)')).reduce((sum, t) => sum + ((t.net||0)/1000), 0);
  
  realWeeklyRec.push(Math.round(dayRec));
  realWeeklyDisp.push(Math.round(dayDisp));
}

new Chart(document.getElementById('weeklyChart'), {
  type: 'bar',
  data: {
    labels: realWeeklyLabels,
    datasets: [
      { label:'استلام (طن)', data: realWeeklyRec,   backgroundColor:'rgba(34,197,94,0.7)',  borderRadius:6 },
      { label:'صرف (طن)',    data: realWeeklyDisp,  backgroundColor:'rgba(239,68,68,0.7)',   borderRadius:6 },
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
const realGrainLabels = ['قمح محلي', 'قمح مستورد', 'ذرة'];
const realGrainData = [Math.round(localStock), Math.round(importedStock), 0];
const realGrainColors = ['#fde047', '#3b82f6', '#22c55e'];

new Chart(document.getElementById('grainChart'), {
  type: 'doughnut',
  data: {
    labels: realGrainLabels,
    datasets: [{ data: realGrainData, backgroundColor: realGrainColors, borderWidth:0, hoverOffset:8 }]
  },
  options: {
    responsive:true, maintainAspectRatio:false, cutout:'60%',
    plugins: { legend:{display:false}, tooltip:{
      callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString('en-US')} طن` }
    }}
  }
});

// ملخص محلي / مستورد
const wb = document.getElementById('wheatSummaryBar');
const totW = (localStock + importedStock) || 1;
const lPct = Math.round(localStock / totW * 100);
const iPct = 100 - lPct;
wb.innerHTML = `
  <div style="flex:1;background:rgba(253,224,71,0.1);border:1px solid rgba(253,224,71,0.3);border-radius:8px;padding:8px;text-align:center">
    <div style="font-size:0.7rem;color:#fde047">قمح محلي</div>
    <div style="font-size:1.1rem;font-weight:800;color:#fde047">${localStock >= 1000 ? (localStock/1000).toFixed(1) + 'K' : Math.round(localStock)} طن</div>
    <div style="font-size:0.7rem;color:#aaa">${lPct}%</div>
  </div>
  <div style="flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:8px;text-align:center">
    <div style="font-size:0.7rem;color:#60a5fa">قمح مستورد</div>
    <div style="font-size:1.1rem;font-weight:800;color:#60a5fa">${importedStock >= 1000 ? (importedStock/1000).toFixed(1) + 'K' : Math.round(importedStock)} طن</div>
    <div style="font-size:0.7rem;color:#aaa">${iPct}%</div>
  </div>
  <div style="flex:1;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:8px;text-align:center">
    <div style="font-size:0.7rem;color:#22c55e">ذرة</div>
    <div style="font-size:1.1rem;font-weight:800;color:#22c55e">0 طن</div>
  </div>
`;

// Custom legend
const leg = document.getElementById('grainLegend');
leg.innerHTML = '';
realGrainLabels.forEach((l,i) => {
  if (realGrainData[i] === 0) return;
  leg.innerHTML += `<div style="display:flex;align-items:center;gap:5px;font-size:0.72rem;color:#7a8ba8">
    <span style="width:9px;height:9px;border-radius:50%;background:${realGrainColors[i]};display:inline-block;flex-shrink:0"></span>
    ${l}: <strong style="color:#e8eaf0">${realGrainData[i] >= 1000 ? (realGrainData[i]/1000).toFixed(1) + 'K' : Math.round(realGrainData[i])}</strong>
  </div>`;
});

// ── Region Chart ──────────────────────────────────────────────
const regGrid = document.getElementById('regionsGrid');
if (!isGeneral) {
  document.getElementById('regionChart').parentElement.style.display = 'none'; // Hide region distribution for single silo
} else {
  REGIONS.forEach((r,i) => {
    const silosInRegion = SILOS.filter(s => s.rid === r.id);
    const totalCap  = silosInRegion.reduce((a,s) => a+s.cap, 0);
    const totalStk  = silosInRegion.reduce((a,s) => a+s.stock, 0);
    regGrid.innerHTML += `
      <div class="region-card" style="border-color:${r.color}33">
        <div class="region-dot" style="color:${r.color};background:${r.color}"></div>
        <div class="region-name" style="color:${r.color}">${r.name}</div>
        <div class="region-count" style="color:${r.color}">${silosInRegion.length} صوامع</div>
        <div class="region-stock-val">${(totalStk/1000).toFixed(0)}K / ${(totalCap/1000).toFixed(0)}K طن</div>
      </div>`;
  });
}

new Chart(document.getElementById('regionChart'), {
  type: 'bar',
  data: {
    labels: REGION_STOCK.labels,
    datasets: [{ label:'المخزون (طن)', data: REGION_STOCK.data,
      backgroundColor: REGION_STOCK.colors.map(c => c+'bb'), borderRadius:6 }]
  },
  options: {
    responsive:true, maintainAspectRatio:false, indexAxis:'y',
    plugins:{ legend:{display:false} },
    scales: {
      x:{ grid:{color:'#1a2d50'}, ticks:{color:'#7a8ba8', font:{family:'Cairo'},
          callback: v => (v/1000).toFixed(0)+'K'} },
      y:{ grid:{color:'transparent'}, ticks:{color:'#e8eaf0', font:{family:'Cairo',size:12}} }
    }
  }
});

// ── Alerts ────────────────────────────────────────────────────
const aList = document.getElementById('alertsList');
if (openAlerts.length === 0) {
  aList.innerHTML = '<div style="padding:20px;text-align:center;color:#7a8ba8">لا توجد تنبيهات عاجلة</div>';
} else {
  openAlerts.forEach(a => {
    aList.innerHTML += `
      <div class="alert-item ${a.severity}">
        <div class="alert-icon"><i class="fa-solid fa-shield"></i></div>
        <div>
          <div class="alert-title">${a.type} — ${siloName(a.silo_id)}</div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-time"><i class="fa-regular fa-clock"></i> ${a.date}</div>
        </div>
      </div>`;
  });
}

// ── Recent Operations ─────────────────────────────────────────
const tbody = document.getElementById('recentOpsBody');
if (filteredReceipts.length === 0) {
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">لا توجد عمليات</td></tr>';
} else {
  filteredReceipts.slice(0,8).forEach(r => {
    const qBadge = r.quality === 'A' ? 'badge-success' : r.quality === 'B' ? 'badge-warning' : 'badge-danger';
    const tBadge = r.type === 'استلام' ? 'badge-success' : 'badge-purple';
    tbody.innerHTML += `
      <tr>
        <td class="fw-bold text-info">${r.id}</td>
        <td>${siloName(r.silo_id)}</td>
        <td><span class="badge ${tBadge}">${r.type}</span></td>
        <td>${r.grain}</td>
        <td class="fw-bold">${formatNum(r.net)}</td>
        <td><span class="badge ${qBadge}">${r.quality || '—'}</span></td>
        <td class="text-sec">${r.date}</td>
      </tr>`;
  });
}

// ── Maintenance Table ─────────────────────────────────────────
const mb = document.getElementById('maintBody');
if (openMaint.length === 0) {
  mb.innerHTML = '<tr><td colspan="6" style="text-align:center">لا توجد طلبات صيانة</td></tr>';
} else {
  openMaint.slice(0,5).forEach(m => {
    mb.innerHTML += `
      <tr>
        <td class="fw-bold text-warning">${m.id}</td>
        <td>${siloName(m.silo_id)}</td>
        <td>${m.equip}</td>
        <td>${severityBadge(m.priority)}</td>
        <td>${maintenanceBadge(m.status)}</td>
        <td class="text-sec">${m.date}</td>
      </tr>`;
  });
}

function scrollToAlerts() {
  document.getElementById('alertsSection').scrollIntoView({behavior:'smooth'});
}

// --- Security Alert & Maintenance Handlers ---

// --- Approvals Logic ---
function loadApprovals() {
  const approvalsBody = document.getElementById('approvalsBody');
  if (!approvalsBody) return;
  
  let approvals = JSON.parse(localStorage.getItem('PENDING_APPROVALS') || '[]');
  approvals = approvals.filter(a => a.status === 'pending');
  
  if (!isGeneral) {
    approvals = approvals.filter(a => a.silo_id === user.silo_id);
  }
  
  if (approvals.length === 0) {
    approvalsBody.innerHTML = '<tr><td colspan="7" class="text-center p-3 text-muted">لا توجد طلبات معلقة</td></tr>';
    return;
  }
  
  let html = '';
  approvals.forEach(a => {
    const typeLabel = a.type === 'delete' 
      ? '<span class="badge badge-danger">شطب</span>' 
      : '<span class="badge badge-warning">تعديل</span>';
      
    const details = a.type === 'edit' 
      ? `<b>السبب:</b> ${a.reason}<br><b>التعديلات:</b> ${a.editDesc}`
      : `<b>السبب:</b> ${a.reason}`;
      
    html += `
      <tr>
        <td class="text-info fw-bold">${a.id}</td>
        <td class="fw-bold">${a.plate} <span class="badge badge-info" style="font-size:0.7rem">${a.opType} ${a.grainType}</span></td>
        <td>${typeLabel}</td>
        <td>${a.requestedBy}</td>
        <td style="font-size:0.85rem">${details}</td>
        <td style="font-size:0.85rem">${a.timestamp}</td>
        <td>
          <button class="btn btn-sm btn-success mb-1" onclick="handleApproval('${a.id}', true)"><i class="fa-solid fa-check"></i> موافقة</button>
          <button class="btn btn-sm btn-danger" onclick="handleApproval('${a.id}', false)"><i class="fa-solid fa-xmark"></i> رفض</button>
        </td>
      </tr>
    `;
  });
  
  approvalsBody.innerHTML = html;
}


function handleApproval(reqId, isApproved) {
  var approvals = JSON.parse(localStorage.getItem('PENDING_APPROVALS') || '[]');
  var idx = -1;
  for (var i = 0; i < approvals.length; i++) {
    if (approvals[i].id === reqId) { idx = i; break; }
  }
  if (idx === -1) return;
  var req = approvals[idx];
  var tickets = JSON.parse(localStorage.getItem('WEIGHBRIDGE_TICKETS') || '[]');
  var tIdx = -1;
  for (var j = 0; j < tickets.length; j++) {
    if (tickets[j].id === req.ticketId) { tIdx = j; break; }
  }
  if (!isApproved) {
    if (tIdx > -1) {
      tickets[tIdx].status = tickets[tIdx].net > 0 ? 'completed' : 'gate_in';
      localStorage.setItem('WEIGHBRIDGE_TICKETS', JSON.stringify(tickets));
    }
    approvals[idx].status = 'rejected';
    approvals[idx].resolvedAt = new Date().toLocaleString('ar-EG');
    approvals[idx].resolvedBy = user.name;
    localStorage.setItem('PENDING_APPROVALS', JSON.stringify(approvals));
    showToast('تم رفض الطلب وعادت السيارة لوضعها الطبيعي', 'info');
    loadApprovals();
    return;
  }
  if (req.type === 'delete') {
    if (tIdx > -1) {
      tickets[tIdx].status = 'stricken';
      tickets[tIdx].strikeReason = req.reason;
      tickets[tIdx].strickenAt = new Date().toLocaleString('ar-EG');
      tickets[tIdx].strickenBy = user.name;
      localStorage.setItem('WEIGHBRIDGE_TICKETS', JSON.stringify(tickets));
    }
    approvals[idx].status = 'approved';
    approvals[idx].resolvedAt = new Date().toLocaleString('ar-EG');
    approvals[idx].resolvedBy = user.name;
    localStorage.setItem('PENDING_APPROVALS', JSON.stringify(approvals));
    showToast('تم الموافقة على الشطب بنجاح', 'success');
    loadApprovals();
  } else {
    if (tIdx === -1) { showToast('لم يتم العثور على السجل!', 'error'); return; }
    var t = tickets[tIdx];
    window._editReqId = reqId;
    window._editTIdx  = tIdx;
    var plate = t.plate ? t.plate : '';
    var driver = t.driver ? t.driver : '';
    var supplier = t.supplierName ? t.supplierName : '';
    var ticketNum = t.ticketNum ? t.ticketNum : '';
    var transport = t.transportCompany ? t.transportCompany : '';
    var dest = t.destination ? t.destination : '';
    var editDesc = req.editDesc ? req.editDesc : '';
    var reason = req.reason ? req.reason : '';

    var allTix = JSON.parse(localStorage.getItem('WEIGHBRIDGE_TICKETS') || '[]');
    var uShips = [...new Set(allTix.map(x => x.shipName).filter(Boolean))];
    var uSupp = [...new Set(allTix.map(x => x.supplierName).filter(Boolean))];
    var uDest = [...new Set(allTix.map(x => x.destination).filter(Boolean))];
    var uTrans = [...new Set(allTix.map(x => x.transportCompany).filter(Boolean))];
    var uWheat = [...new Set(allTix.map(x => x.wheatType).filter(Boolean))];
    var uDrivers = [...new Set(allTix.map(x => x.driver).filter(Boolean))];
    var uOrders = [...new Set(allTix.map(x => x.orderNo).filter(Boolean))];

    var datalists = '<datalist id="dl_ships">' + uShips.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_supp">' + uSupp.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_dest">' + uDest.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_trans">' + uTrans.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_wheat">' + uWheat.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_orders">' + uOrders.map(s => '<option value="'+s+'">').join('') + '</datalist>' +
                    '<datalist id="dl_drivers">' + uDrivers.map(s => '<option value="'+s+'">').join('') + '</datalist>';

    var fHtml = datalists + '<div style="background:rgba(234,179,8,0.1);border:1px solid #ca8a04;border-radius:8px;padding:10px;margin-bottom:14px;font-size:0.85rem;">' +
      '<b>الطلب المقدم:</b> ' + editDesc + '<br><b>السبب:</b> ' + reason +
    '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;max-height:60vh;overflow-y:auto;padding-right:5px;">';
    fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">رقم السيارة</label><input type="text" id="eq_plate" class="inp" value="' + plate + '"></div>';
    fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">اسم السائق</label><input type="text" id="eq_driver" class="inp" list="dl_drivers" value="' + driver + '"></div>';
    if (t.opType === 'وارد' && t.grainType === 'محلي') {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">جهة الوارد</label><input type="text" id="eq_supplier" class="inp" list="dl_supp" value="' + supplier + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">درجة القمح</label><input type="text" id="eq_grade" class="inp" value="' + (t.grade||'') + '"></div>';
    }
    if (t.opType === 'وارد' && t.grainType === 'مستورد') {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الميناء الشاحن</label><input type="text" id="eq_supplier" class="inp" list="dl_supp" value="' + supplier + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">رقم الكارتة</label><input type="text" id="eq_ticket" class="inp" value="' + ticketNum + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الشركة الناقلة</label><input type="text" id="eq_transport" class="inp" list="dl_trans" value="' + transport + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">نوع القمح (منشأ)</label><input type="text" id="eq_wheat_type" class="inp" list="dl_wheat" value="' + (t.wheatType||'') + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">اسم الباخرة</label><input type="text" id="eq_ship_name" class="inp" list="dl_ships" value="' + (t.shipName||'') + '"></div>';
    }
    if (t.opType === 'صرف') {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الجهة المنصرف</label><input type="text" id="eq_dest" class="inp" list="dl_dest" value="' + dest + '"></div>';
      if (t.grainType === 'مستورد') {
        fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">اسم الباخرة</label><input type="text" id="eq_ship_name" class="inp" list="dl_ships" value="' + (t.shipName||'') + '"></div>';
        fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">نوع القمح (منشأ)</label><input type="text" id="eq_wheat_type" class="inp" list="dl_wheat" value="' + (t.wheatType||'') + '"></div>';
      } else if (t.grainType === 'محلي') {
        fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">درجة القمح</label><input type="text" id="eq_grade" class="inp" value="' + (t.grade||'') + '"></div>';
      }
      
      var ordersDb = JSON.parse(localStorage.getItem('DISPENSE_ORDERS') || '{}');
      var oData = t.orderNo ? (ordersDb[t.orderNo] || {}) : {};
      
      fHtml += '<div style="grid-column: 1 / -1; background: rgba(33,150,243,0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(33,150,243,0.3); margin-top: 10px;">';
      fHtml += '<div style="margin-bottom:15px; font-weight:bold; color:#90caf9;"><i class="fa-solid fa-file-invoice"></i> بيانات إذن الصرف</div>';
      fHtml += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">';
      
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">رقم إذن الصرف</label><input type="text" id="eq_order_no" class="inp" list="dl_orders" value="' + (t.orderNo||'') + '" onblur="if(this.value){var db=JSON.parse(localStorage.getItem(\'DISPENSE_ORDERS\')||\'{}\');var d=db[this.value];if(d){var _ex=document.getElementById(\'eq_order_expiry\');if(_ex)_ex.value=d.expiry||\'\';var _q=document.getElementById(\'eq_order_qty\');if(_q)_q.value=d.qty||\'\';var _b=document.getElementById(\'eq_order_bonus\');if(_b)_b.value=d.bonus||\'\';}}"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">تاريخ الانتهاء</label><input type="date" id="eq_order_expiry" class="inp" value="' + (oData.expiry||'') + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الكمية الأساسية (بالطن)</label><input type="number" id="eq_order_qty" class="inp" value="' + (oData.qty||'') + '"></div>';
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">التعزيز بالطن (إن وُجد)</label><input type="number" id="eq_order_bonus" class="inp" value="' + (oData.bonus||'') + '"></div>';
      
      fHtml += '</div></div>';
    }
    
    // Additional weighbridge fields
    if (t.gross !== undefined) {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الوزن القائم (كجم)</label><input type="number" id="eq_gross" class="inp" value="' + t.gross + '"></div>';
    }
    if (t.tare !== undefined) {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">الوزن الفارغ (كجم)</label><input type="number" id="eq_tare" class="inp" value="' + t.tare + '"></div>';
    }
    if (t.cell !== undefined) {
      fHtml += '<div><label style="font-size:0.82rem;color:#94a3b8;display:block;margin-bottom:4px;">رقم الخلية</label><input type="text" id="eq_cell" class="inp" value="' + t.cell + '"></div>';
    }

    fHtml += '</div><div style="display:flex;justify-content:flex-end;gap:10px;">';
    fHtml += '<button class="btn btn-outline" onclick="closeModal(\'editApproveModal\')">إلغاء</button>';
    fHtml += '<button class="btn btn-success" onclick="applyEditApproval()"><i class="fa-solid fa-check"></i> حفظ وموافقة</button></div>';
    showModal('editApproveModal', 'تطبيق التعديل — سجل: ' + plate, fHtml);
  }
}

function applyEditApproval() {
  var approvals = JSON.parse(localStorage.getItem('PENDING_APPROVALS') || '[]');
  var tickets   = JSON.parse(localStorage.getItem('WEIGHBRIDGE_TICKETS') || '[]');
  var tIdx = window._editTIdx;
  var reqId = window._editReqId;
  var t = tickets[tIdx];
  var p  = document.getElementById('eq_plate');
  var d  = document.getElementById('eq_driver');
  var s  = document.getElementById('eq_supplier');
  var tk = document.getElementById('eq_ticket');
  var tr = document.getElementById('eq_transport');
  var dt = document.getElementById('eq_dest');
  
  var gr = document.getElementById('eq_gross');
  var ta = document.getElementById('eq_tare');
  var ce = document.getElementById('eq_cell');

  if (p  && p.value.trim())  t.plate            = p.value.trim();
  if (d  && d.value.trim())  t.driver           = d.value.trim();
  if (s  && s.value.trim())  t.supplierName     = s.value.trim();
  if (tk && tk.value.trim()) t.ticketNum        = tk.value.trim();
  if (tr && tr.value.trim()) t.transportCompany = tr.value.trim();
  if (dt && dt.value.trim()) t.destination      = dt.value.trim();
  
  var wt = document.getElementById('eq_wheat_type');
  var sn = document.getElementById('eq_ship_name');
  var gd = document.getElementById('eq_grade');
  var on = document.getElementById('eq_order_no');
  if (wt) t.wheatType = wt.value.trim();
  if (sn) t.shipName = sn.value.trim();
  if (gd) t.grade = gd.value.trim();
  if (on) {
    t.orderNo = on.value.trim();
    if (t.orderNo) {
      var ordersDb = JSON.parse(localStorage.getItem('DISPENSE_ORDERS') || '{}');
      ordersDb[t.orderNo] = {
        expiry: document.getElementById('eq_order_expiry') ? document.getElementById('eq_order_expiry').value : '',
        qty: parseFloat(document.getElementById('eq_order_qty') ? document.getElementById('eq_order_qty').value : 0) || 0,
        bonus: parseFloat(document.getElementById('eq_order_bonus') ? document.getElementById('eq_order_bonus').value : 0) || 0
      };
      localStorage.setItem('DISPENSE_ORDERS', JSON.stringify(ordersDb));
    }
  }

  if (gr && gr.value) { t.gross = parseFloat(gr.value); }
  if (ta && ta.value) { t.tare = parseFloat(ta.value); }
  if (ce && ce.value) { t.cell = ce.value.trim(); }
  if (t.gross !== undefined && t.tare !== undefined) { t.net = t.gross - t.tare; }

  t.status = t.net > 0 ? 'completed' : 'gate_in';
  t.lastEditedAt = new Date().toLocaleString('ar-EG');
  t.lastEditedBy = user.name;
  tickets[tIdx] = t;
  localStorage.setItem('WEIGHBRIDGE_TICKETS', JSON.stringify(tickets));
  for (var i = 0; i < approvals.length; i++) {
    if (approvals[i].id === reqId) {
      approvals[i].status = 'approved';
      approvals[i].resolvedAt = new Date().toLocaleString('ar-EG');
      approvals[i].resolvedBy = user.name;
      break;
    }
  }
  localStorage.setItem('PENDING_APPROVALS', JSON.stringify(approvals));
  closeModal('editApproveModal');
  showToast('تم تطبيق التعديل والموافقة بنجاح', 'success');
  loadApprovals();
}

loadApprovals();

