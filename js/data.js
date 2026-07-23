// ============================================================
// js/data.js — بيانات شاملة لنظام إدارة الصوامع
// الشركة المصرية القابضة للصوامع والتخزين (48 صومعة)
// ============================================================

const DB_VERSION = '48_SILOS_V8';



// ── التوزيع الجغرافي ─────────────────────────────────────
const REGIONS = [
  { id: 1, name: 'وجه بحري', color: '#3b82f6' },
  { id: 2, name: 'وجه قبلي', color: '#f59e0b' },
  { id: 3, name: 'صوامع الموانئ', color: '#10b981' }
];

// ── توليد 48 صومعة واقعية ────────────────────────────────
const SILO_DATA = [
  // وجه بحري
  { name: 'الصباحية', gov: 'الإسكندرية', r: 1 }, { name: 'برج العرب', gov: 'الإسكندرية', r: 1 }, { name: 'كينج مريوط', gov: 'الإسكندرية', r: 1 },
  { name: 'القنطرة شرق', gov: 'الإسماعيلية', r: 1 }, { name: 'أبو صوير', gov: 'الإسماعيلية', r: 1 },
  { name: 'دمنهور', gov: 'البحيرة', r: 1 }, { name: 'النوبارية', gov: 'البحيرة', r: 1 }, { name: 'أبو المطامير', gov: 'البحيرة', r: 1 }, { name: 'وادي النطرون', gov: 'البحيرة', r: 1 }, { name: 'حوش عيسى', gov: 'البحيرة', r: 1 },
  { name: 'شربين', gov: 'الدقهلية', r: 1 }, { name: 'ميت غمر', gov: 'الدقهلية', r: 1 }, { name: 'بني عبيد', gov: 'الدقهلية', r: 1 }, { name: 'السنبلاوين', gov: 'الدقهلية', r: 1 },
  { name: 'بنها', gov: 'القليوبية', r: 1 }, { name: 'طوخ', gov: 'القليوبية', r: 1 }, { name: 'شبلنجة', gov: 'القليوبية', r: 1 },
  { name: 'كفر داوود', gov: 'المنوفية', r: 1 }, { name: 'منوف', gov: 'المنوفية', r: 1 }, { name: 'قويسنا', gov: 'المنوفية', r: 1 },
  { name: 'سيدي سالم', gov: 'كفر الشيخ', r: 1 }, { name: 'دسوق', gov: 'كفر الشيخ', r: 1 }, { name: 'كفر الشيخ المركزية', gov: 'كفر الشيخ', r: 1 },
  { name: 'طنطا', gov: 'الغربية', r: 1 }, { name: 'السنطة', gov: 'الغربية', r: 1 },
  { name: 'الزقازيق', gov: 'الشرقية', r: 1 }, { name: 'أبو حماد', gov: 'الشرقية', r: 1 }, { name: 'الصالحية', gov: 'الشرقية', r: 1 },
  // وجه قبلي
  { name: 'برقاش', gov: 'الجيزة', r: 2 }, { name: 'أطفيح', gov: 'الجيزة', r: 2 },
  { name: 'قصر الباسل', gov: 'الفيوم', r: 2 }, { name: 'طامية', gov: 'الفيوم', r: 2 }, { name: 'إطسا', gov: 'الفيوم', r: 2 },
  { name: 'كوم أبو راضي', gov: 'بني سويف', r: 2 }, { name: 'سدس', gov: 'بني سويف', r: 2 },
  { name: 'بني مزار', gov: 'المنيا', r: 2 }, { name: 'المنيا الجديدة', gov: 'المنيا', r: 2 }, { name: 'الشيخ فضل', gov: 'المنيا', r: 2 }, { name: 'البهنسا', gov: 'المنيا', r: 2 },
  { name: 'أبنوب', gov: 'أسيوط', r: 2 }, { name: 'عرب العوامر', gov: 'أسيوط', r: 2 },
  { name: 'طهطا', gov: 'سوهاج', r: 2 }, { name: 'سوهاج الجديدة', gov: 'سوهاج', r: 2 },
  { name: 'المراشدة', gov: 'قنا', r: 2 }, { name: 'الترامسة', gov: 'قنا', r: 2 },
  { name: 'شرق العوينات', gov: 'الوادي الجديد', r: 2 }, { name: 'المفالسة', gov: 'أسوان', r: 2 },
  // موانئ
  { name: 'ميناء دمياط', gov: 'دمياط', r: 3 }, { name: 'سفاجا', gov: 'البحر الأحمر', r: 3 }, { name: 'ميناء الإسكندرية', gov: 'الإسكندرية', r: 3 }
].slice(0, 48);

