// ============================================================
// js/app.js — مكتبة مشتركة: Auth + Sidebar + Utilities
// ============================================================

// ── Auth ────────────────────────────────────────────────────
const Auth = {
  login(username, password) {
    const usersToLoad = typeof USERS !== 'undefined' ? USERS : [];
    const customPasswords = JSON.parse(localStorage.getItem('SILO_PASSWORDS') || '{}');
    
    const user = usersToLoad.find(u => {
      const expectedPassword = customPasswords[(u.silo_id !== null ? u.silo_id : 'null') + '_' + u.role] || u.password;
      return u.username === username && expectedPassword === password;
    });
    if (user) {
      localStorage.setItem('silo_user', JSON.stringify(user));
      return user;
    }
    return null;
  },
  loginByRole(role, siloId, password) {
    const usersToLoad = typeof USERS !== 'undefined' ? USERS : [];
    const customPasswords = JSON.parse(localStorage.getItem('SILO_PASSWORDS') || '{}');

    let user;
    if (role === 'general_admin') {
      const expectedPassword = customPasswords['null_general_admin'] || '123';
      user = usersToLoad.find(u => u.role === 'general_admin');
      if (user && expectedPassword !== password) user = null;
    } else {
      const expectedPassword = customPasswords[siloId + '_' + role] || '123';
      user = usersToLoad.find(u => u.role === role && u.silo_id == siloId);
      if (user && expectedPassword !== password) user = null;
    }

    if (user) {
      localStorage.setItem('silo_user', JSON.stringify(user));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth_changed'));
      return user;
    }
    return null;
  },
  logout() {
    localStorage.removeItem('silo_user');
    window.location.href = '../index.html';
  },
  returnToPortal() {
    const u = this.current();
    if (!u || u.silo_id === undefined) {
      window.location.href = '../index.html';
      return;
    }
    const usersToLoad = typeof USERS !== 'undefined' ? USERS : [];
    const siloUser = usersToLoad.find(user => user.role === 'silo' && user.silo_id === u.silo_id);
    if (siloUser) {
      localStorage.setItem('silo_user', JSON.stringify(siloUser));
      window.location.href = 'silo_portal.html';
    } else {
      window.location.href = '../index.html';
    }
  },
  current() {
    const u = localStorage.getItem('silo_user');
    return u ? JSON.parse(u) : null;
  },
  require(allowedRoles) {
    const user = this.current();
    if (!user) { window.location.href = '../index.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      window.location.href = '../index.html'; return null;
    }
    return user;
  },
  roleLabel(role) {
    const map = {
      general_admin: 'الإدارة العامة',
      manager: 'مدير الموقع',
      scale: 'إدارة الميزان',
      security: 'إدارة الأمن',
      finance: 'الشؤون المالية',
      maintenance: 'الصيانة',
      silo: 'فرع صومعة',
    };
    return map[role] || role;
  }
};

