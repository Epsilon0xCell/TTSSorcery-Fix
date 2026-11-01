#!/usr/bin/env python3
"""TTSSorcery-Fix intro banner: the wings at rest a minute before the house opens,
wordless. Fly rail across the lower third at right of centre, pins slotted, ropes
taut into blackness above. Sandbags hang at graded heights, a painted flat half
raised in crimson, the gold slice of the stage at the left edge with dust in it,
a crooked painted border near the top, a rope coil and folded gloves on the rail.
No text, no stencil lettering, no numbers anywhere."""
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
random.seed(17)
W, H = 1600, 900
v = sys.argv[1] if len(sys.argv) > 1 else "ship"
BLACK = (9, 8, 8); CRIM = (128, 22, 40); GOLD = (216, 172, 80); DUST = (198, 184, 156); BOARD = (96, 74, 50)
img = Image.new("RGB", (W, H), BLACK); d = ImageDraw.Draw(img, "RGBA")
for y in range(H):
    d.line([(0, y), (W, y)], fill=(9, 8, int(8 + 4 * y / H)))
# gold slice of stage light at the left edge, dust drifting in it
lt = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lt)
ld.polygon([(0, 60), (150, 60), (215, 900), (0, 900)], fill=(255, 196, 92, 120))
img = Image.alpha_composite(img.convert("RGBA"), lt.filter(ImageFilter.GaussianBlur(24))).convert("RGB")
d = ImageDraw.Draw(img, "RGBA")
d.rectangle([0, 60, 26, 900], fill=(255, 214, 120, 255))
for i in range(46):  # dust motes in the light band
    x, y = random.randint(30, 180), random.randint(80, 860)
    d.ellipse([x, y, x + 3, y + 3], fill=(255, 226, 160, 170))
# curtain leg in stage crimson at the inner edge of the opening
d.polygon([(196, 40), (268, 40), (258, 640), (206, 640)], fill=(104, 17, 32, 255))
for x in range(206, 262, 14):
    d.line([(x, 44), (x - 4, 636)], fill=(80, 12, 24, 255), width=5)
# crooked border near the top: a painted strip of sky, off level by a few degrees
bd = Image.new("RGBA", (900, 74), (0, 0, 0, 0)); bb = ImageDraw.Draw(bd)
bb.rectangle([0, 8, 900, 66], fill=(58, 74, 96, 255))
bb.rectangle([0, 8, 900, 20], fill=(84, 102, 128, 255))
for cx in (120, 380, 640, 820):
    bb.ellipse([cx, 26, cx + 74, 46], fill=(150, 160, 178, 160))
bd = bd.rotate(2.6 if v == "v1" else -2.6, expand=True, resample=Image.BICUBIC)
img.paste(bd, (430, 66), bd); d = ImageDraw.Draw(img, "RGBA")
for rx in (470, 830, 1190):
    d.line([(rx, 0), (rx, 84)], fill=(168, 150, 116, 255), width=4)
