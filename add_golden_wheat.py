import re

with open('pages/silo_portal.html', 'r', encoding='utf-8') as f:
    content = f.read()

wheat_css = """
  /* Golden Wheat Decorations */
  .decor-wheat {
    position: absolute;
    color: #eab308;
    font-size: 8rem;
    filter: drop-shadow(0 0 15px rgba(234,179,8,0.5)) drop-shadow(2px 4px 6px rgba(0,0,0,0.8));
    opacity: 0.85;
    pointer-events: none;
    z-index: 1;
  }
  .decor-wheat.top-left { top: -40px; left: -40px; transform: rotate(-45deg); font-size: 10rem; }
  .decor-wheat.top-right { top: -40px; right: -40px; transform: rotate(45deg) scaleX(-1); font-size: 10rem; }
  .decor-wheat.bottom-left { bottom: -40px; left: -40px; transform: rotate(-135deg) scaleX(-1); font-size: 10rem; }
  .decor-wheat.bottom-right { bottom: -40px; right: 25%; transform: rotate(145deg); font-size: 8rem; }
  
  .glow-speck {
    position: absolute;
    width: 6px; height: 6px;
    background: #fef08a;
    border-radius: 50%;
    box-shadow: 0 0 15px 5px rgba(234,179,8,0.7);
    pointer-events: none;
    z-index: 1;
  }
  .glow-speck.s1 { top: 20%; left: 15%; }
  .glow-speck.s2 { top: 30%; right: 20%; width: 4px; height: 4px; box-shadow: 0 0 10px 4px rgba(234,179,8,0.6); }
  .glow-speck.s3 { bottom: 25%; left: 35%; }
  .glow-speck.s4 { bottom: 15%; right: 10%; }
  
  .accent-wheat {
    position: absolute;
    color: #eab308;
    font-size: 2.5rem;
    filter: drop-shadow(0 0 8px rgba(234,179,8,0.6)) drop-shadow(1px 2px 3px rgba(0,0,0,0.8));
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 0;
  }
  .accent-wheat.left { left: 15px; transform: translateY(-50%) rotate(-30deg); }
  .accent-wheat.right { right: 15px; transform: translateY(-50%) rotate(30deg) scaleX(-1); }
  
  .portal-icon { position: relative; z-index: 2; }
"""

# Insert CSS before </style>
content = re.sub(r'</style>', f'{wheat_css}\n</style>', content)

# Inject the wheat HTML into the portal container
wheat_html = """
  <!-- Golden Wheat Decorations -->
  <i class="fa-solid fa-wheat-awn decor-wheat top-left"></i>
  <i class="fa-solid fa-wheat-awn decor-wheat top-right"></i>
  <i class="fa-solid fa-wheat-awn decor-wheat bottom-left"></i>
  <i class="fa-solid fa-wheat-awn decor-wheat bottom-right"></i>
  <div class="glow-speck s1"></div>
  <div class="glow-speck s2"></div>
  <div class="glow-speck s3"></div>
  <div class="glow-speck s4"></div>
"""

content = re.sub(r'(<div class="portal-container">)', r'\g<1>\n' + wheat_html, content)

# Inject accent wheat into each portal-card-inner
accent_html = """
        <i class="fa-solid fa-wheat-awn accent-wheat left"></i>
        <i class="fa-solid fa-wheat-awn accent-wheat right"></i>
"""

content = re.sub(r'(<div class="portal-card-inner">)', r'\g<1>\n' + accent_html, content)

with open('pages/silo_portal.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