// ── Sidebar Builder ──────────────────────────────────────────
function buildSidebar(activePage) {
  const user = Auth.current();
  if (!user) return;

  const isGeneral = user.role === 'general_admin';
  const role = user.role;

  let navItems = [];
  
  if (isGeneral) {
    navItems = [
      { label:'لوحة التحكم الشاملة', icon:'fa-gauge',          page:'dashboard' },
      { label:'مراقبة الصوامع',      icon:'fa-building-wheat', page:'silos' },
      { label:'التقارير المجمعة',    icon:'fa-chart-bar',      page:'reports' },
    ];
  } else if (role === 'manager') {
    navItems = [
      { label:'لوحة التحكم',             icon:'fa-gauge',           page:'dashboard' },
      { label:'بوابة الصومعة',           icon:'fa-door-open',       page:'gate' },
      { label:'الاستلام والتخزين',       icon:'fa-scale-balanced',  page:'reception' },
      { label:'إدارة الأمن',             icon:'fa-shield-halved',   page:'security' },
      { label:'الشئون المالية والإدارية', icon:'fa-money-bill-wave', page:'finance' },
      { label:'الصيانة',                 icon:'fa-wrench',          page:'maintenance' },
    ];
  } else if (role === 'scale') {
    navItems = [
      { label:'الاستلام والتخزين',       icon:'fa-scale-balanced',  page:'reception' },
    ];
  } else if (role === 'security') {
    navItems = [
      { label:'بوابة الصومعة',           icon:'fa-door-open',       page:'gate' },
      { label:'إدارة الأمن',             icon:'fa-shield-halved',   page:'security' },
    ];
  } else if (role === 'finance') {
    navItems = [
      { label:'الشئون المالية والإدارية', icon:'fa-money-bill-wave', page:'finance' },
    ];
  } else if (role === 'maintenance') {
    navItems = [
      { label:'الصيانة',                 icon:'fa-wrench',          page:'maintenance' },
    ];
  }

  // filter counts by silo if not general admin
  var _SEC   = (typeof SECURITY    !== 'undefined') ? SECURITY    : [];
  var _MAINT = (typeof MAINTENANCE !== 'undefined') ? MAINTENANCE : [];
  var siloAlerts = isGeneral ? _SEC   : _SEC.filter(function(s)   { return s.silo_id === user.silo_id; });
  var siloMaint  = isGeneral ? _MAINT : _MAINT.filter(function(m) { return m.silo_id === user.silo_id; });

  var alerts      = siloAlerts.filter(function(s) { return s.status !== 'resolved'; }).length;
  var maintenance = siloMaint.filter(function(m)  { return m.status === 'pending';  }).length;

  var items = navItems.map(function(n) {
    var badge = '';
    if (n.page === 'security'    && alerts      > 0) badge = '<span class="nav-badge">'      + alerts      + '</span>';
    if (n.page === 'maintenance' && maintenance > 0) badge = '<span class="nav-badge warn">' + maintenance + '</span>';
    var active = n.page === activePage ? 'active' : '';
    var href   = n.page === 'dashboard' ? 'dashboard.html' : (n.page + '.html');
    return '<a href="' + href + '" class="nav-item ' + active + '" id="nav-' + n.page + '">' +
      '<i class="fa-solid ' + n.icon + '"></i> ' + n.label + ' ' + badge +
    '</a>';
  }).join('');

  var siloInfo = (user.silo_id !== undefined && typeof SILOS !== 'undefined') ? SILOS.find(function(s) { return s.id === user.silo_id; }) : null;
  var subTitle = isGeneral ? 'الإدارة العامة' : (siloInfo ? siloInfo.name : '');

  var portalBtn = (!isGeneral && role !== 'silo')
    ? '<button class="btn-logout" onclick="Auth.returnToPortal()" style="background:#475569;margin-bottom:10px"><i class="fa-solid fa-arrow-right"></i> عودة للأقسام</button>'
    : '';

  document.getElementById('app-sidebar').innerHTML =
    '<div class="sidebar-logo">' +
      '<div class="sidebar-logo-icon">🏭</div>' +
      '<div class="sidebar-logo-text">' +
        '<div class="title">الشركة المصرية القابضة</div>' +
        '<div class="sub">للصوامع والتخزين</div>' +
      '</div>' +
    '</div>' +
    '<div class="sidebar-user">' +
      '<div class="user-avatar"><i class="fa-solid fa-user" style="font-size:13px"></i></div>' +
      '<div class="user-info">' +
        '<div class="name">' + user.name + '</div>' +
        '<div class="role">' + subTitle + '</div>' +
      '</div>' +
    '</div>' +
    '<nav class="sidebar-nav">' +
      '<div class="nav-section">أقسام النظام</div>' +
      items +
    '</nav>' +
    '<div class="sidebar-footer">' +
      portalBtn +
      '<button class="btn-logout" onclick="Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج</button>' +
    '</div>';
}

