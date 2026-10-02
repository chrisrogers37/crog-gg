"""Write the resized WebP variants the site serves for each original photo.

Photos ship as small variants, never the camera originals (#178: five
full-size JPEGs were ~1.1 MB of a 1.3 MB page, for images shown at 80-240px).
For every JPEG in originals/, this writes <name>-<width>.webp for each width
into site/public/profile-photos/, which is where src/utils/photos.ts looks.

To add a photo: put the original in originals/, run this, then reference
/profile-photos/<name> in content/showcase.yaml or PROFILE_PHOTOS.

Usage, from the repo root (needs Pillow: pip install pillow):
    python frontend/scripts/photos/make-variants.py
"""

from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
ORIGINALS = HERE / "originals"
OUT = HERE.parents[2] / "site" / "public" / "profile-photos"

# Keep in step with PHOTO_WIDTHS in src/utils/photos.ts; photos.test.ts fails
# for any width a referenced photo is missing.
WIDTHS = (160, 320, 480)
QUALITY = 78


def main() -> None:
    for original in sorted(ORIGINALS.glob("*.jpg")):
        image = ImageOps.exif_transpose(Image.open(original)).convert("RGB")
        # The site shows every photo square; crop from the centre if needed.
        side = min(image.size)
        square = ImageOps.fit(image, (side, side))
        for width in WIDTHS:
            target = OUT / f"{original.stem}-{width}.webp"
            square.resize((width, width), Image.LANCZOS).save(
                target, "WEBP", quality=QUALITY, method=6
            )
            print(f"{target.name}: {target.stat().st_size // 1024} KiB")


if __name__ == "__main__":
    main()
