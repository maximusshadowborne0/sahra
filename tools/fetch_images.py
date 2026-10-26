#!/usr/bin/env python3
"""
Sahra picture fetcher  -  collects photos for every hotel from the links in js/hotels.js
(official website, Booking.com, Google Hotels, other booking pages).

Run on a computer with internet (double-click GET-PICTURES.bat on Windows):
    python tools/fetch_images.py                 all hotels without photos
    python tools/fetch_images.py --only tropitel-dahab-oasis
    python tools/fetch_images.py --max 10        up to 10 photos per hotel (default 8)
    python tools/fetch_images.py --force         also hotels that already have photos
    python tools/fetch_images.py --page camp-balsam=https://example.com/gallery   add one more page to look at

Notes
  * Needs only Python 3.  Install Pillow (pip install pillow) to resize/compress the photos.
  * Some sites (Booking, Instagram, TikTok) block automated visitors. Those hotels will say "0 photos";
    drop that hotel's own photos in Data/<Hotel>/Pic and run UPDATE-MEDIA.bat instead.
  * Photos belong to the hotels / photographers. Use them to promote the hotel with its permission and
    replace them with your own over time. Every source page is written to assets/hotels/<id>/sources.txt.
"""
import sys, os, re, json, gzip, io, time, html, ssl, argparse, urllib.request, urllib.parse, urllib.error
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import import_data as imp
try:
    from PIL import Image, ImageOps
except Exception:
    Image = None

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CTX = ssl.create_default_context()
BAD = re.compile(r'(logo|icon|sprite|favicon|avatar|flag|emoji|pixel|tracking|placeholder|blank|loading|spinner|badge|payment|\.svg|\.gif|/flags?/|trustyou|tripadvisor\.com/img|maps\.(google|gstatic)|staticmap|qr[-_]?code|banner-ad|logos?/)', re.I)
IMG_RE = re.compile(r'https?:(?:\\?/){2}[^"\'\s<>()\\]+?\.(?:jpe?g|webp|png)(?:\?[^"\'\s<>()\\]*)?', re.I)


def get(url, timeout=25, referer=None):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8',
                                               'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip', **({'Referer': referer} if referer else {})})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        data = r.read(25_000_000)
        if r.headers.get('Content-Encoding') == 'gzip':
            data = gzip.decompress(data)
        return r.geturl(), (r.headers.get('Content-Type') or '').lower(), data


class P(HTMLParser):
    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base; self.meta = []; self.imgs = []; self.ld = []; self._ld = False
    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or '') for k, v in attrs}
        if tag == 'meta':
            key = (a.get('property') or a.get('name') or '').lower()
            if key in ('og:image', 'og:image:secure_url', 'og:image:url', 'twitter:image', 'twitter:image:src') and a.get('content'):
                self.meta.append(a['content'])
        elif tag == 'link' and a.get('rel', '').lower() in ('image_src', 'preload') and a.get('as', 'image') == 'image' and a.get('href'):
            self.meta.append(a['href'])
        elif tag in ('img', 'source'):
            for k in ('src', 'data-src', 'data-lazy-src', 'data-original', 'data-lazy'):
                if a.get(k): self.imgs.append(a[k])
            for k in ('srcset', 'data-srcset'):
                if a.get(k):
                    parts = [x.strip().split(' ')[0] for x in a[k].split(',') if x.strip()]
                    if parts: self.imgs.append(parts[-1])
        elif tag == 'script' and 'ld+json' in a.get('type', '').lower():
            self._ld = True
        # CSS background images
        if a.get('style') and 'url(' in a['style']:
            for m in re.findall(r'url\(["\']?([^"\')]+)', a['style']): self.imgs.append(m)
    def handle_endtag(self, tag):
        if tag == 'script': self._ld = False
    def handle_data(self, d):
        if self._ld: self.ld.append(d)


def walk(o, out, hot=False):
    """collect image-looking strings from JSON-LD (relative or absolute) under image-like keys"""
    if isinstance(o, dict):
        for k, v in o.items():
            walk(v, out, hot or k.lower() in ('image', 'photo', 'photos', 'contenturl', 'thumbnailurl', 'thumbnail', 'logo_no'))
    elif isinstance(o, list):
        for v in o: walk(v, out, hot)
    elif isinstance(o, str) and hot and re.search(r'\.(jpe?g|webp|png)(\?|$)', o, re.I):
        out.append(o)


def upgrade(u):
    # Booking.com CDN: ask for a larger rendition
    if 'bstatic.com' in u and '/xdata/images/hotel/' in u:
        u = re.sub(r'/(?:square\d+|max\d+x\d+|max\d+|\d+x\d+)(?:x\d+)?/', '/max1024x768/', u)
    return u


