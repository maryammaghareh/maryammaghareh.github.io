"""Embed source CSS/JS in index.html so one upload always has a matching design."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent


def build():
    target = ROOT / 'index.html'
    page = target.read_text(encoding='utf-8')
    css = (ROOT / 'styles.css').read_text(encoding='utf-8').strip()
    js = (ROOT / 'script.js').read_text(encoding='utf-8').strip()
    if '</style' in css.lower() or '</script' in js.lower():
        raise ValueError('Embedded source contains a closing HTML tag.')
    style = f'<style id="atlas-styles">\n{css}\n  </style>'
    script = f'<script id="atlas-script">\n{js}\n  </script>'
    for tag, replacement in [('style', style), ('script', script)]:
        identifier = 'atlas-styles' if tag == 'style' else 'atlas-script'
        pattern = rf'<{tag} id="{identifier}">.*?</{tag}>'
        if re.search(pattern, page, re.S):
            page, count = re.subn(pattern, lambda _: replacement, page, flags=re.S)
            assert count == 1, f'Duplicate {identifier}'
        else:
            source = '<link rel="stylesheet" href="styles.css">' if tag == 'style' else '<script src="script.js" defer></script>'
            assert page.count(source) == 1, f'Missing or duplicate {source}'
            page = page.replace(source, replacement)
    target.write_text(page, encoding='utf-8')
    print('Built index.html with matching embedded CSS and JavaScript.')


if __name__ == '__main__':
    build()
