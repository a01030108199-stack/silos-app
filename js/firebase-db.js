// ═══════════════════════════════════════════════════════════════════
// 🔥 FIREBASE REAL-TIME DATABASE SYNC
// نظام المزامنة الفوري مع Firebase
// يجب تضمين هذا الملف بعد مكتبات Firebase وقبل أي ملفات أخرى
// ═══════════════════════════════════════════════════════════════════

(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB9tgZsPkVNgTam5T9mBPTfoY_bkcyNP9Q",
    authDomain: "silos-management-a3033.firebaseapp.com",
    databaseURL: "https://silos-management-a3033-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "silos-management-a3033",
    storageBucket: "silos-management-a3033.firebasestorage.app",
    messagingSenderId: "512881879009",
    appId: "1:512881879009:web:0882400551f9748381a14a8"
  };

  // المفاتيح التي تتم مزامنتها مع Firebase
  const SYNC_PREFIXES = [
    'WEIGHBRIDGE_TICKETS',
    'REGISTERED_SHIPS',
    'WHEAT_ORDERS',
    'WEIGHBRIDGE_USERS',
    'SUPPLIERS',
    'DAILY_REPORT_',
    'MAINTENANCE_',
    'LOCAL_WHEAT_',
    'IMPORTED_WHEAT_',
    'ORDER_DATA_',
    'SHIP_LEDGER_'
  ];

  function shouldSync(key) {
    return SYNC_PREFIXES.some(p => key.startsWith(p));
  }

  // تحويل مفتاح localStorage إلى مسار Firebase آمن
  function toFbKey(key) {
    return key.replace(/\./g, '__DOT__').replace(/-/g, '__DASH__').replace(/\//g, '__SLASH__');
  }

  function fromFbKey(fbKey) {
    return fbKey.replace(/__DOT__/g, '.').replace(/__DASH__/g, '-').replace(/__SLASH__/g, '/');
  }

  // حفظ الـ methods الأصلية
  const _orig_setItem = Storage.prototype.setItem.bind(localStorage);
  const _orig_getItem = Storage.prototype.getItem.bind(localStorage);

  let _db = null;
  let _syncing = false; // منع التكرار اللانهائي

  // ── إظهار شاشة التحميل ──────────────────────────────────────────
  function showSyncOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'fb-sync-overlay';
    overlay.innerHTML = `
      <div style="
        position:fixed; inset:0; z-index:99999;
        background: rgba(10,15,30,0.92);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        font-family: 'Tajawal', sans-serif;
        color:#fff;
      ">
        <div style="font-size:3rem; margin-bottom:16px; animation: spin 1.5s linear infinite; display:inline-block;">🔥</div>
        <div style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">جاري مزامنة البيانات...</div>
        <div style="font-size:0.9rem; color:#94a3b8;">تحميل أحدث البيانات من السيرفر</div>
        <div style="width:200px; height:4px; background:rgba(255,255,255,0.2); border-radius:4px; margin-top:24px; overflow:hidden;">
          <div id="fb-progress" style="height:100%; width:0%; background: linear-gradient(90deg, #f97316, #ef4444); transition: width 0.3s;"></div>
        </div>
      </div>
      <style>
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      const p = document.getElementById('fb-progress');
      if (p) p.style.width = '70%';
    }, 200);
  }

  function hideSyncOverlay() {
    const p = document.getElementById('fb-progress');
    if (p) p.style.width = '100%';
    setTimeout(() => {
      const overlay = document.getElementById('fb-sync-overlay');
      if (overlay) overlay.remove();
    }, 400);
  }

  // ── تهيئة Firebase ────────────────────────────────────────────────
  function initFirebase() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded!');
      return null;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    return firebase.database();
  }

  // ── مزامنة فورية: localStorage → Firebase ────────────────────────
  function pushToFirebase(key, value) {
    if (!_db || _syncing) return;
    try {
      const parsed = (typeof value === 'string') ? (() => { try { return JSON.parse(value); } catch(e) { return value; } })() : value;
      _db.ref('silo_data/' + toFbKey(key)).set(parsed).catch(e => console.warn('FB write error:', e));
    } catch (e) {
      console.warn('Firebase push error:', e);
    }
  }

  // ── مزامنة عند التحميل: Firebase → localStorage ──────────────────
  async function pullFromFirebase() {
    if (!_db) return;
    try {
      const snap = await _db.ref('silo_data').get();
      if (!snap.exists()) return;
      _syncing = true;
      const data = snap.val();
      Object.entries(data).forEach(([fbKey, value]) => {
        const lsKey = fromFbKey(fbKey);
        if (shouldSync(lsKey)) {
          const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
          _orig_setItem(lsKey, strVal);
        }
      });
      _syncing = false;
    } catch (e) {
      console.warn('Firebase pull error:', e);
      _syncing = false;
    }
  }

  // ── الاستماع للتغييرات الفورية من أجهزة أخرى ────────────────────
  function listenForChanges() {
    if (!_db) return;
    _db.ref('silo_data').on('child_changed', (snap) => {
      const fbKey = snap.key;
      const lsKey = fromFbKey(fbKey);
      if (!shouldSync(lsKey)) return;

      const value = snap.val();
      const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
      const currentVal = _orig_getItem(lsKey);

      if (strVal !== currentVal) {
        _syncing = true;
        _orig_setItem(lsKey, strVal);
        _syncing = false;
        // إعادة رسم الصفحة إن أمكن
        window.dispatchEvent(new CustomEvent('firebase-data-updated', {
          detail: { key: lsKey, value }
        }));
        // محاولة تحديث العرض تلقائياً
        setTimeout(tryRefreshPage, 100);
      }
    });

    _db.ref('silo_data').on('child_added', (snap) => {
      const fbKey = snap.key;
      const lsKey = fromFbKey(fbKey);
      if (!shouldSync(lsKey)) return;
      const value = snap.val();
      const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
      if (_orig_getItem(lsKey) !== strVal) {
        _syncing = true;
        _orig_setItem(lsKey, strVal);
        _syncing = false;
      }
    });
  }

  // ── محاولة تحديث الصفحة عند تغيير البيانات ──────────────────────
  function tryRefreshPage() {
    const refreshFunctions = [
      'renderTable',      // scale.html
      'loadReport',       // daily_report.html
      'refreshDashboard', // dashboard.html
      'renderAll',
      'refresh',
      'init'
    ];
    for (const fn of refreshFunctions) {
      if (typeof window[fn] === 'function') {
        try { window[fn](); } catch(e) {}
        break;
      }
    }
  }

  // ── Override localStorage.setItem للمزامنة التلقائية ──────────────
  function overrideLocalStorage() {
    localStorage.setItem = function (key, value) {
      _orig_setItem(key, value);
      if (shouldSync(key) && !_syncing) {
        pushToFirebase(key, value);
      }
    };
  }

  // ── إظهار توست اتصال ─────────────────────────────────────────────
  function showConnectedToast() {
    if (typeof showToast === 'function') {
      showToast('🔥 متصل بالسيرفر - البيانات محدثة', 'success');
    }
  }

  // ── نقطة الدخول الرئيسية ─────────────────────────────────────────
  window.firebaseSyncReady = (async function () {
    // انتظر حتى يتم تحميل DOM
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    showSyncOverlay();

    try {
      _db = initFirebase();
      if (!_db) throw new Error('Firebase init failed');

      overrideLocalStorage();
      await pullFromFirebase();
      listenForChanges();

      hideSyncOverlay();
      console.log('🔥 Firebase sync active!');

      // إظهار رسالة الاتصال بعد تحميل الصفحة
      setTimeout(showConnectedToast, 1000);

      return true;
    } catch (e) {
      console.warn('Firebase sync failed, using local mode:', e);
      hideSyncOverlay();
      return false;
    }
  })();

})();