def key_of(u):
    p = urllib.parse.urlparse(u)
    name = os.path.basename(p.path)
    name = re.sub(r'[-_]?\d{2,4}x\d{2,4}', '', name)
    return (p.netloc.split('.')[-2:] and name.lower())


def candidates(url):
    final, ctype, data = get(url)
    if 'html' not in ctype and not data.lstrip()[:1] == b'<':
        return final, []
    txt = data.decode('utf-8', 'replace')
    p = P(final); p.feed(txt)
    ld = []
    for blob in p.ld:
        try: walk(json.loads(blob), ld)
        except Exception: pass
    raw = p.meta + ld + p.imgs + IMG_RE.findall(txt.replace('\\/', '/'))
    seen, out = set(), []
    for u in raw:
        u = html.unescape(u.strip())
        if not u or u.startswith('data:'): continue
        u = urllib.parse.urljoin(final, u)
        if not u.startswith('http') or BAD.search(u): continue
        if not re.search(r'\.(jpe?g|webp|png)(\?|$)', u, re.I) and 'bstatic.com' not in u: continue
        u = upgrade(u)
        k = key_of(u)
        if k in seen: continue
        seen.add(k); out.append(u)
    return final, out


def download(u, referer):
    final, ctype, data = get(u, timeout=30, referer=referer)
    if not ctype.startswith('image/') or len(data) < 40_000:
        return None
    if Image:
        try:
            im = Image.open(io.BytesIO(data)); w, h = im.size
            if max(w, h) < 800 or min(w, h) < 380: return None
            return im
        except Exception:
            return None
    return data


def save(obj, out_dir, n):
    big = os.path.join(out_dir, 'pics', f'web_{n:02d}.jpg'); th = os.path.join(out_dir, 'thumbs', f'web_{n:02d}.jpg')
    if Image and not isinstance(obj, (bytes, bytearray)):
        im = ImageOps.exif_transpose(obj).convert('RGB')
        a = im.copy(); a.thumbnail((1400, 1400)); a.save(big, quality=80, optimize=True, progressive=True)
        b = im.copy(); b.thumbnail((520, 520)); b.save(th, quality=72, optimize=True, progressive=True)
    else:
        open(big, 'wb').write(obj)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only'); ap.add_argument('--max', type=int, default=8); ap.add_argument('--force', action='store_true')
    ap.add_argument('--page', action='append', default=[])
    a = ap.parse_args()
    extra = {}
    for s in a.page:
        if '=' in s: k, v = s.split('=', 1); extra.setdefault(k, []).append(v)
    H = imp.hotels(); report = []
    if not Image: print('Note: Pillow not installed - photos are saved without resizing (pip install pillow).')
    for h in H:
        if a.only and h['id'] != a.only: continue
        out = os.path.join(imp.A, h['id'])
        have = [f for f in os.listdir(os.path.join(out, 'pics'))] if os.path.isdir(os.path.join(out, 'pics')) else []
        if have and not a.force and not a.only:
            report.append((h['name'], len(have), 'already has photos')); continue
        L = h['links']
        pages = extra.get(h['id'], []) + [u for k in ('site', 'booking', 'ota', 'ggl') for u in L.get(k, [])][:6]
        for d_ in ('pics', 'thumbs'): os.makedirs(os.path.join(out, d_), exist_ok=True)
        got, srcs, tried = 0, [], set()
        print(f'\n== {h["name"]}')
        for pg in pages:
            if got >= a.max: break
            try:
                final, cands = candidates(pg)
            except Exception as e:
                print(f'   x {pg[:70]}  ({type(e).__name__}: {str(e)[:50]})'); continue
            print(f'   - {pg[:70]}  -> {len(cands)} candidate images')
            for u in cands:
                if got >= a.max: break
                if u in tried: continue
                tried.add(u)
                try:
                    obj = download(u, final)
                except Exception:
                    continue
                if obj is None: continue
                got += 1; save(obj, out, got); srcs.append(u)
                time.sleep(.3)
            time.sleep(.6)
        if srcs:
            open(os.path.join(out, 'sources.txt'), 'w', encoding='utf8').write('Photos fetched from:\n' + '\n'.join(srcs) + '\n')
        report.append((h['name'], got, 'ok' if got else 'nothing found - add photos manually'))
        print(f'   => {got} photos')
    imp.build_media()
    print('\nSUMMARY')
    for n, c, s in report: print(f'  {n:34s} {c:3d}  {s}')


if __name__ == '__main__':
    main()
