// WhatsApp Sharing Utility with html2canvas

(function() {
  // Inject html2canvas if not present
  if (typeof html2canvas === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);
  }

  // Inject Modal HTML
  const injectModal = () => {
    if (document.getElementById('waModal')) return;
    const modalHtml = `
      <div id="waModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center; flex-direction:column;">
        <div style="background:var(--bg-card, #0c1a35); padding:24px; border-radius:12px; width:360px; max-width:90%; border:1px solid var(--border, #1a2d50); box-shadow:0 15px 40px rgba(0,0,0,0.5);">
          <h3 style="margin-top:0; color:#fff; font-size:1.1rem; display:flex; align-items:center; gap:10px;"><i class="fa-brands fa-whatsapp text-success" style="font-size:1.4rem; color:#28a745;"></i> تصوير وإرسال للواتساب</h3>
          <label style="color:var(--text-sec, #8892a0); font-size:0.85rem; margin-bottom:10px; display:block;">اختر رقماً مسجلاً أو أدخل رقم جديد:</label>
          <input type="text" id="waPhoneInput" class="form-control" list="waSavedPhones" placeholder="مثال: 201012345678" style="margin-bottom:20px; font-size:1.1rem; letter-spacing:1px; width:100%; box-sizing:border-box;">
          <datalist id="waSavedPhones"></datalist>
          <div style="display:flex; gap:12px; justify-content:flex-end;">
            <button class="btn btn-outline" onclick="closeWaModal()">إلغاء</button>
            <button class="btn btn-success" id="waConfirmBtn" onclick="confirmWaShare()"><i class="fa-solid fa-camera"></i> متابعة للتصوير</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };

  window.addEventListener('DOMContentLoaded', injectModal);
  if (document.readyState === 'complete' || document.readyState === 'interactive') injectModal();

  window.shareWhatsApp = function(buttonElement) {
    injectModal();
    window._waTriggerBtn = buttonElement || document.activeElement;
    document.getElementById('waModal').style.display = 'flex';
    const saved = JSON.parse(localStorage.getItem('WA_CONTACTS') || '[]');
    const dl = document.getElementById('waSavedPhones');
    dl.innerHTML = saved.map(p => `<option value="${p}">`).join('');
    const inp = document.getElementById('waPhoneInput');
    inp.value = saved.length > 0 ? saved[saved.length-1] : '20';
    inp.focus();
  };

  window.closeWaModal = function() {
    document.getElementById('waModal').style.display = 'none';
  };

  window.confirmWaShare = function() {
    const phone = document.getElementById('waPhoneInput').value;
    if (!phone || phone.trim() === '') return;

    let saved = JSON.parse(localStorage.getItem('WA_CONTACTS') || '[]');
    if (!saved.includes(phone)) {
      saved.push(phone);
      if (saved.length > 15) saved.shift();
      localStorage.setItem('WA_CONTACTS', JSON.stringify(saved));
    } else {
      saved = saved.filter(p => p !== phone);
      saved.push(phone);
      localStorage.setItem('WA_CONTACTS', JSON.stringify(saved));
    }
    closeWaModal();

    const btn = window._waTriggerBtn;
    let originalHtml = '';
    if (btn) {
      originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التصوير...';
      btn.disabled = true;
    }

    const noPrintEls = document.querySelectorAll('.no-print');
    noPrintEls.forEach(el => el.style.display = 'none');
    if (btn) btn.style.display = 'none'; // hide the button itself just in case

    const waModal = document.getElementById('waModal');
    if (waModal) waModal.style.display = 'none';

    // Assume standard page layout: the report is usually in .page-content or the main container
    // To be safe and capture the whole printed area, we can capture the container that has the tables.
    let reportArea = document.querySelector('.page-content');
    if (!reportArea) reportArea = document.querySelector('.main-content') || document.body;

    // Small delay to ensure UI updates before html2canvas runs
    setTimeout(() => {
      html2canvas(reportArea, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        noPrintEls.forEach(el => el.style.display = '');
        if (btn) {
          btn.style.display = '';
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }

        canvas.toBlob(blob => {
          try {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
              alert('✅ تم تصوير ونسخ الكشف بنجاح!\n\nسيتم فتح الواتساب الآن.. قم بالضغط (كليك يمين > لصق Paste) أو (Ctrl+V) لترسل الصورة.');
              
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              const cleanPhone = phone.replace(/[^0-9]/g, '');
              const url = isMobile 
                ? `https://wa.me/${cleanPhone}` 
                : `https://web.whatsapp.com/send?phone=${cleanPhone}`;
                
              window.location.href = url;
            }).catch(err => {
              alert('حدث خطأ أثناء النسخ التلقائي. المتصفح قد يمنع هذه الخاصية.');
            });
          } catch(e) {
            alert('متصفحك لا يدعم خاصية النسخ المباشر للصور (Clipboard API). الرجاء التحديث لنسخة أحدث.');
          }
        }, 'image/png');
      }).catch(err => {
        console.error(err);
        noPrintEls.forEach(el => el.style.display = '');
        if (btn) {
          btn.style.display = '';
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
        alert('حدث خطأ أثناء محاولة تصوير الكشف.');
      });
    }, 100);
  };
})();
