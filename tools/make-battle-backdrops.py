"""Derive regional battlefield backdrops from the approved painted battle scene.

field-*  : open country with the castle replaced by a mirrored landscape (road and contract fights)
siege-*  : the castle, banners recoloured to the defending nation
throne-* : the castle at dusk for the final assault
Each nation gets a colour grade so a fight in the Far East does not look like one in the Western lands.
Run from the repository root: python3 tools/make-battle-backdrops.py
"""
from pathlib import Path
import colorsys
import numpy as np
from PIL import Image

SOURCE = Path('public/art/remastered/battle.webp')
OUT = Path('public/art/remastered/battlefields')
SIZE = (1280, 853)
NATION_HEX = {'Viz': '#efb94f', 'Ger': '#2d85d5', 'Rus': '#6ca64f', 'Jap': '#df5354'}
# RGB gain, green-hue shift (fraction of the hue circle), grass saturation, earth (saturation, value), sky tint
GRADES = {
    'Ger': ((1.00, 1.00, 1.00), 0.000, 1.00, (1.00, 1.00), None),
    'Rus': ((0.90, 0.98, 1.02), 0.045, 1.10, (0.55, 0.78), (205, 226, 236)),
    'Viz': ((1.06, 1.00, 0.86), -0.070, 0.80, (0.80, 1.10), (255, 222, 160)),
    'Jap': ((1.02, 0.97, 1.02), 0.030, 1.15, (0.85, 0.92), (255, 190, 206)),
}


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0)
    gc = np.where(m, (mx - g) / np.where(m, d, 1), 0)
    bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc))
    h = np.where(m, (h / 6) % 1, 0)
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1), 0)
    return np.stack([h, s, mx], -1)


def hsv_to_rgb(a):
    h, s, v = a[..., 0], a[..., 1], a[..., 2]
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    choices = [np.stack(x, -1) for x in ((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))]
    out = np.zeros(a.shape)
    for k, c in enumerate(choices):
        out = np.where((i == k)[..., None], c, out)
    return out


def ramp(n, start, end):
    """0 before start, 1 after end, smooth in between (fractions of n)."""
    x = np.linspace(0, 1, n)
    return np.clip((x - start) / (end - start), 0, 1)


def open_country(img):
    """Replace the castle half of the horizon with the mirrored landscape half."""
    h, w, _ = img.shape
    mirrored = img[:, ::-1]
    right = ramp(w, 0.47, 0.53)[None, :, None]
    upper = (1 - ramp(h, 0.44, 0.52))[:, None, None]
    mask = right * upper
    return img * (1 - mask) + mirrored * mask


def recolour_banners(img, nation):
    h, w, _ = img.shape
    hsv = rgb_to_hsv(img)
    region = np.zeros((h, w), bool)
    region[: int(h * 0.45), int(w * 0.5):] = True
    blue = (hsv[..., 0] > 0.56) & (hsv[..., 0] < 0.70) & (hsv[..., 1] > 0.55) & (hsv[..., 2] < 0.82) & region
    target = colorsys.rgb_to_hsv(*[int(NATION_HEX[nation][i:i + 2], 16) / 255 for i in (1, 3, 5)])
    hsv[..., 0] = np.where(blue, target[0], hsv[..., 0])
    hsv[..., 1] = np.where(blue, np.maximum(hsv[..., 1], target[1]), hsv[..., 1])
    return hsv_to_rgb(hsv)


def grade(img, nation):
    gain, shift, sat, (earth_sat, earth_val), sky = GRADES[nation]
    hsv = rgb_to_hsv(img)
    green = (hsv[..., 0] > 0.17) & (hsv[..., 0] < 0.45)
    earth = (hsv[..., 0] > 0.04) & (hsv[..., 0] <= 0.17) & (hsv[..., 1] > 0.3)
    hsv[..., 0] = np.where(green, (hsv[..., 0] + shift) % 1, hsv[..., 0])
    hsv[..., 1] = np.clip(hsv[..., 1] * np.where(green, sat, np.where(earth, earth_sat, 1)), 0, 1)
    hsv[..., 2] = np.clip(hsv[..., 2] * np.where(earth, earth_val, 1), 0, 1)
    out = hsv_to_rgb(hsv) * np.array(gain)
    if sky:
        h = img.shape[0]
        weight = (1 - ramp(h, 0.05, 0.32))[:, None, None] * 0.22
        out = out * (1 - weight) + np.array(sky) / 255 * weight
    return np.clip(out, 0, 1)


def dusk(img):
    h, w, _ = img.shape
    out = img * np.array([1.0, 0.78, 0.62]) * 0.78
    y, x = np.mgrid[0:h, 0:w]
    vignette = 1 - 0.45 * (((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    return np.clip(out * np.clip(vignette, 0.45, 1)[..., None], 0, 1)


def save(arr, name):
    Image.fromarray((arr * 255).round().astype(np.uint8)).resize(SIZE, Image.LANCZOS).save(OUT / f'{name}.webp', quality=74, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    base = np.asarray(Image.open(SOURCE).convert('RGB'), dtype=np.float64) / 255
    field = open_country(base)
    for nation in NATION_HEX:
        castle = recolour_banners(base, nation)
        save(grade(field, nation), f'field-{nation}')
        save(grade(castle, nation), f'siege-{nation}')
        save(dusk(grade(castle, nation)), f'throne-{nation}')


if __name__ == '__main__':
    main()
