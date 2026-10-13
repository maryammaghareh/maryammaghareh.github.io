"""Dependency-free structural checks for this static website package."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re

ROOT = Path(__file__).resolve().parent.parent


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.ids = set()
        self.duplicate_ids = []

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        self.elements.append((tag, attributes))
        identifier = attributes.get('id')
        if identifier:
            if identifier in self.ids:
                self.duplicate_ids.append(identifier)
            self.ids.add(identifier)


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'styles.css').read_text(encoding='utf-8').strip()
    js = (ROOT / 'script.js').read_text(encoding='utf-8').strip()
    doc = Document()
    doc.feed(html)
    assert not doc.duplicate_ids, doc.duplicate_ids
    assert len([tag for tag, _ in doc.elements if tag == 'h1']) == 1
    assert all(name in doc.ids for name in ['main', 'home', 'research', 'path', 'publications', 'beyond', 'contact'])
    external = set()
    for tag, attributes in doc.elements:
        for key in ['href', 'src']:
            value = attributes.get(key)
            if not value:
                continue
            if value.startswith('#'):
                assert value[1:] in doc.ids, f'Broken fragment: {value}'
            elif urlsplit(value).scheme in ('https', 'mailto'):
                if value.startswith('https:') and tag == 'a':
                    external.add(value)
                assert not (tag in ('script', 'img') and key == 'src'), 'Unexpected remote dependency'
            else:
                target = (ROOT / value).resolve()
                assert target.is_relative_to(ROOT.resolve()), f'Path outside package: {value}'
                assert target.is_file(), f'Missing asset: {value}'
        if attributes.get('target') == '_blank':
            assert {'noopener', 'noreferrer'} <= set(attributes.get('rel', '').split())
        for key in ['aria-labelledby', 'aria-describedby', 'aria-controls']:
            if key in attributes:
                assert set(attributes[key].split()) <= doc.ids, f'Broken {key}: {attributes[key]}'
        if tag == 'button':
            assert attributes.get('type') == 'button'
        if tag == 'svg':
            assert attributes.get('aria-hidden') == 'true' or attributes.get('aria-labelledby')
        if tag == 'img':
            assert 'alt' in attributes
    for identifier in re.findall(r'url\(#([^)]*)\)', html):
        assert identifier in doc.ids, f'Missing SVG resource: {identifier}'
    for tab_name in ['brain', 'cell', 'delivery']:
        tab = next(a for _, a in doc.elements if a.get('id') == f'tab-{tab_name}')
        panel = next(a for _, a in doc.elements if a.get('id') == f'panel-{tab_name}')
        assert tab['aria-controls'] == panel['id']
        assert panel['aria-labelledby'] == tab['id']
        assert ('hidden' in panel) == (tab_name != 'brain')
    assert len(re.findall(r'class="pub-journal"', html)) == 7
    assert len(re.findall(r'class="pub-authors"', html)) == 7
    assert 'srasoulhosseini.github.io' not in html
    assert 'https://maryammaghareh.github.io/' in html
    assert 'Discovery · In progress' in html
    assert 'Jason Huber, PhD' in html and 'Sharan Bobbala, PhD' in html
    assert 'mailto:Maryam.maghareh97@gmail.com' in html
    assert '304-276-3132' not in html
    assert 'scroll-snap' not in css
    assert "addEventListener('wheel'" not in js
    assert re.search(r'@media\s*\(prefers-reduced-motion:\s*reduce\)', css)
    assert not re.search(r'\[data-reveal\][^{]*\{[^}]*opacity\s*:\s*0', css)
    assert 'prefers-reduced-motion' in js
    assert not any(tag == 'script' and 'src' in a for tag, a in doc.elements), 'Build not embedded'
    assert re.search(r'<style id="atlas-styles">\s*(.*?)\s*</style>', html, re.S).group(1) == css
    assert re.search(r'<script id="atlas-script">\s*(.*?)\s*</script>', html, re.S).group(1) == js
    structured = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
    assert structured['name'] == 'Maryam Maghareh'
    assert structured['url'] == 'https://maryammaghareh.github.io/'
    assert (ROOT / 'assets/Maryam_Maghareh_CV.pdf').read_bytes().startswith(b'%PDF-')
    assert (ROOT / '.nojekyll').is_file()
    print(f'PASS: unique IDs, local assets, anchors, seven publications, profiles, metadata, tab relationships, visible base content, and source/build consistency. {len(external)} external URLs preserved; network destinations not tested.')


if __name__ == '__main__':
    main()
