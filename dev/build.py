import os, sys
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
order = ['data_refs.js', 'data_phrases.js', 'data_norms.js', 'engine.js', 'texts.js', 'ui.js']
js = []
for f in order:
    p = os.path.join(src, f)
    if os.path.exists(p):
        js.append('/* ---- %s ---- */\n' % f + open(p, encoding='utf-8').read())
css = open(os.path.join(src, 'style.css'), encoding='utf-8').read()
shell = open(os.path.join(src, 'shell.html'), encoding='utf-8').read()
asof = sys.argv[2] if len(sys.argv) > 2 else '26.10.2026'
pwa = len(sys.argv) > 3 and sys.argv[3] == 'pwa'
PWA_HEAD = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">\n<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="theme-color" content="#2a3d90">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="1 млн">
<meta name="apple-mobile-web-app-status-bar-style" content="default">'''
PWA_JS = '''<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
}
</script>'''
out = shell.replace('/*CSS*/', css).replace('/*JS*/', '\n'.join(js)).replace('/*ASOF*/', asof).replace('/*PWA*/', PWA_HEAD if pwa else '').replace('/*PWAJS*/', PWA_JS if pwa else '')
dst = sys.argv[1] if len(sys.argv) > 1 else 'out.html'
open(dst, 'w', encoding='utf-8').write(out)
print(dst, len(out.encode('utf-8')), 'bytes')

if len(sys.argv) > 3 and sys.argv[3] == 'artifact':
    import re
    t = open(dst, encoding='utf-8').read()
    head = re.search(r'<head>(.*?)</head>', t, flags=re.S).group(1)
    body = re.search(r'<body>(.*)</body>', t, flags=re.S).group(1)
    head = re.sub(r'<meta charset="utf-8">\s*', '', head)
    head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
    body = body.replace('<script>', '<script>\ndocument.documentElement.lang = "uk";', 1)
    open(dst, 'w', encoding='utf-8').write(head.strip() + '\n' + body.strip() + '\n')
    print('artifact variant written')
