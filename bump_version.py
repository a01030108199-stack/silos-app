import re

def bump(file):
    with open(file, 'r', encoding='utf-8') as f:
        c = f.read()
    c = re.sub(r'\?v=13', '?v=14', c)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(c)

bump('pages/silo_portal.html')
bump('index.html')