const SILOS = [];
const USERS = [
  { id: 1, name: 'الإدارة العامة', role: 'general_admin', username: 'admin', password: '123', silo_id: null }
];
const RECEIPTS = [];

// Seed RNG
let seed = 12345;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

let siloIdCounter = 1;
for (const s of SILO_DATA) {
  const cap = 60000; // تم توحيد طاقة كل الصوامع لتكون 60,000 (12 خلية × 5000) بناء على طلب العميل

  // توزيع المخزون بين قمح محلي ومستورد
  // صوامع الموانئ لديها نسبة مستورد أعلى
  const importRatio = s.r === 3 ? 0.7 : (0.2 + random() * 0.4);
  const localRatio  = 1 - importRatio;

  const totalWheat = Math.floor(cap * (0.4 + random() * 0.3));
  const totalLocal    = Math.floor(totalWheat * localRatio);
  const totalImported = totalWheat - totalLocal;

  // قمح محلي حسب الدرجات
  const local_235 = Math.floor(totalLocal * (0.4 + random() * 0.2));
  const local_230 = Math.floor(totalLocal * (0.3 + random() * 0.1));
  const local_225 = Math.max(0, totalLocal - local_235 - local_230);

  // قمح مستورد حسب الدولة — توزيع عشوائي
  const iShare = [random(), random(), random(), random(), random(), random()];
  const iTotal = iShare.reduce((a,b)=>a+b, 0);
  const imp_russia    = Math.floor(totalImported * iShare[0] / iTotal);
  const imp_ukraine   = Math.floor(totalImported * iShare[1] / iTotal);
  const imp_france    = Math.floor(totalImported * iShare[2] / iTotal);
  const imp_usa       = Math.floor(totalImported * iShare[3] / iTotal);
  const imp_australia = Math.floor(totalImported * iShare[4] / iTotal);
  const imp_romania   = Math.max(0, totalImported - imp_russia - imp_ukraine - imp_france - imp_usa - imp_australia);

  const corn   = Math.floor(cap * (0.05 + random() * 0.08));
  const barley = 0;
  const wheat  = totalWheat;
  const stock  = wheat + corn + barley;

  SILOS.push({
    id: siloIdCounter, rid: s.r, name: 'صومعة ' + s.name, gov: s.gov, code: `S-${siloIdCounter.toString().padStart(3,'0')}`,
    cap, stock, wheat, corn, barley, status: 'active',
    // تفاصيل القمح
    local_235, local_230, local_225,
    imp_russia, imp_ukraine, imp_france, imp_usa, imp_australia, imp_romania,
    total_local: totalLocal, total_imported: totalImported
  });

  let baseId = siloIdCounter * 10;
  USERS.push(
    { id: baseId + 1, name: `مدير صومعة ${s.name}`, role: 'manager', username: `mgr_${siloIdCounter}`, password: '123', silo_id: siloIdCounter },
    { id: baseId + 2, name: `إدارة الميزان - صومعة ${s.name}`, role: 'scale', username: `scale_${siloIdCounter}`, password: '123', silo_id: siloIdCounter },
    { id: baseId + 3, name: `إدارة الأمن - صومعة ${s.name}`, role: 'security', username: `sec_${siloIdCounter}`, password: '123', silo_id: siloIdCounter },
    { id: baseId + 4, name: `الشئون المالية - صومعة ${s.name}`, role: 'finance', username: `fin_${siloIdCounter}`, password: '123', silo_id: siloIdCounter },
    { id: baseId + 5, name: `الصيانة - صومعة ${s.name}`, role: 'maintenance', username: `maint_${siloIdCounter}`, password: '123', silo_id: siloIdCounter }
  );

  siloIdCounter++;
}

