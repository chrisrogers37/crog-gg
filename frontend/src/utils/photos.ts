/**
 * Photos ship as resized WebP variants rather than the camera originals
 * (#178: five full-size JPEGs were ~1.1 MB of a 1.3 MB page, for images shown
 * at 80-240px). A photo is named by its base path, and each width lives at
 * `<base>-<width>.webp` in public/; photos.test.ts checks every referenced
 * photo has all of them. To add or replace one, see
 * scripts/photos/make-variants.py.
 */
export const PHOTO_WIDTHS = [160, 320, 480] as const;

export const photoVariant = (base: string, width: number) =>
  `${base}-${width}.webp`;

export const photoSrcSet = (base: string) =>
  PHOTO_WIDTHS.map((width) => `${photoVariant(base, width)} ${width}w`).join(
    ", ",
  );

/** The largest variant, for anything that ignores srcset. */
export const photoSrc = (base: string) =>
  photoVariant(base, PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1]);

/** The header photo is picked from these at random on each visit. */
export const PROFILE_PHOTOS = [
  "/profile-photos/photo-1",
  "/profile-photos/photo-2",
  "/profile-photos/photo-3",
  "/profile-photos/photo-4",
  "/profile-photos/photo-5",
];
