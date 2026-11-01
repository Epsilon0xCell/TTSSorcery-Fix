#!/usr/bin/env python3
"""TTSSorcery-Fix wordmark banner: the wings during a scene change, seen from the
fly rail looking along it. Rail recedes from right foreground to the left, pins in
a row, ropes rising out of frame, sandbags at graded heights. A crew member in
blacks mid frame hauls a crimson painted flat upward. Far left, the lit edge of
the stage cuts a vertical band of warm light. Spare flats lean at the back wall
under a caged work lamp. Title as billing on a playbill pasted to the back wall
at centre, Arbutus black on aged cream, torn at one corner, lit by the lamp."""
import sys, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
random.seed(41)
W, H = 2560, 640
v = sys.argv[1] if len(sys.argv) > 1 else "ship"
img = Image.new("RGB", (W, H), (9, 8, 8)); d = ImageDraw.Draw(img, "RGBA")
for y in range(H):
    d.line([(0, y), (W, y)], fill=(9, 8, 8))
# stage light band, far left
lt = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lt)
ld.polygon([(0, 0), (120, 0), (190, 640), (0, 640)], fill=(255, 196, 92, 115))
img = Image.alpha_composite(img.convert("RGBA"), lt.filter(ImageFilter.GaussianBlur(22))).convert("RGB")
d = ImageDraw.Draw(img, "RGBA")
d.rectangle([0, 0, 20, 640], fill=(255, 214, 120, 255))
d.polygon([(150, 0), (216, 0), (206, 470), (158, 470)], fill=(104, 17, 32, 255))  # curtain leg
# back wall spare flats leaning, under a caged work lamp
for i, (fx, fw, col) in enumerate(((560, 120, (84, 66, 52)), (690, 105, (66, 58, 50)), (2060, 130, (76, 60, 46)))):
    d.polygon([(fx, 470), (fx + fw, 470), (fx + fw - 26, 130), (fx - 20, 130)], fill=col + (255,))
lx, ly = 1010, 120
d.ellipse([lx - 64, ly - 64, lx + 64, ly + 64], fill=(255, 200, 100, 55))
d.ellipse([lx - 13, ly - 13, lx + 13, ly + 13], fill=(255, 222, 150, 255))
d.ellipse([lx - 30, ly - 30, lx + 30, ly + 30], outline=(70, 62, 50, 255), width=4)
d.line([(lx - 30, ly), (lx + 30, ly)], fill=(70, 62, 50, 255), width=3)
d.line([(lx, ly - 30), (lx, ly + 30)], fill=(70, 62, 50, 255), width=3)
# sandbags at graded heights beside the ropes
for bx, by in ((1560, 130), (1700, 210), (1846, 96), (1992, 260)):
    d.line([(bx + 24, 0), (bx + 24, by - 46)], fill=(168, 150, 116, 255), width=4)
    d.rounded_rectangle([bx, by, bx + 48, by + 112], 18, fill=(146, 132, 104, 255))
    d.line([(bx + 4, by + 30), (bx + 44, by + 30)], fill=(108, 96, 72, 255), width=3)
# the rising flat: house front in crimson and dust, tilting as it climbs
fx, fy, fw, fh = 1150, 120, 300, 340
d.rectangle([fx, fy, fx + fw, fy + fh], fill=(122, 24, 42, 255))
d.polygon([(fx - 12, fy), (fx + fw + 12, fy), (fx + fw // 2, fy - 62)], fill=(74, 44, 32, 255))
d.rectangle([fx + 38, fy + 76, fx + 116, fy + 168], fill=(50, 42, 38, 255))
d.rectangle([fx + 178, fy + 70, fx + 240, fy + 140], fill=(208, 168, 90, 120))
for rx in (fx + 26, fx + fw - 26):
    d.line([(rx, 0), (rx, fy - 48)], fill=(172, 154, 118, 255), width=4)
# playbill on the back wall at centre, title in Arbutus black on aged cream
bx, by, bw, bh = 330, 150, 560, 250
d.polygon([(bx, by), (bx + bw - 58, by), (bx + bw, by + 44), (bx + bw, by + bh), (bx, by + bh)], fill=(228, 214, 182, 255))
d.rectangle([bx + 10, by + 10, bx + bw - 10, by + bh - 10], outline=(150, 120, 60, 255), width=3)
f = ImageFont.truetype("fonts/Arbutus.ttf", 62)
for i, line in enumerate(("TTSSorcery", "-Fix")):
    tw = d.textlength(line, font=f)
    d.text((bx + (bw - tw) / 2, by + 52 + i * 84), line, font=f, fill=(16, 14, 12, 255))
d.polygon([(bx + bw - 58, by), (bx + bw, by + 44), (bx + bw - 58, by + 44)], fill=(196, 182, 150, 255))  # torn corner fold
# crew member in blacks mid frame, both hands on one line, leaning back
cx, cy = 1620, 330
d.line([(cx + 66, cy - 128), (cx - 20, cy + 60)], fill=(122, 96, 60, 255), width=38)
d.line([(cx + 60, cy - 130), (cx - 26, cy + 62)], fill=(22, 20, 19, 255), width=34)   # leaning torso
d.ellipse([cx + 52, cy - 176, cx + 96, cy - 132], fill=(24, 21, 20, 255))              # head
d.line([(cx + 44, cy - 118), (cx + 118, cy - 190)], fill=(16, 15, 15, 255), width=15)  # arms up to the line
d.line([(cx + 52, cy - 112), (cx + 124, cy - 168)], fill=(16, 15, 15, 255), width=15)
d.line([(cx + 122, 60), (cx + 122, cy - 160)], fill=(176, 158, 120, 255), width=5)     # the line being hauled
d.line([(cx - 22, cy + 58), (cx - 66, cy + 168)], fill=(14, 13, 13, 255), width=19)    # legs braced
d.line([(cx - 8, cy + 60), (cx + 44, cy + 168)], fill=(14, 13, 13, 255), width=19)
# fly rail receding from right foreground to the left
d.polygon([(2560, 520), (2560, 574), (700, 452), (700, 428)], fill=(66, 52, 36, 255))
for i, (px_, py_, s) in enumerate(((820, 434, .55), (1010, 442, .66), (1240, 452, .78), (1510, 466, .9), (1830, 484, 1.02), (2200, 506, 1.14), (2470, 522, 1.22))):
    d.line([(px_ + 10 * s, 90), (px_ + 10 * s, py_)], fill=(170, 152, 118, 200), width=3)
    d.rounded_rectangle([px_, py_ - 34 * s, px_ + 20 * s, py_ + 20 * s], 5, fill=(198, 180, 148, 255))
    if i % 2 == 0:
        d.ellipse([px_ + 6 * s, py_ - 30 * s, px_ + 13 * s, py_ - 23 * s], fill=(216, 172, 80, 255))
# floorboards
for i, yy in enumerate(range(520, 640, 30)):
    d.rectangle([0, yy + i * 6, W, yy + 26 + i * 6], fill=(88 - i * 6, 66 - i * 5, 44 - i * 3, 120))
rng = np.random.default_rng(8); a = np.asarray(img).astype(np.int16)
img = Image.fromarray(np.clip(a + rng.normal(0, 3, a.shape[:2])[..., None], 0, 255).astype(np.uint8))
out = "banner.png" if v == "ship" else f"scratch/banner-{v}.png"
img.save(out); print(out)
