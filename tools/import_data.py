#!/usr/bin/env python3
"""
Sahra media importer  (photos + videos you collect yourself)

Folder layout (already created for every hotel in the  Data/  folder):
    Data/<Hotel name>/Pic/   -> put .jpg .png .webp photos
    Data/<Hotel name>/Vid/   -> put .mp4 .mov videos

Run (double-click UPDATE-MEDIA.bat on Windows):
    python tools/import_data.py Data

It compresses what it can, copies everything into assets/hotels/<id>/ and rewrites js/media.js.
It is safe to run again and again: files already imported are not duplicated.

Optional helpers (the script still works without them, just with bigger files):
    pip install pillow      -> resizes + compresses photos
    ffmpeg in PATH          -> compresses videos to a web-friendly size
"""
import sys, os, re, json, glob, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets', 'hotels')
slug = lambda s: re.sub(r'[^a-z0-9]+', '', s.lower())
PIC_EXT = ('.jpg', '.jpeg', '.png', '.webp')
VID_EXT = ('.mp4', '.mov', '.m4v', '.webm')

try:
    from PIL import Image, ImageOps
except Exception:
    Image = None
HAS_FFMPEG = shutil.which('ffmpeg') is not None


def hotels():
    t = open(os.path.join(ROOT, 'js', 'hotels.js'), encoding='utf8').read()
    return json.loads(t[t.index('['):t.rindex(']') + 1])


def match(folder, H):
    s = slug(folder)
    if not s:
        return None
    for h in H:
        if s in (slug(h['id']), slug(h['name'])):
            return h['id']
    for h in H:
        if slug(h['id']) in s or s in slug(h['id']):
            return h['id']
    return None


def files_in(folder, exts):
    if not os.path.isdir(folder):
        return []
    return sorted(f for f in glob.glob(os.path.join(folder, '*')) if f.lower().endswith(exts))


def stable(name):
    return re.sub(r'[^a-z0-9]+', '-', os.path.splitext(os.path.basename(name))[0].lower()).strip('-')[:40] or 'file'


def save_photo(src, out_dir, key):
    big = os.path.join(out_dir, 'pics', f'm_{key}.jpg')
    th = os.path.join(out_dir, 'thumbs', f'm_{key}.jpg')
    if os.path.exists(big):
        return False
    if Image:
        try:
            im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
            a = im.copy(); a.thumbnail((1400, 1400)); a.save(big, quality=80, optimize=True, progressive=True)
            b = im.copy(); b.thumbnail((520, 520)); b.save(th, quality=72, optimize=True, progressive=True)
            return True
        except Exception as e:
            print('   ! could not read', os.path.basename(src), e)
            return False
    ext = os.path.splitext(src)[1].lower()
    big = big[:-4] + ext
    shutil.copyfile(src, big)
    return True


def save_video(src, out_dir, key):
    dst = os.path.join(out_dir, 'vids', f'm_{key}.mp4')
    if os.path.exists(dst):
        return False
    if HAS_FFMPEG:
        r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=-2:min(ih\\,960)', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '31',
                            '-maxrate', '1500k', '-bufsize', '3000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', dst])
        if r.returncode == 0:
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '1', '-i', src, '-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '6', dst[:-4] + '.jpg'])
            return True
        print('   ! ffmpeg failed on', os.path.basename(src), '- copying the original instead')
    if not src.lower().endswith('.mp4'):
        print('   ! install ffmpeg to convert', os.path.basename(src), 'to mp4 - skipped')
        return False
    shutil.copyfile(src, dst)
    return True


def do_import(src):
    H = hotels()
    if not Image:
        print('Note: Pillow not installed - photos are copied without resizing (pip install pillow).')
    if not HAS_FFMPEG:
        print('Note: ffmpeg not found - videos are copied without compression.')
    total = [0, 0]
    for d in sorted(os.listdir(src)):
        p = os.path.join(src, d)
        if not os.path.isdir(p):
            continue
        pics = files_in(os.path.join(p, 'Pic'), PIC_EXT)
        vids = files_in(os.path.join(p, 'Vid'), VID_EXT)
        if not pics and not vids:
            continue
        hid = match(d, H)
        if not hid:
            print(f'!! "{d}" does not match any hotel in js/hotels.js - rename the folder to the hotel name')
            continue
        out = os.path.join(A, hid)
        for sub in ('pics', 'thumbs', 'vids'):
            os.makedirs(os.path.join(out, sub), exist_ok=True)
        np_ = sum(1 for f in pics if save_photo(f, out, stable(f)))
        nv = sum(1 for f in vids if save_video(f, out, stable(f)))
        total[0] += np_; total[1] += nv
        print(f'{d} -> {hid}: +{np_} photos, +{nv} videos')
    print(f'Imported {total[0]} new photos and {total[1]} new videos.')


def build_media():
    M = {}
    if os.path.isdir(A):
        for hid in sorted(os.listdir(A)):
            d = os.path.join(A, hid)
            if not os.path.isdir(d):
                continue
            cats = {}
            cp = os.path.join(d, 'cats.json')
            if os.path.exists(cp):
                cats = json.load(open(cp))
            pics = []
            for f in sorted(glob.glob(os.path.join(d, 'pics', '*.*'))):
                n = os.path.basename(f)
                if not n.lower().endswith(PIC_EXT):
                    continue
                th = os.path.join(d, 'thumbs', n)
                pics.append({'src': f'assets/hotels/{hid}/pics/{n}',
                             'thumb': f'assets/hotels/{hid}/' + ('thumbs/' if os.path.exists(th) else 'pics/') + n,
                             'cat': cats.get(n, 'Gallery')})
            vids = []
            for f in sorted(glob.glob(os.path.join(d, 'vids', '*.mp4'))):
                n = os.path.basename(f)
                po = f[:-4] + '.jpg'
                vids.append({'src': f'assets/hotels/{hid}/vids/{n}', 'poster': f'assets/hotels/{hid}/vids/{n[:-4]}.jpg' if os.path.exists(po) else ''})
            if pics or vids:
                M[hid] = {'pics': pics, 'vids': vids}
    with open(os.path.join(ROOT, 'js', 'media.js'), 'w', encoding='utf8') as fh:
        fh.write('/* generated by tools/import_data.py or tools/fetch_images.py - do not edit by hand */\nwindow.SAHRA_MEDIA = ' + json.dumps(M, indent=1) + ';\n')
    print('js/media.js updated:', ', '.join(f'{k} ({len(v["pics"])} photos, {len(v["vids"])} videos)' for k, v in M.items()) or 'empty')


if __name__ == '__main__':
    if len(sys.argv) > 1:
        do_import(sys.argv[1])
    build_media()