// ── توليد حركات الاستلام والصرف من 1 إلى 18 يوليو 2026 ──
let rcpId = 1;
for (const silo of SILOS) {
  let currentWheat = silo.wheat;
  let currentCorn = silo.corn;
  
  for (let day = 1; day <= 18; day++) {
    const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
    const numReceipts = Math.floor(random() * 5) + 2; // 2 to 6 receipts/day per silo
    
    for (let j = 0; j < numReceipts; j++) {
      const isImported = silo.rid === 3 ? true : random() > 0.8;
      const grain = random() > 0.2 ? 'قمح' : 'ذرة';
      const type = random() > 0.4 ? 'استلام' : 'صرف';
      const netTon = Math.floor(random() * 30) + 15;
      const tare = 12000;
      const net = netTon * 1000;
      const gross = tare + net;
      
      if (type === 'صرف') {
        if (grain === 'قمح' && currentWheat < netTon) continue;
        if (grain === 'ذرة' && currentCorn < netTon) continue;
      }
      if (type === 'استلام') {
        if (grain === 'قمح') currentWheat += netTon; else currentCorn += netTon;
      } else {
        if (grain === 'قمح') currentWheat -= netTon; else currentCorn -= netTon;
      }
      
      RECEIPTS.push({
        id: `RCP-2607-${rcpId.toString().padStart(5, '0')}`,
        silo_id: silo.id,
        date: dateStr,
        timestamp: `${dateStr} ${Math.floor(8 + random()*10)}:${Math.floor(random()*60).toString().padStart(2,'0')}`,
        type: type, grain: grain,
        supplier: isImported ? 'باخرة أجنبية' : 'مورد محلي',
        gov_sup: silo.gov,
        plate: 'ب أ ن ' + Math.floor(1000 + random() * 9000),
        driver: 'سائق ' + Math.floor(random() * 100),
        gross: gross, tare: tare, net: net,
        quality: ['A', 'B', 'C'][Math.floor(random() * 3)],
        moisture: (10 + random() * 4).toFixed(1),
        impurity: (0.5 + random() * 2).toFixed(1),
        operator: `مشغل ${silo.name}`, status: 'مكتمل'
      });
      rcpId++;
    }
  }
  silo.wheat = Math.max(0, currentWheat);
  silo.corn = Math.max(0, currentCorn);
  silo.stock = silo.wheat + silo.corn + silo.barley;
}

const SECURITY = [
  { id:'SEC-003', silo_id: 1, date:'2026-07-18 16:30', type:'إنذار سيبراني', desc:'محاولة ولوج غير معتادة للنظام، تم حجب الـ IP تلقائياً وإرسال إشعار عاجل للإدارة العامة للتحقيق والمتابعة.', severity:'critical', status:'open', reporter:'نظام الأمن السيبراني', guard:'وحدة المراقبة الآلية' },
  { id:'SEC-004', silo_id: 8, date:'2026-07-18 18:05', type:'تكدس مروري للشاحنات', desc:'تكدس مفاجئ لسيارات التوريد خارج أسوار صومعة أبو المطامير؛ يُرجى من الإدارة العامة توجيه السائقين لصوامع بديلة.', severity:'high', status:'open', reporter:'أمن البوابات', guard:'سيد متولي' },
  { id:'SEC-001', silo_id: 2, date:'2026-07-12 08:30', type:'محاولة دخول غير مصرح', desc:'شخص حاول الدخول من البوابة الخلفية وتم منعه', severity:'high', status:'resolved', reporter:'الأمن', guard:'نبيل عبدالله' },
  { id:'SEC-002', silo_id: 15, date:'2026-07-18 10:15', type:'تعطل بوابة رئيسية', desc:'البوابة الرئيسية عالقة', severity:'medium', status:'investigating', reporter:'الأمن', guard:'حسام علي' },
];

const MAINTENANCE = [
  { id:'MNT-001', silo_id: 2, date:'2026-07-12', equip:'ناقل حبوب', problem:'قطع في السير بطامية', priority:'critical', status:'in_progress', req_by:'الصيانة', assigned:'شركة خارجية', cost:8500 },
];

const FINANCE = [];

// Calculate Global Stats
let _totStock = 0, _totCap = 0, _tdRec = 0, _tdDisp = 0, _moRec = 0;
SILOS.forEach(s => { _totStock += s.stock; _totCap += s.cap; });

// 18 يوليو هو اليوم الحالي كاختبار
RECEIPTS.forEach(r => {
  if (r.date === '2026-07-18') {
    if (r.type === 'استلام') _tdRec += r.net;
    else _tdDisp += r.net;
  }
  if (r.type === 'استلام' && r.date.startsWith('2026-07')) {
    _moRec += r.net;
  }
});

