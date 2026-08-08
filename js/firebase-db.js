// ═══════════════════════════════════════════════════════════════════
// 🔥 FIREBASE REAL-TIME DATABASE SYNC — v2.0
// نظام المزامنة الفوري مع Firebase — كل صومعة لها مسارها الخاص
// silo_data/{silo_id}/{KEY}  ← هيكل التخزين
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

  // ── المفاتيح التي تتم مزامنتها مع Firebase ─────────────────────
  const SYNC_PREFIXES = [
    'WEIGHBRIDGE_TICKETS',
    'REGISTERED_SHIPS',
    'WHEAT_ORDERS',
    'WEIGHBRIDGE_USERS',
    'SUPPLIERS',
    'SUPPLIERS_MAP',
    'DAILY_REPORT_',
    'MAINTENANCE',
    'SECURITY',
    'LOCAL_WHEAT_',
    'IMPORTED_WHEAT_',
    'ORDER_DATA_',
    'SHIP_LEDGER_',
    'DISPENSE_ORDERS_LOCAL',
    'DISPENSE_ORDERS',
    'PENDING_APPROVALS',
    'FINANCE_',
    'SILO_USERS',
  ];

  function shouldSync(key) {
    return SYNC_PREFIXES.some(p => key.startsWith(p));
  }

  // ── تحويل مفاتيح localStorage إلى مسارات Firebase آمنة ─────────
  function toFbKey(key) {
    return key
      .replace(/\./g, '__DOT__')
      .replace(/-/g, '__DASH__')
      .replace(/\//g, '__SLASH__');
  }

  function fromFbKey(fbKey) {
    return fbKey
      .replace(/__DOT__/g, '.')
      .replace(/__DASH__/g, '-')
      .replace(/__SLASH__/g, '/');
  }

  // ── الحصول على silo_id من المستخدم الحالي ───────────────────────
  function getSiloId() {
    try {
      const u = JSON.parse(localStorage.getItem('CURRENT_USER') || '{}');
      return u.silo_id || 'shared';
    } catch (e) {
      return 'shared';
    }
  }

  // المسار في Firebase: silo_data/{siloId}/{key}
  function fbPath(key) {
    const siloId = getSiloId();
    // بعض المفاتيح مشتركة بين كل الصوامع (مثل WEIGHBRIDGE_USERS)
    const sharedKeys = ['WEIGHBRIDGE_USERS', 'SILO_USERS'];
    const isShared = sharedKeys.some(k => key.startsWith(k));
    if (isShared) return 'silo_data/shared/' + toFbKey(key);
    return 'silo_data/' + siloId + '/' + toFbKey(key);
  }

  // ── حفظ الـ methods الأصلية ──────────────────────────────────────
  const _orig_setItem = Storage.prototype.setItem.bind(localStorage);
  const _orig_getItem = Storage.prototype.getItem.bind(localStorage);

  let _db = null;
  let _syncing = false;

  // ── شاشة التحميل ─────────────────────────────────────────────────
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
      const parsed = (typeof value === 'string')
        ? (() => { try { return JSON.parse(value); } catch(e) { return value; } })()
        : value;
      _db.ref(fbPath(key)).set(parsed).catch(e => console.warn('FB write error:', e));
    } catch (e) {
      console.warn('Firebase push error:', e);
    }
  }

  // ── مزامنة عند التحميل: Firebase → localStorage ──────────────────
  // يقرأ فقط بيانات الصومعة الحالية + المشتركة
  async function pullFromFirebase() {
    if (!_db) return;
    const siloId = getSiloId();
    try {
      // بيانات الصومعة الحالية
      const siloSnap = await _db.ref('silo_data/' + siloId).get();
      if (siloSnap.exists()) {
        _syncing = true;
        const data = siloSnap.val();
        Object.entries(data).forEach(([fbKey, value]) => {
          const lsKey = fromFbKey(fbKey);
          if (shouldSync(lsKey)) {
            const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
            _orig_setItem(lsKey, strVal);
          }
        });
        _syncing = false;
      }

      // البيانات المشتركة (المستخدمون)
      const sharedSnap = await _db.ref('silo_data/shared').get();
      if (sharedSnap.exists()) {
        _syncing = true;
        const data = sharedSnap.val();
        Object.entries(data).forEach(([fbKey, value]) => {
          const lsKey = fromFbKey(fbKey);
          const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
          _orig_setItem(lsKey, strVal);
        });
        _syncing = false;
      }
    } catch (e) {
      console.warn('Firebase pull error:', e);
      _syncing = false;
    }
  }

  // ── الاستماع للتغييرات الفورية من أجهزة أخرى ────────────────────
  function listenForChanges() {
    if (!_db) return;
    const siloId = getSiloId();

    // الاستماع لتغييرات الصومعة الحالية
    _db.ref('silo_data/' + siloId).on('child_changed', (snap) => {
      const lsKey = fromFbKey(snap.key);
      if (!shouldSync(lsKey)) return;
      const value = snap.val();
      const strVal = (typeof value === 'string') ? value : JSON.stringify(value);
      if (strVal !== _orig_getItem(lsKey)) {
        _syncing = true;
        _orig_setItem(lsKey, strVal);
        _syncing = false;
        window.dispatchEvent(new CustomEvent('firebase-data-updated', { detail: { key: lsKey, value } }));
        setTimeout(tryRefreshPage, 100);
      }
    });

    _db.ref('silo_data/' + siloId).on('child_added', (snap) => {
      const lsKey = fromFbKey(snap.key);
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

  // ── محاولة تحديث الصفحة عند وصول بيانات جديدة ──────────────────
  function tryRefreshPage() {
    const refreshFunctions = [
      'renderTable',
      'loadReport',
      'refreshDashboard',
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

  // ── Override localStorage.setItem لإرسال لـ Firebase تلقائياً ───
  function overrideLocalStorage() {
    localStorage.setItem = function (key, value) {
      _orig_setItem(key, value);
      if (shouldSync(key) && !_syncing) {
        pushToFirebase(key, value);
      }
    };
  }

  // ── دالة عامة لقراءة بيانات صومعة معينة (للإدارة) ───────────────
  // تُستدعى من dashboard.html لعرض كل الصوامع
  window.FirebaseDB = {
    /**
     * يقرأ بيانات مفتاح معين من صومعة محددة
     * @param {string} siloId - رقم الصومعة
     * @param {string} key - اسم المفتاح مثل WEIGHBRIDGE_TICKETS
     * @returns {Promise<any>}
     */
    getForSilo: async function(siloId, key) {
      if (!_db) return null;
      try {
        const snap = await _db.ref('silo_data/' + siloId + '/' + toFbKey(key)).get();
        return snap.exists() ? snap.val() : null;
      } catch(e) {
        console.warn('FirebaseDB.getForSilo error:', e);
        return null;
      }
    },

    /**
     * يقرأ مفتاحاً من كل الصوامع ويدمج النتائج (مفيد للإدارة)
     * @param {string} key - مثل WEIGHBRIDGE_TICKETS
     * @param {string[]} siloIds - قائمة أرقام الصوامع
     * @returns {Promise<Object>} { silo_1: [...], silo_2: [...], ... }
     */
    getAllSilos: async function(key, siloIds) {
      if (!_db) return {};
      const result = {};
      await Promise.all(siloIds.map(async (sid) => {
        try {
          const snap = await _db.ref('silo_data/' + sid + '/' + toFbKey(key)).get();
          if (snap.exists()) result[sid] = snap.val();
        } catch(e) {}
      }));
      return result;
    },

    /**
     * الاستماع الفوري لتغييرات صومعة معينة (للإدارة)
     * @param {string} siloId
     * @param {function} callback
     */
    listenSilo: function(siloId, callback) {
      if (!_db) return;
      _db.ref('silo_data/' + siloId).on('value', (snap) => {
        callback(siloId, snap.val());
      });
    },

    /**
     * الاستماع الفوري لكل الصوامع دفعة واحدة (للإدارة)
     * @param {string[]} siloIds
     * @param {function} callback
     */
    listenAllSilos: function(siloIds, callback) {
      siloIds.forEach(sid => this.listenSilo(sid, callback));
    },

    isReady: function() { return !!_db; }
  };

  function showConnectedToast() {
    if (typeof showToast === 'function') {
      showToast('🔥 متصل بالسيرفر — البيانات تُحدَّث لحظياً', 'success');
    }
  }

  // ── بدء التشغيل ──────────────────────────────────────────────────
  window.firebaseSyncReady = (async function () {
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    showSyncOverlay();

    try {
      _db = initFirebase();
      if (!_db) throw new Error('Firebase init failed');

      overrideLocalStorage();

      const failsafeTimer = setTimeout(() => {
        hideSyncOverlay();
        console.warn('Firebase sync timeout - continuing in local mode');
      }, 5000);

      await pullFromFirebase();
      listenForChanges();

      clearTimeout(failsafeTimer);
      hideSyncOverlay();
      console.log('✅ Firebase sync active! Silo:', getSiloId());

      setTimeout(showConnectedToast, 1000);
      return true;
    } catch (e) {
      console.warn('Firebase sync failed, using local mode:', e);
      hideSyncOverlay();
      return false;
    }
  })();

})();
