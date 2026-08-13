"""
Crop the offer letters to tall portrait cards for the /interview offer row.

Usage:  put the original screenshots in public/images/offers/src/ named
        unsw.png  uq.png  monash.png  adelaide.png  dentistry.png  utas.png
        then:  python3 scripts-crop-offers.py

Each crop keeps the letterhead through to the offer sentence, trimmed to a 3:4
portrait so the row of cards lines up. Tune TOP/BOTTOM per file if a crop cuts
a sentence; the script prints what it did.
"""
from PIL import Image
from pathlib import Path

SRC = Path("public/images/offers/src")
OUT = Path("public/images/offers")
TARGET_RATIO = 3 / 4          # width / height  -> portrait card
TARGET_W = 720                # 2x the ~360px display width

# fraction of full image height to keep, measured from the top
WINDOW = {
    "unsw.png":      (0.00, 0.95),
    "uq.png":        (0.00, 0.70),
    "monash.png":    (0.00, 0.26),
    "adelaide.png":  (0.03, 0.32),
    "dentistry.png": (0.03, 0.50),
    "utas.png":      (0.00, 0.36),
}

for name, (top_f, bot_f) in WINDOW.items():
    path = SRC / name
    if not path.exists():
        print(f"skip {name}: not found in {SRC}")
        continue
    im = Image.open(path).convert("RGB")
    W, H = im.size
    top, bottom = int(H * top_f), int(H * bot_f)
    box_h = bottom - top
    box_w = int(box_h * TARGET_RATIO)
    if box_w > W:                       # too wide: keep full width, shorten
        box_w = W
        box_h = int(box_w / TARGET_RATIO)
        bottom = top + box_h
    left = (W - box_w) // 2
    crop = im.crop((left, top, left + box_w, bottom))
    crop = crop.resize((TARGET_W, int(TARGET_W / TARGET_RATIO)), Image.LANCZOS)
    out = OUT / name.replace(".png", ".webp")
    crop.save(out, "WEBP", quality=86, method=6)
    print(f"{name:<15} {W}x{H} -> {crop.size}  {out.stat().st_size/1024:.0f}KB")
