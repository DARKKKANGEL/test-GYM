"""Package the existing web app as a standalone HTML file; no dependencies."""
from pathlib import Path

base = Path(__file__).parent
dist = base / 'dist'
html = (dist / 'index.html').read_text(encoding='utf-8')
style = (dist / 'styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + style + '</style>')
for filename in ('questions.js', 'app.js'):
    script = (dist / filename).read_text(encoding='utf-8')
    if '</script' in script.lower():
        raise ValueError(f'Unexpected script-closing tag in {filename}')
    html = html.replace(f'<script src="{filename}"></script>', '<script>' + script + '</script>')
output = base / 'offline.html'
output.write_text(html, encoding='utf-8')
print(f'offline.html: {output.stat().st_size:,} bytes')
