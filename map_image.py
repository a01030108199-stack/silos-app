import re

html_content = \"\"\"<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>»Ê«»… ≈œ«—… «·’Ê„⁄… - «·‘—ﬂ… «·ﬁ«»÷…</title>
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  
  body.portal-page {
    background: #0f1623;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }
  
  .image-map-container {
    position: relative;
    width: 100vw;
    max-width: 1400px;
  }
  
  .bg-image {
    width: 100%;
    height: auto;
    display: block;
    box-shadow: 0 25px 50px rgba(0,0,0,0.8);
  }
  
  .click-area {
    position: absolute;
    cursor: pointer;
    border-radius: 6%;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0);
  }
  
  .click-area:hover {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.3);
    transform: scale(1.02);
  }

  /* Exact Positions based on the 2:1 image */
  /* Top Row (RTL ordering in mind, but coordinates are left-to-right) */
  /* Left to Right: Finance, Security, Reception, Manager */
  .area-finance { top: 31%; left: 14.5%; width: 15.5%; height: 30%; }
  .area-security { top: 31%; left: 32%; width: 16%; height: 30%; }
  .area-reception { top: 31%; left: 51%; width: 16%; height: 30%; }
  .area-manager { top: 31%; left: 69%; width: 16.5%; height: 30%; }
  
  /* Bottom Row */
  .area-maintenance { top: 66%; left: 69%; width: 16.5%; height: 23%; }

  /* Auth Modal (kept exactly the same styling as before) */
  .auth-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10,13,20,0.85); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.3s;
  }
  .auth-modal-overlay.active { opacity: 1; pointer-events: all; }
  
  .auth-modal {
    background: #202b40; border-radius: 25px; padding: 40px; width: 100%; max-width: 420px;
    transform: scale(0.9); transition: transform 0.3s;
    box-shadow: 
        inset 0 0 0 2px var(--color),
        0 25px 50px -12px rgba(0,0,0,0.8),
        0 0 30px rgba(var(--color-rgb), 0.2);
  }
  .auth-modal-overlay.active .auth-modal { transform: scale(1); }
  
  .auth-modal-header { text-align: center; margin-bottom: 30px; }
  .auth-modal-icon {
    width: 70px; height: 70px; border-radius: 50%;
    background: #172033; display: flex; align-items: center; justify-content: center;
    font-size: 2rem; margin: 0 auto 20px; color: var(--color);
    box-shadow: inset 4px 4px 8px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.05);
  }
  .auth-modal h2 { color: #fff; margin: 0; font-size: 1.6rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); font-family: 'Cairo', sans-serif;}
  
  .auth-form-group { margin-bottom: 25px; }
  .auth-input {
    width: 100%; background: #172033; border: none; border-radius: 12px; padding: 18px;
    color: #fff; font-size: 1.2rem; text-align: center; letter-spacing: 5px;
    box-shadow: inset 3px 3px 6px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.03);
    transition: all 0.3s; font-family: 'Cairo', sans-serif;
  }
  .auth-input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--color), inset 3px 3px 6px rgba(0,0,0,0.6); }
  
  .auth-btn {
    width: 100%; padding: 16px; border: none; border-radius: 12px;
    background: var(--color); color: #fff; font-size: 1.2rem; font-weight: bold;
    cursor: pointer; transition: all 0.3s; font-family: 'Cairo', sans-serif;
    box-shadow: 0 4px 15px rgba(var(--color-rgb), 0.4), inset 0 2px 2px rgba(255,255,255,0.2);
  }
  .auth-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--color-rgb), 0.6); }
  
  .auth-error { color: #ef4444; text-align: center; margin-top: 15px; font-size: 1rem; display: none; font-weight: 600; font-family: 'Cairo', sans-serif;}
  .close-modal {
    position: absolute; top: 20px; right: 20px; color: #94a3b8;
    background: none; border: none; font-size: 1.5rem; cursor: pointer; transition: color 0.3s;
  }
  .close-modal:hover { color: #fff; }
</style>
</head>
<body class="portal-page">

<div class="image-map-container">
  <img src="../img/portal_bg.png" alt="Portal Background" class="bg-image">
  
  <!-- Clickable Overlay Areas -->
  <div class="click-area area-finance" onclick="openAuth('finance', '«·‘∆Ê‰ «·„«·Ì…', 'fa-money-bill-wave', '#10b981')" title="«·‘∆Ê‰ «·„«·Ì…"></div>
  <div class="click-area area-security" onclick="openAuth('security', '≈œ«—… «·√„‰', 'fa-shield-halved', '#ef4444')" title="≈œ«—… «·√„‰"></div>
  <div class="click-area area-reception" onclick="openAuth('scale', '≈œ«—… «·«” ·«„ Ê«· Œ“Ì‰', 'fa-scale-balanced', '#3b82f6')" title="≈œ«—… «·«” ·«„ Ê«· Œ“Ì‰"></div>
  <div class="click-area area-manager" onclick="openAuth('manager', '„œÌ— «·„Êﬁ⁄', 'fa-user-tie', '#8b5cf6')" title="„œÌ— «·„Êﬁ⁄"></div>
  <div class="click-area area-maintenance" onclick="openAuth('maintenance', '«·’Ì«‰…', 'fa-wrench', '#f59e0b')" title="«·’Ì«‰…"></div>
</div>

<!-- Auth Modal -->
<div class="auth-modal-overlay" id="authModal">
  <div class="auth-modal" id="modalContent">
    <button class="close-modal" onclick="closeAuth()"><i class="fa-solid fa-xmark"></i></button>
    <div class="auth-modal-header">
      <div class="auth-modal-icon" id="modalIcon"><i class="fa-solid fa-lock"></i></div>
      <h2 id="modalTitle"> √ﬂÌœ «·œŒÊ·</h2>
    </div>
    <form onsubmit="handleDeptLogin(event)">
      <div class="auth-form-group">
        <input type="password" id="deptPassword" class="auth-input" placeholder="ﬂ·„… «·„—Ê—" required autofocus autocomplete="off">
      </div>
      <button type="submit" class="auth-btn" id="modalBtn"> √ﬂÌœ «·œŒÊ·</button>
      <div class="auth-error" id="modalError">ﬂ·„… «·„—Ê— €Ì— ’ÕÌÕ…</div>
    </form>
  </div>
</div>

<script src="../js/data.js?v=15"></script>
<script src="../js/app.js?v=15"></script>
<script>
  const currentUser = Auth.current();
  if (!currentUser || currentUser.role !== 'silo') {
    window.location.href = '../index.html';
  }

  let selectedRole = '';

  function openAuth(role, title, iconClass, color) {
    selectedRole = role;
    
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalIcon').innerHTML = <i class="fa-solid \"></i>;
    document.getElementById('modalContent').style.setProperty('--color', color);
    
    // Extract RGB for drop shadows
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.getElementById('modalContent').style.setProperty('--color-rgb', \,\,\);
    
    document.getElementById('modalBtn').style.background = color;
    
    document.getElementById('deptPassword').value = '123'; // Auto-fill for demo
    document.getElementById('modalError').style.display = 'none';
    
    document.getElementById('authModal').classList.add('active');
    setTimeout(() => document.getElementById('deptPassword').focus(), 100);
  }

  function closeAuth() {
    document.getElementById('authModal').classList.remove('active');
  }

  function handleDeptLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('modalBtn');
    const pwd = document.getElementById('deptPassword').value;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ã«—Ì «· Õﬁﬁ...';
    btn.disabled = true;

    setTimeout(() => {
      const siloId = currentUser.silo_id;
      const deptUser = Auth.loginByRole(selectedRole, siloId, pwd);
      
      if (deptUser) {
        if (selectedRole === 'scale') window.location.href = 'reception.html?v=15';
        else if (selectedRole === 'security') window.location.href = 'security.html?v=15';
        else if (selectedRole === 'finance') window.location.href = 'finance.html?v=15';
        else if (selectedRole === 'maintenance') window.location.href = 'maintenance.html?v=15';
        else window.location.href = 'dashboard.html?v=15';
      } else {
        document.getElementById('modalError').style.display = 'block';
        btn.innerHTML = ' √ﬂÌœ «·œŒÊ·';
        btn.disabled = false;
      }
    }, 600);
  }
</script>
</body>
</html>
\"\"\"

with open('pages/silo_portal.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print('Done')
