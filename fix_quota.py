import re

with open('js/data.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove the loop that generates ALL days for ALL silos!
# Replace with just the current month or something smaller, or just delete the loop
# Wait, I'll just comment out the huge loop, and add a small loop for just 5 days
c = re.sub(
    r'if \(!localStorage\.getItem\(DAILY_REPORT_1_2024-01-01\)\) \{.*?for \(let month = 1; month <= 12; month\+\+\) \{.*?for \(let day = 1; day <= 30; day\+\+\) \{.*localStorage\.setItem.*?\}\s*\}\s*\}\s*\}',
    '''if (!localStorage.getItem(DAILY_REPORT_1_2024-01-01)) {
  for (let silo of SILOS) {
    for (let day = 1; day <= 5; day++) {
      const dateStr = 2024-01-0;
      localStorage.setItem(DAILY_REPORT__, '{"demo":true}');
    }
  }
}''',
    c, flags=re.DOTALL
)

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write(c)

