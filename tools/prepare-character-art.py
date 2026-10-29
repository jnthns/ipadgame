"""Extract whole connected figures, never nominal atlas cells, into padded game assets.

Usage: python tools/prepare-character-art.py path/to/sources.json
The JSON maps heroes/troop-viz/troop-ger/troop-rus/troop-jap/troop-rog/equipment
to the corresponding generated PNG. Requires Pillow, numpy and scipy for authoring
only. The browser consumes the checked-in WebP files, without these dependencies.
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/art/remastered/identities'
DATA = json.loads((ROOT / 'src/original-data.json').read_text())
KINDS = ['morningstar', 'hammer', 'mace', 'sword', 'greatsword', 'katana',
         'ninjato', 'axe', 'greataxe', 'bow', 'crossbow', 'spear', 'naginata',
         'staff', 'dagger', 'shuriken', 'throwingAxe', 'throwingKnife', 'fire', 'shield']
VARIANTS = dict(zip(['spikedStaff', 'goldNaginata', 'holySpear', 'blackKatana',
    'goldKatana', 'holyNinjato', 'blackShuriken', 'silverShuriken', 'forgedCrossbow',
    'eliteCrossbow', 'holyBow', 'samuraiBow', 'longAxe', 'holyAxe', 'eliteGreataxe',
    'peacekeeperMace', 'starbringerSword', 'silverThrowingKnife', 'ironBuckler', 'kiteShield'],
    ['staff', 'naginata', 'spear', 'katana', 'katana', 'ninjato', 'shuriken', 'shuriken',
     'crossbow', 'crossbow', 'bow', 'bow', 'axe', 'axe', 'greataxe', 'mace', 'sword',
     'throwingKnife', 'shield', 'shield'], strict=True))
GRIDS = {'heroes': (4, 2), 'troop-viz': (4, 5), 'troop-ger': (4, 5),
         'troop-rus': (4, 4), 'troop-jap': (4, 5), 'troop-rog': (3, 2), 'equipment': (5, 4), 'equipment-variants': (5, 4)}


def ids_for(sheet):
    if sheet == 'heroes':
        return ['hero-' + h['MAIN_HERO']['NAME'].lower() for h in DATA['heroes']]
    if sheet == 'equipment':
        return KINDS
    if sheet == 'equipment-variants':
        return list(VARIANTS)
    nation = sheet.split('-')[1].title()
    return ['unit-' + key for key, unit in DATA['units'].items()
            if ('Rog' in key if nation == 'Rog' else unit['NATION'] == nation and 'Rog' not in key)]


def extract(path, columns, rows, count):
    image = Image.open(path).convert('RGBA')
    pixels = np.asarray(image)
    # Generated alpha can contain almost-invisible noise. Its opaque connected
    # component, expanded two pixels for antialiasing, identifies the whole item.
    labels, total = ndimage.label(pixels[:, :, 3] > 40)
    sizes = np.bincount(labels.ravel())
    objects = ndimage.find_objects(labels)
    candidates = [(i, objects[i-1]) for i in range(1, total+1) if sizes[i] > 250]
    # A weapon's detached bowstring or buckle can be a separate small component;
    # choose the intended large foreground item, then collect adjacent pixels.
    candidates = sorted(candidates, key=lambda item: sizes[item[0]], reverse=True)[:count]
    candidates.sort(key=lambda item: (int((item[1][0].start+item[1][0].stop)/2/(image.height/rows)), item[1][1].start))
    if len(candidates) != count:
        raise ValueError(f'{path}: expected {count} foreground objects, found {len(candidates)}')
    for label, region in candidates:
        ys, xs = region
        margin = 3
        left, top = max(0, xs.start-margin), max(0, ys.start-margin)
        right, bottom = min(image.width, xs.stop+margin), min(image.height, ys.stop+margin)
        selected = labels[top:bottom, left:right] == label
        mask = ndimage.binary_dilation(selected, iterations=2)
        rgba = pixels[top:bottom, left:right].copy()
        rgba[:, :, 3] *= mask.astype('uint8')
        yield Image.fromarray(rgba), [left, top, right, bottom]


def prepare(sources, only=None):
    layout_path = ROOT / 'src/character-art-layout.json'
    manifest_path = DEST / 'manifest.json'
    layout = json.loads(layout_path.read_text()) if only else {'characters': {}, 'equipment': {}}
    provenance = json.loads(manifest_path.read_text())['assets'] if only else {}
    for sheet, path in sources.items():
        if only and sheet != only:
            continue
        ids = ids_for(sheet)
        for name, (cutout, source_bounds) in zip(ids, extract(path, *GRIDS[sheet], len(ids)), strict=True):
            alpha = np.asarray(cutout.getchannel('A'))
            y, x = np.where(alpha > 40)
            top, bottom, left, right = int(y.min()), int(y.max()+1), int(x.min()), int(x.max()+1)
            scale = min(200/(bottom-top), 168/(right-left))
            # Center on the feet, rather than the cape or helmet decoration.
            if not sheet.startswith('equipment'):
                feet_y, feet_x = np.where((alpha > 40) & (np.indices(alpha.shape)[0] > bottom-(bottom-top)*.12))
                center_x = (float(feet_x.min())+float(feet_x.max()))/2
            else:
                center_x = (left+right)/2
            origin_x = 128-center_x*scale
            origin_y = 224-bottom*scale
            resized = cutout.resize((round(cutout.width*scale), round(cutout.height*scale)), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (256, 256))
            canvas.alpha_composite(resized, (round(origin_x), round(origin_y)))
            alpha_out = np.asarray(canvas.getchannel('A'))
            yy, xx = np.where(alpha_out > 8)
            bounds = [int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1)]
            if min(bounds[:2]) < 8 or max(bounds[2:]) > 248:
                raise ValueError(f'{name}: unsafe output padding {bounds}')
            category = 'equipment' if sheet.startswith('equipment') else 'characters'
            if category == 'characters':
                # The leading fist is the rightmost silhouette in the waist
                # band. Measure it per figure so weapons cannot float at a
                # generic hero's hand position.
                band = (np.indices(alpha.shape)[0] >= top+(bottom-top)*.44) & (np.indices(alpha.shape)[0] <= top+(bottom-top)*.70)
                by, bx = np.where((alpha > 40) & band)
                edge_x = int(bx.max())
                hand_y = float(np.median(by[bx >= edge_x-5]))
                front_x = round(origin_x+(edge_x-8)*scale, 2)
                front_y = round(origin_y+hand_y*scale, 2)
                layout[category][name] = {'frontX': front_x, 'frontY': front_y, 'offX': 94, 'offY': 151, 'bounds': bounds}
            else:
                grip_x, grip_y = 128, 200
                kind = VARIANTS.get(name, name)
                if kind in ['staff', 'spear', 'naginata']:
                    grip_y = 156
                if kind in ['shield', 'shuriken', 'fire']:
                    grip_y = (bounds[1]+bounds[3])/2
                if kind == 'bow':
                    grip_x, grip_y = 116, (bounds[1]+bounds[3])/2
                if kind == 'crossbow':
                    grip_y = 185
                if kind not in ['shield', 'shuriken', 'fire']:
                    # The shaft can be off-center under an asymmetric head.
                    # A bowstring is a separate thin run: use the thick grip.
                    grip_row = alpha_out[round(grip_y)-2:round(grip_y)+3].max(axis=0) > 40
                    runs = np.split(np.where(grip_row)[0], np.where(np.diff(np.where(grip_row)[0]) > 1)[0]+1)
                    run = max(runs, key=len)
                    if len(run):
                        grip_x = float((run.min()+run.max())/2)
                layout[category][name] = {'gripX': grip_x, 'gripY': grip_y, 'bounds': bounds}
            destination = DEST / category / (name+'.webp')
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_suffix('.tmp.webp')
            canvas.save(temporary, 'WEBP', quality=92, method=6)
            with Image.open(temporary) as check:
                check.verify()
            temporary.replace(destination)
            provenance[name] = {'sourceSheet': sheet, 'sourceBounds': source_bounds, 'bounds': bounds,
                                'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()}
    (ROOT / 'src/character-art-layout.json').write_text(json.dumps(layout, indent=2)+'\n')
    (DEST / 'manifest.json').write_text(json.dumps({'size': [256, 256], 'assets': provenance}, indent=2)+'\n')
    print(f'Prepared {len(layout["characters"])} complete characters and {len(layout["equipment"])} equipment assets.')


if __name__ == '__main__':
    prepare(json.loads(Path(sys.argv[1]).read_text()), sys.argv[2] if len(sys.argv)>2 else None)
