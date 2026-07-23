import re

with open('pages/silo_portal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the CSS
new_css = """
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  
  * {
    box-sizing: border-box;
    font-family: 'Cairo', sans-serif;
  }
  
  body.portal-page {
    background: #172033;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    margin: 0;
  }
  
  .portal-container {
    width: 100%;
    max-width: 1300px;
    background: #202b40;
    border-radius: 25px;
    padding: 60px 40px;
    box-shadow: 
        0 25px 50px -12px rgba(0,0,0,0.8),
        inset 0 2px 4px rgba(255,255,255,0.15),
        inset 0 -2px 4px rgba(0,0,0,0.6),
        0 0 0 1px #2a3750;
    position: relative;
    overflow: hidden;
  }
  
  /* Abstract background decorations */
  .portal-container::before, .portal-container::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    background: rgba(255,255,255,0.01);
    border: 2px solid rgba(255,255,255,0.03);
    border-radius: 40px;
    transform: rotate(45deg);
    pointer-events: none;
  }
  .portal-container::before { top: -100px; left: -100px; }
  .portal-container::after { bottom: -150px; right: 20%; transform: rotate(15deg); }

  .portal-header {
    text-align: center;
    margin-bottom: 60px;
    position: relative;
    z-index: 2;
  }
  
  .portal-header h1 {
    color: #e2e8f0;
    font-size: 3rem;
    margin: 0 0 15px 0;
    font-weight: 800;
    text-shadow: 
        -1px -1px 1px rgba(255,255,255,0.1),
        2px 2px 4px rgba(0,0,0,0.8),
        4px 4px 10px rgba(0,0,0,0.5);
  }
  
  .portal-header p {
    color: #94a3b8;
    font-size: 1.2rem;
    margin: 0;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  }
  
  .portal-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 25px;
    position: relative;
    z-index: 2;
  }
  
  /* The recessed bed */
  .portal-card {
    background: #172033;
    border-radius: 25px;
    padding: 12px;
    width: 230px;
    height: 190px;
    cursor: pointer;
    box-shadow: 
        inset 8px 8px 16px rgba(0,0,0,0.6),
        inset -4px -4px 8px rgba(255,255,255,0.03),
        -1px -1px 2px rgba(255,255,255,0.05),
        2px 2px 5px rgba(0,0,0,0.5);
    border: 1px solid #101624;
    transition: all 0.3s ease;
  }
  
  /* The raised button with glowing rim */
  .portal-card-inner {
    width: 100%;
    height: 100%;
    background: #202b40;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 
        inset 0 0 0 2px var(--color),
        inset 0 0 15px rgba(var(--color-rgb), 0.2),
        0 0 15px rgba(var(--color-rgb), 0.15),
        8px 8px 16px rgba(0,0,0,0.5),
        -2px -2px 6px rgba(255,255,255,0.06);
    transition: all 0.3s ease;
  }
  
  .portal-card:hover .portal-card-inner {
    transform: scale(0.96) translateY(2px);
    box-shadow: 
        inset 0 0 0 2px var(--color),
        inset 0 0 25px rgba(var(--color-rgb), 0.4),
        0 0 25px rgba(var(--color-rgb), 0.4),
        3px 3px 8px rgba(0,0,0,0.7),
        -1px -1px 2px rgba(255,255,255,0.04);
  }
  
  .portal-icon {
    font-size: 3.2rem;
    color: var(--color);
    margin-bottom: 15px;
    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.7));
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .portal-card:hover .portal-icon {
    transform: scale(1.1) translateY(-5px);
  }
  
  .portal-card-inner h3 {
    color: #f8fafc;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  }

  /* Auth Modal */
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
  .auth-modal h2 { color: #fff; margin: 0; font-size: 1.6rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
  
  .auth-form-group { margin-bottom: 25px; }
  .auth-input {
    width: 100%; background: #172033; border: none; border-radius: 12px; padding: 18px;
    color: #fff; font-size: 1.2rem; text-align: center; letter-spacing: 5px;
    box-shadow: inset 3px 3px 6px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.03);
    transition: all 0.3s;
  }
  .auth-input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--color), inset 3px 3px 6px rgba(0,0,0,0.6); }
  
  .auth-btn {
    width: 100%; padding: 16px; border: none; border-radius: 12px;
    background: var(--color); color: #fff; font-size: 1.2rem; font-weight: bold;
    cursor: pointer; transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(var(--color-rgb), 0.4), inset 0 2px 2px rgba(255,255,255,0.2);
  }
  .auth-btn:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--color-rgb), 0.6); }
  
  .auth-error { color: #ef4444; text-align: center; margin-top: 15px; font-size: 1rem; display: none; font-weight: 600; }
  .close-modal {
    position: absolute; top: 20px; right: 20px; color: #94a3b8;
    background: none; border: none; font-size: 1.5rem; cursor: pointer; transition: color 0.3s;
  }
  .close-modal:hover { color: #fff; }
"""

# Replace <style> contents
content = re.sub(r'<style>.*?</style>', f'<style>\n{new_css}\n</style>', content, flags=re.DOTALL)

# Use regex to find the content inside the portal-cards and wrap it
content = re.sub(r'(<div class="portal-card"[^>]*>)\s*(<i class.*?</i>\s*<h3>.*?</h3>)\s*(</div>)', r'\g<1>\n      <div class="portal-card-inner">\n        \g<2>\n      </div>\n    \g<3>', content, flags=re.DOTALL)

with open('pages/silo_portal.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done rewriting CSS and HTML in silo_portal.html')
