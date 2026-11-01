#!/usr/bin/env python3
"""TTSSorcery-Fix logo: a single belaying pin upright and full length, tapered wood
with a rounded head, lower half wrapped in three turns of rope trailing right into
a neat coil on the floorboards. Black velvet ground, a narrow strip of worn stage
board under it, one gold leaf fleck on the head. Title below in Arbutus, gold leaf
on black, spaced like the largest name on a playbill, Fix at the same size.
At 64px the pin, its rope wrap, and the coil must still read."""
import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
W = H = 1024
v = sys.argv[1] if len(sys.argv) > 1 else "ship"
GOLD = (216, 172, 80); WOOD = (203, 184, 152); ROPE = (168, 148, 110)
img = Image.new("RGB", (W, H), (8, 7, 7)); d = ImageDraw.Draw(img, "RGBA")
for y in range(H):
    d.line([(0, y), (W, y)], fill=(8, 7, int(7 + 3 * y / H)))
cx = 470
# strip of worn stage board
d.rectangle([120, 690, 904, 742], fill=(94, 72, 48, 255))
d.line([(120, 690), (904, 690)], fill=(140, 116, 78, 255), width=3)
for gx in (300, 560, 800):
    d.line([(gx, 692), (gx - 12, 740)], fill=(56, 40, 24, 255), width=2)
# pin: tapered body from rounded head down to a narrower foot
d.ellipse([cx - 52, 108, cx + 52, 196], fill=WOOD + (255,))            # rounded head
d.polygon([(cx - 52, 150), (cx + 52, 150), (cx + 30, 690), (cx - 30, 690)], fill=WOOD + (255,))
d.polygon([(cx - 52, 150), (cx - 14, 150), (cx - 22, 690), (cx - 30, 690)], fill=(222, 204, 172, 120))
d.ellipse([cx + 14, 126, cx + 34, 146], fill=GOLD + (255,))           # gold leaf fleck, thumb polished
# three turns of rope around the lower half
for i, yy in enumerate((486, 528, 570)):
    d.rounded_rectangle([cx - 47 + i * 2, yy, cx + 47 - i * 2, yy + 30], 13, outline=ROPE + (255,), width=9)
# rope trailing right into a neat coil on the boards
d.line([(cx + 44, 606), (640, 668), (772, 690)], fill=ROPE + (255,), width=10)
for r in (52, 39, 26):
    d.ellipse([806 - r, 690 - r // 2, 806 + r, 690 + r // 2 + 14], outline=ROPE + (255,), width=8)
f = ImageFont.truetype("fonts/Arbutus.ttf", 84 if v != "v1" else 68)
txt = "TTSSorcery-Fix"
tw = d.textlength(txt, font=f)
d.text(((W - tw) / 2, 806), txt, font=f, fill=GOLD)
rng = np.random.default_rng(6); a = np.asarray(img).astype(np.int16)
img = Image.fromarray(np.clip(a + rng.normal(0, 3, a.shape[:2])[..., None], 0, 255).astype(np.uint8))
out = "logo.png" if v == "ship" else f"scratch/logo-{v}.png"
img.save(out)
img.resize((64, 64), Image.LANCZOS).save("scratch/logo64-ship.png" if v == "ship" else f"scratch/logo64-{v}.png")
print(out)
