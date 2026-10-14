from pathlib import Path
root = Path(r'C:\Users\lucas\.openclaw\workspace\projects\Centa\src')
needles = ['border-centa-green-1/20','border-centa-green-1/10','border-gray-100','bg-white','shadow-sm','grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4']
for path in root.rglob('*.tsx'):
    text = path.read_text(encoding='utf-8')
    hits = [n for n in needles if n in text]
    if hits:
        print(path.relative_to(root.parent))
        for n in hits:
            print('  ', n)