# painted flat half raised, centre distance: house front in dimmed crimson
fx, fy, fw, fh = 620, 250, 330, 400
d.rectangle([fx, fy, fx + fw, fy + fh], fill=(110, 24, 38, 255))
d.polygon([(fx - 14, fy), (fx + fw + 14, fy), (fx + fw // 2, fy - 74)], fill=(70, 40, 30, 255))
d.rectangle([fx + 42, fy + 90, fx + 128, fy + 190], fill=(52, 44, 40, 255))  # door
d.rectangle([fx + 196, fy + 84, fx + 262, fy + 160], fill=(196, 158, 84, 110))  # lit window
d.rectangle([fx + 60, fy + 250, fx + 126, fy + 316], fill=(150, 140, 118, 70))
for rx in (fx + 30, fx + fw - 30):
    d.line([(rx, 0), (rx, fy - 60)], fill=(168, 150, 116, 255), width=4)
# sandbags at graded heights, canvas soft with dust; lowest sways most
bags = [(1010, 300, 0), (1120, 380, 2), (1232, 268, 0), (1346, 430, 5), (1458, 330, 1)]
for bx, by, sway in bags:
    d.line([(bx + 26, 0), (bx + 26 + sway, by - 58)], fill=(168, 150, 116, 255), width=4)
    d.rounded_rectangle([bx, by, bx + 52, by + 128], 20, fill=(148, 134, 106, 255))
    d.line([(bx + 4, by + 34), (bx + 48, by + 34)], fill=(110, 98, 74, 255), width=3)
    d.line([(bx + 26 + sway, by - 58), (bx + 26, by)], fill=(168, 150, 116, 255), width=4)
# floorboards
for i, yy in enumerate(range(688, 900, 34)):
    d.rectangle([0, yy, W, yy + 30], fill=(BOARD[0] - i * 5, BOARD[1] - i * 4, BOARD[2] - i * 3, 255))
    d.line([(0, yy), (W, yy)], fill=(52, 38, 24, 255), width=3)
for gx in (240, 760, 1280):
    d.line([(gx, 688), (gx - 30, 900)], fill=(52, 38, 24, 160), width=2)
# fly rail across the lower third: long bar, pins slotted, ropes taut upward
ry = 648
d.rectangle([330, ry, 1600, ry + 30], fill=(64, 50, 34, 255))
d.rectangle([330, ry, 1600, ry + 7], fill=(110, 90, 60, 255))
pinx = list(range(420, 1560, 114))
for i, px_ in enumerate(pinx):
    d.line([(px_ + 12, 120), (px_ + 12, ry)], fill=(172, 154, 118, 255), width=4)  # rope up into black
    d.rounded_rectangle([px_, ry - 44, px_ + 24, ry + 26], 9, fill=(196, 178, 146, 255))  # pin, upright in its slot
    d.ellipse([px_ + 2, ry - 52, px_ + 22, ry - 32], fill=(206, 188, 156, 255))
    if i % 3 == 0:
        d.ellipse([px_ + 8, ry - 48, px_ + 15, ry - 41], fill=GOLD + (255,))  # gold fleck where thumbs polish
    for t in range(3):  # rope wrap on the pin
        d.arc([px_ - 3, ry - 6 + t * 9, px_ + 27, ry + 12 + t * 9], 0, 180, fill=(150, 130, 96, 255), width=3)
# spare rope coil on the boards beside the rail
for r in (44, 33, 22):
    d.ellipse([392 - r, 800 - r // 2, 392 + r, 800 + r // 2], outline=(168, 148, 110, 255), width=6)
# work gloves folded over the rail, fingers curled
gx = 1030
d.rounded_rectangle([gx, ry - 74, gx + 118, ry - 10], 18, fill=(126, 110, 82, 255))
d.line([(gx + 8, ry - 40), (gx + 110, ry - 40)], fill=(100, 86, 62, 255), width=3)
for fx_ in range(4):
    d.rounded_rectangle([gx + 10 + fx_ * 26, ry - 16, gx + 30 + fx_ * 26, ry + 34], 8, fill=(118, 102, 76, 255))
vg = Image.new("RGBA", (W, H), (0, 0, 0, 0)); vd = ImageDraw.Draw(vg)
vd.rectangle([0, 0, W, H], fill=(0, 0, 0, 70)); vd.ellipse([-200, -120, W + 200, H + 160], fill=(0, 0, 0, 0))
img = Image.alpha_composite(img.convert("RGBA"), vg.filter(ImageFilter.GaussianBlur(110))).convert("RGB")
rng = np.random.default_rng(5); a = np.asarray(img).astype(np.int16)
img = Image.fromarray(np.clip(a + rng.normal(0, 4, a.shape[:2])[..., None], 0, 255).astype(np.uint8))
out = "intro-banner.png" if v == "ship" else f"scratch/intro-{v}.png"
img.save(out); print(out)
