"""Synthetic stand-in for an official car picture: a 3/4-ish car with wide
transparent margins and a one-pixel hairline at the right edge (the defect
seen on a real T03 picture). Not a real car picture."""
import sys
from PIL import Image, ImageDraw, ImageFilter

out, hairline = sys.argv[1], sys.argv[2] == "1"
W, H = 1100, 520
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# soft ground shadow (low alpha, must not count as "car")
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).ellipse((250, 400, 830, 440), fill=(0, 0, 0, 30))
img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)))
body = (150, 215, 205, 255)
d.rounded_rectangle((270, 230, 810, 400), radius=46, fill=body)            # lower body
d.polygon([(360, 240), (430, 130), (700, 130), (790, 240)], fill=body)     # cabin
d.polygon([(380, 236), (440, 146), (560, 146), (560, 236)], fill=(18, 26, 48, 255))
d.polygon([(580, 236), (580, 146), (692, 146), (768, 236)], fill=(18, 26, 48, 255))
for cx in (390, 700):
    d.ellipse((cx - 62, 340, cx + 62, 464), fill=(12, 14, 22, 255))
    d.ellipse((cx - 34, 368, cx + 34, 436), fill=(150, 160, 178, 255))
d.rounded_rectangle((262, 300, 300, 330), radius=8, fill=(255, 244, 214, 255))  # headlight, front left
if hairline:
    d.line((W - 6, 0, W - 6, H), fill=(190, 200, 220, 150), width=1)
img.save(out)
print("wrote", out, img.size)
