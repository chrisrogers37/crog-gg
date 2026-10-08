import site from "virtual:site-config";
import { useShowcase } from "../../../store";
import type { ShowcaseImage } from "../../../types/Showcase";
import { photoSrc, photoSrcSet } from "../../../utils/photos";
import "./ImageShowcase.css";

type ImageShowcaseProps = {
  /** Override the images showcase.yaml gives (useful for testing) */
  images?: ShowcaseImage[];
};

export function ImageShowcase({ images: propImages }: ImageShowcaseProps) {
  // The store loads showcase.yaml with the rest of the content.
  const loaded = useShowcase();
  const images = propImages ?? loaded ?? [];

  // Don't render if no images or fewer than 3
  if (images.length < 3) return null;

  return (
    <div
      className="image-showcase"
      tabIndex={0}
      role="group"
      aria-label={`Photos of ${site.owner.name}`}
    >
      <div className="image-showcase-track">
        {images.map((image, index) => {
          return (
            <div
              className="image-showcase-item"
              key={`${image.src}-${index}`}
            >
              {/* src last, as on the home page: set first, Safari fetches it eagerly. */}
              <img
                alt={image.alt}
                className="image-showcase-photo"
                loading="lazy"
                width={140}
                height={140}
                // The .image-showcase-photo widths in ImageShowcase.css.
                sizes="(max-width: 480px) 80px, (max-width: 768px) 100px, 140px"
                srcSet={photoSrcSet(image.src)}
                src={photoSrc(image.src)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
