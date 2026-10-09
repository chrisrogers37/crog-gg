"""Write the resized WebP variants the site serves for each original photo.

Photos ship as small variants, never the camera originals (#178: five
full-size JPEGs were ~1.1 MB of a 1.3 MB page, for images shown at 80-240px).
For every JPEG in the active site's photos/originals/, this writes
<name>-<width>.webp into its public/profile-photos/, which is where
src/utils/photos.ts looks. Originals stay outside the served public/ folder.

To add a photo: put the original in site/photos/originals/, run this, then reference
/profile-photos/<name> in content/showcase.yaml or hero.photos in site/site.yaml.

Usage, from the repo root (needs Pillow: pip install pillow):
    python frontend/scripts/photos/make-variants.py
    SITE_DIR=site.example python frontend/scripts/photos/make-variants.py

SITE_DIR is absolute or relative to the repo root, as in the frontend build.
A site with no originals produces no files; it never uses another site's photos.
"""

import os
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parents[3]

# Keep in step with PHOTO_WIDTHS in src/utils/photos.ts; photos.test.ts fails
# for any width a referenced photo is missing.
WIDTHS = (160, 320, 480)
QUALITY = 78


def main() -> None:
    site = (REPO_ROOT / (os.environ.get("SITE_DIR") or "site")).resolve()
    originals = sorted((site / "photos" / "originals").glob("*.jpg"))
    if not originals:
        print(f"No JPEG originals in {site / 'photos' / 'originals'}; nothing to generate.")
        return
    out = site / "public" / "profile-photos"
    out.mkdir(parents=True, exist_ok=True)
    for original in originals:
        image = ImageOps.exif_transpose(Image.open(original)).convert("RGB")
        # The site shows every photo square; crop from the centre if needed.
        side = min(image.size)
        square = ImageOps.fit(image, (side, side))
        for width in WIDTHS:
            target = out / f"{original.stem}-{width}.webp"
            square.resize((width, width), Image.LANCZOS).save(target, "WEBP", quality=QUALITY, method=6)
            print(f"{target.name}: {target.stat().st_size // 1024} KiB")


if __name__ == "__main__":
    main()