// ── Utilities ────────────────────────────────────────────────
function formatNum(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

function pct(val, cap) {
  return Math.round((val / cap) * 100);
}

function pctColor(p) {
  if (p >= 90) return 'red';
  if (p >= 70) return 'amber';
  return 'green';
}

function statusBadge(status) {
  const map = {
    active:      '<span class="badge badge-success">نشطة</span>',
    maintenance: '<span class="badge badge-warning">صيانة</span>',
    inactive:    '<span class="badge badge-danger">متوقفة</span>',
  };
  return map[status] || status;
}

function severityBadge(s) {
  const map = {
    critical: '<span class="badge badge-danger">حرجة</span>',
    high:     '<span class="badge badge-warning">عالية</span>',
    medium:   '<span class="badge badge-info">متوسطة</span>',
    low:      '<span class="badge badge-success">منخفضة</span>',
  };
  return map[s] || s;
}

function maintenanceBadge(s) {
  const map = {
    pending:     '<span class="badge badge-warning">معلقة</span>',
    in_progress: '<span class="badge badge-info">جارية</span>',
    done:        '<span class="badge badge-success">منجزة</span>',
    approved:    '<span class="badge badge-purple">معتمدة</span>',
    cancelled:   '<span class="badge badge-danger">ملغاة</span>',
  };
  return map[s] || s;
}

function secStatusBadge(s) {
  const map = {
    resolved:     '<span class="badge badge-success">محلولة</span>',
    investigating:'<span class="badge badge-warning">قيد التحقيق</span>',
    open:         '<span class="badge badge-danger">مفتوحة</span>',
  };
  return map[s] || s;
}

function siloName(id) {
  const s = SILOS.find(s => s.id === id);
  return s ? s.name : `صومعة #${id}`;
}

function todayDate() {
  return new Date().toLocaleDateString('ar-EG', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
}

function now() {
  return new Date().toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit' });
}

// ── Toast Notification ───────────────────────────────────────
function showToast(msg, type) {
  if (!type) type = 'success';
  const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#06b6d4' };
  const icons  = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed; bottom:24px; left:24px; z-index:9999;
    background:#0c1a35; border:1px solid ${colors[type]}40;
    border-right:4px solid ${colors[type]};
    padding:14px 20px; border-radius:10px;
    color:#e8eaf0; font-family:'Cairo',sans-serif; font-size:0.87rem; font-weight:600;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 30px rgba(0,0,0,0.4);
    animation:fadeInUp 0.3s ease; direction:rtl;
    min-width:260px; max-width:380px;
  `;
  t.innerHTML = `<span style="color:${colors[type]};font-size:1.1rem;">${icons[type]}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ── Custom Confirm Modal ──────────────────────────────────────
function showConfirm(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99999;
    display:flex; align-items:center; justify-content:center;
    animation:fadeIn 0.2s ease;
  `;
  const modal = document.createElement('div');
  modal.style.cssText = `
    background:#1e293b; padding:24px; border-radius:12px; min-width:320px;
    box-shadow:0 10px 40px rgba(0,0,0,0.5); border:1px solid #334155;
    text-align:center; font-family:'Cairo',sans-serif;
    transform:scale(0.95); animation:scaleUp 0.2s ease forwards;
  `;
  modal.innerHTML = `
    <div style="font-size:1.2rem; color:#fff; margin-bottom:20px;">${msg}</div>
    <div style="display:flex; justify-content:center; gap:12px;">
      <button id="btn-confirm-yes" class="btn btn-primary" style="padding:8px 24px;">نعم، متأكد</button>
      <button id="btn-confirm-no" class="btn btn-danger" style="padding:8px 24px; background:#475569; border-color:#475569;">إلغاء</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById('btn-confirm-yes').onclick = () => {
    overlay.remove();
    if (typeof onConfirm === 'function') onConfirm();
  };
  document.getElementById('btn-confirm-no').onclick = () => overlay.remove();
}

// ── Init clock ───────────────────────────────────────────────
function initClock(el) {
  if (!el) return;
  const tick = () => { el.textContent = now(); };
  tick(); setInterval(tick, 60000);
}

// ── Number counter animation ─────────────────────────────────
function animateCount(el, target, suffix) {
  if (!suffix) suffix = '';
  var dur = 1200, steps = 40, inc = target / steps;
  var cur = 0, i = 0;
  var isFloat = target % 1 !== 0;
  var timer = setInterval(function() {
    i++; cur = Math.min(cur + inc, target);
    if (i >= steps) cur = target; // Ensure exact final value
    
    if (isFloat) {
      el.textContent = cur.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}) + suffix;
    } else {
      el.textContent = Math.round(cur).toLocaleString('en-US') + suffix;
    }
    
    if (i >= steps) clearInterval(timer);
  }, dur / steps);
}

// -- Animated progress bars --
function animateProgress() {
  var bars = document.querySelectorAll('.progress-bar[data-width]');
  for (var k = 0; k < bars.length; k++) {
    (function(bar) {
      setTimeout(function() { bar.style.width = bar.dataset.width + '%'; }, 100);
    })(bars[k]);
  }
}

// ── Generic Modal ─────────────────────────────────────────────
function showModal(id, title, content) {
  closeModal(id); // remove if already open
  var overlay = document.createElement('div');
  overlay.id = 'modal-overlay-' + id;
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#1e293b;padding:24px;border-radius:12px;min-width:340px;max-width:520px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.5);border:1px solid #334155;font-family:Cairo,sans-serif;direction:rtl;';
  box.innerHTML = '<div style="font-size:1.1rem;font-weight:bold;color:#fff;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px;">' + title + '</div>' + content;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function closeModal(id) {
  var el = document.getElementById('modal-overlay-' + id);
  if (el) el.remove();
}

