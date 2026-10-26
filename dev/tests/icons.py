import asyncio, sys
from playwright.async_api import async_playwright
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'icons') + '/'
def svg(size, scale=1.0, rot=-8):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 512 512">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3a51ad"/><stop offset="1" stop-color="#1e2c6e"/>
  </linearGradient>
</defs>
<rect width="512" height="512" fill="url(#bg)"/>
<g transform="translate(256 262) scale({scale}) rotate({rot}) translate(-256 -256)">
  <rect x="84" y="118" width="344" height="276" rx="26" fill="none" stroke="#ffffff" stroke-width="15"/>
  <rect x="109" y="143" width="294" height="226" rx="12" fill="none" stroke="#f3c45a" stroke-width="5"/>
  <text x="256" y="296" text-anchor="middle" fill="#ffffff" font-family="Inter Display" font-weight="900" font-size="190" letter-spacing="-4">1</text>
  <text x="256" y="350" text-anchor="middle" fill="#f3c45a" font-family="Inter Display" font-weight="800" font-size="54" letter-spacing="12">МЛН</text>
</g>
</svg>'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, size, scale in [('icon-512.png', 512, 1.0), ('icon-192.png', 192, 1.0), ('apple-touch-icon.png', 180, 1.0), ('maskable-512.png', 512, 0.8), ('favicon-32.png', 32, 1.0)]:
            pg = await b.new_page(viewport={'width': size, 'height': size})
            await pg.set_content('<html><body style="margin:0">' + svg(size, scale) + '</body></html>')
            await pg.wait_for_timeout(100)
            await pg.screenshot(path=OUT + name, clip={'x': 0, 'y': 0, 'width': size, 'height': size})
            await pg.close()
        await b.close()
    open(OUT + 'icon.svg', 'w').write(svg(512))
asyncio.run(main())
