// ============================================================
// js/app.js — مكتبة مشتركة: Auth + Sidebar + Utilities
// ============================================================

// ── Auth ────────────────────────────────────────────────────
const Auth = {
  loginByRole(role, siloId, password) {
    const storedUsers = JSON.parse(localStorage.getItem('USERS') || '[]');
    const usersToLoad = storedUsers.length > 0 ? storedUsers : (typeof USERS !== 'undefined' ? USERS : []);

    let user;
    if (role === 'general_admin') {
      user = usersToLoad.find(u => u.role === 'general_admin' && u.password === password);
    } else {
      user = usersToLoad.find(u => u.role === role && u.silo_id === siloId && u.password === password);
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
  const siloAlerts = isGeneral ? SECURITY : SECURITY.filter(s => s.silo_id === user.silo_id);
  const siloMaint  = isGeneral ? MAINTENANCE : MAINTENANCE.filter(m => m.silo_id === user.silo_id);

  const alerts = siloAlerts.filter(s => s.status !== 'resolved').length;
  const maintenance = siloMaint.filter(m => m.status === 'pending').length;

  const items = navItems.map(n => {
    let badge = '';
    if (n.page === 'security' && alerts > 0) badge = `<span class="nav-badge">${alerts}</span>`;
    if (n.page === 'maintenance' && maintenance > 0) badge = `<span class="nav-badge warn">${maintenance}</span>`;
    const active = n.page === activePage ? 'active' : '';
    const href = `${n.page === 'dashboard' ? '' : n.page + '.html'}`;
    return `
      <a href="${href || 'dashboard.html'}" class="nav-item ${active}" id="nav-${n.page}">
        <i class="fa-solid ${n.icon}"></i>
        ${n.label}
        ${badge}
      </a>`;
  }).join('');

  const siloInfo = user.silo_id ? SILOS.find(s => s.id === user.silo_id) : null;
  const subTitle = isGeneral ? 'الإدارة العامة' : (siloInfo ? siloInfo.name : '');

  document.getElementById('app-sidebar').innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">🏭</div>
      <div class="sidebar-logo-text">
        <div class="title">الشركة المصرية القابضة</div>
        <div class="sub">للصوامع والتخزين</div>
      </div>
    </div>
    <div class="sidebar-user">
      <div class="user-avatar"><i class="fa-solid fa-user" style="font-size:13px"></i></div>
      <div class="user-info">
        <div class="name">${user.name}</div>
        <div class="role">${subTitle}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">أقسام النظام</div>
      ${items}
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" onclick="Auth.logout()">
        <i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج
      </button>
    </div>`;
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
function showToast(msg, type = 'success') {
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

// ── Init clock ───────────────────────────────────────────────
function initClock(el) {
  if (!el) return;
  const tick = () => { el.textContent = now(); };
  tick(); setInterval(tick, 60000);
}

// ── Number counter animation ─────────────────────────────────
function animateCount(el, target, suffix = '') {
  const dur = 1200, steps = 40, inc = target / steps;
  let cur = 0, i = 0;
  const timer = setInterval(() => {
    i++; cur = Math.min(cur + inc, target);
    el.textContent = Math.round(cur).toLocaleString('en-US') + suffix;
    if (i >= steps) clearInterval(timer);
  }, dur / steps);
}

// ── Animated progress bars ───────────────────────────────────
function animateProgress() {
  document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, 100);
  });
}