const DAILY_STATS = {
  total_stock: _totStock, total_capacity: _totCap, today_received: _tdRec, today_dispatched: _tdDisp,
  active_silos: SILOS.length, maintenance_silos: 1, open_alerts: 1, monthly_received: _moRec,
};

const WEEKLY_CHART = {
  labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  received:   [15000, 18000, 22000, 12000, 20000, 38000, Math.floor(_tdRec/1000)],
  dispatched: [5000,  8000,  6000,  5000,  8000,  16000, Math.floor(_tdDisp/1000)],
};

const REGION_STOCK = {
  labels: ['وجه بحري', 'وجه قبلي', 'صوامع الموانئ'],
  data: [
    SILOS.filter(s=>s.rid===1).reduce((sum,s)=>sum+s.stock,0),
    SILOS.filter(s=>s.rid===2).reduce((sum,s)=>sum+s.stock,0),
    SILOS.filter(s=>s.rid===3).reduce((sum,s)=>sum+s.stock,0)
  ],
  colors: ['#3b82f6', '#f59e0b', '#10b981'],
};

// توزيع الحبوب التفصيلي (قمح محلي بالدرجات + مستورد بالدول + ذرة)
const GRAIN_DIST = {
  labels: [
    'قمح محلي 23.5 قيراط',
    'قمح محلي 23 قيراط',
    'قمح محلي 22.5 قيراط',
    'مستورد روسي',
    'مستورد أوكراني',
    'مستورد فرنسي',
    'مستورد أمريكي',
    'مستورد أسترالي',
    'مستورد روماني',
    'ذرة',
  ],
  data: [
    SILOS.reduce((s,x)=>s+(x.local_235||0),0),
    SILOS.reduce((s,x)=>s+(x.local_230||0),0),
    SILOS.reduce((s,x)=>s+(x.local_225||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_russia||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_ukraine||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_france||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_usa||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_australia||0),0),
    SILOS.reduce((s,x)=>s+(x.imp_romania||0),0),
    SILOS.reduce((s,x)=>s+(x.corn||0),0),
  ],
  colors: [
    '#fde047','#fbbf24','#f59e0b',              // محلي بدرجات
    '#3b82f6','#60a5fa','#93c5fd','#1d4ed8','#2563eb','#6366f1',  // مستورد بالدول
    '#22c55e'                                   // ذرة
  ],
};

// ملخص داخل الداشبورد لإجمالي قمح محلي/مستورد
const WHEAT_SUMMARY = {
  total_local:    SILOS.reduce((s,x)=>s+(x.total_local||0),0),
  total_imported: SILOS.reduce((s,x)=>s+(x.total_imported||0),0),
  total_corn:     SILOS.reduce((s,x)=>s+(x.corn||0),0),
};

