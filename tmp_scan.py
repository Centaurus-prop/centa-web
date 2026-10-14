import re
from pathlib import Path
root = Path(r'C:\Users\lucas\.openclaw\workspace\projects\Centa\src')
pat = re.compile(r'#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(')
for path in root.rglob('*'):
    if path.suffix not in {'.ts', '.tsx', '.css'}:
        continue
    text = path.read_text(encoding='utf-8')
    for i, line in enumerate(text.splitlines(), 1):
        if pat.search(line):
            print(f'{path.relative_to(root.parent)}:{i}:{line}')