if (typeof window !== 'undefined') {
  if (localStorage.getItem('DB_VERSION') !== DB_VERSION) {
    localStorage.clear();
    localStorage.setItem('DB_VERSION', DB_VERSION);

    // حفظ البيانات الأساسية
    localStorage.setItem('SILOS', JSON.stringify(SILOS));
    localStorage.setItem('USERS', JSON.stringify(USERS));
    localStorage.setItem('WEIGHBRIDGE_TICKETS', JSON.stringify(RECEIPTS));
    localStorage.setItem('SECURITY', JSON.stringify(SECURITY));
    localStorage.setItem('MAINTENANCE', JSON.stringify(MAINTENANCE));
    localStorage.setItem('FINANCE', JSON.stringify(FINANCE));

    // ═══════════════════════════════════════════════════════════════
    // حقن بيانات البيان اليومي لكل صومعة من 1 إلى 18 يوليو 2026
    // ═══════════════════════════════════════════════════════════════
    const CELL_TYPES = ['مستورد','محلي','محلي','مستورد','محلي','فارغة'];
    const SHIP_NAMES = ['باخرة النيل','باخرة الفرات','باخرة المتوسط','باخرة البحر','باخرة الأمل','باخرة الخير'];
    const GRADES = ['23.5','23','22.5'];
    const MILLS = ['مطاحن النيل','مطاحن الدلتا','مطاحن القاهرة','مطاحن الصعيد','مطاحن البحر','مطاحن الغرب'];

    for (const silo of SILOS) {
      // المخزون الابتدائي في 30 يونيو
      let runningStock = Math.floor(silo.cap * (0.45 + (silo.id * 137 % 100) / 400));

      // بناء خلايا ثابتة للصومعة (12 خلية)
      const siloSeed = silo.id * 31;
      const cellTypes = [];
      for (let c = 0; c < 12; c++) {
        const pick = (siloSeed + c * 7) % 6;
        cellTypes.push(CELL_TYPES[pick]);
      }

      let prevCells = null;

      for (let day = 1; day <= 18; day++) {
        const dateStr = `2026-07-${String(day).padStart(2,'0')}`;

        // بناء الخلايا الـ 12
        const cells = [];
        for (let ci = 0; ci < 12; ci++) {
          const ctype = cellTypes[ci];
          const prevCell = prevCells ? prevCells[ci] : null;
          let opening = prevCell ? prevCell.closing : Math.floor(runningStock / 12);
          if (ctype === 'فارغة') opening = 0;

          let incoming = 0, outgoing = 0;
          if (ctype !== 'فارغة') {
            const hash = (silo.id * 13 + ci * 7 + day * 17) % 100;
            incoming = hash > 40 ? Math.floor(hash * 6) : 0;
            const hashOut = (silo.id * 11 + ci * 5 + day * 23) % 100;
            outgoing = (opening + incoming) > 500 && hashOut > 55 ? Math.floor(hashOut * 3.5) : 0;

            // التأكد أن رصيد الخلية لا يتخطى الحد الأقصى 5400
            // ونبقيه أحياناً في منطقة الخطورة (بين 5000 و 5400) بشكل نادر
            const expectedClosing = opening + incoming - outgoing;
            if (expectedClosing > 5000) {
              const allowDanger = hash % 5 === 0; // 20% فرصة الدخول في الخطر
              const maxAllowed = allowDanger ? 5400 : 5000;
              if (expectedClosing > maxAllowed) {
                incoming = Math.max(0, maxAllowed - opening + outgoing);
              }
            }
          }
          const closing = Math.max(0, opening + incoming - outgoing);

          const grade = GRADES[ci % 3];
          const COUNTRIES_LIST = ['روسيا','أوكرانيا','فرنسا','أمريكا','أستراليا','رومانيا'];
          const country = ctype === 'مستورد' ? COUNTRIES_LIST[(silo.id + ci) % COUNTRIES_LIST.length] : '';
          const ship = SHIP_NAMES[(silo.id + ci) % SHIP_NAMES.length];

          cells.push({
            num: ci + 1,
            type: ctype,
            ship: ctype === 'مستورد' ? ship : '',
            country: ctype === 'مستورد' ? country : '',
            grade: ctype === 'محلي' ? grade : '',
            opening,
            incoming,
            outgoing,
            closing,
            notes: ''
          });
        }
        prevCells = cells;

        // صرف للمطاحن المحلية
        const localOut = [];
        const numMills = 2 + (silo.id % 3);
        for (let m = 0; m < numMills; m++) {
          const millHash = (silo.id * 7 + m * 11 + day * 3) % 100;
          const d235 = millHash > 50 ? Math.floor(millHash * 2.5) : 0;
          const d230 = millHash > 60 ? Math.floor(millHash * 1.8) : 0;
          const d225 = millHash > 70 ? Math.floor(millHash * 1.2) : 0;
          localOut.push({
            name: MILLS[(silo.id + m) % MILLS.length],
            permit: 5000,
            d235, d230, d225,
            total: d235 + d230 + d225
          });
        }

        // صرف للمستورد
        const ships = [];
        const shipHash = (silo.id * 5 + day * 7) % 100;
        if (shipHash > 50) {
          ships.push({
            name: MILLS[silo.id % MILLS.length],
            ship_name: SHIP_NAMES[silo.id % SHIP_NAMES.length],
            dispatched: Math.floor(shipHash * 2),
            opening: Math.floor(runningStock * 0.1),
            closing: Math.floor(runningStock * 0.08),
            permit: 3000,
            remaining: 3000 - Math.floor(shipHash * 2)
          });
        }

        const dayData = { date: dateStr, cells, localOut, ships };
        localStorage.setItem(`DAILY_REPORT_${silo.id}_${dateStr}`, JSON.stringify(dayData));
      }
    }
  }
}

