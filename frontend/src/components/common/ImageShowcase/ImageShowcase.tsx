import { motion } from "framer-motion";
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

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...images, ...images];

  return (
    <motion.div
      className="image-showcase"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      role="group"
      aria-label={`Photos of ${site.owner.name}`}
    >
      <div
        className="image-showcase-track"
        style={
          {
            "--image-count": images.length,
          } as React.CSSProperties
        }
      >
        {duplicatedImages.map((image, index) => {
          // The second copy only exists to make the scroll loop seamless, so it
          // is hidden from assistive tech rather than read out a second time.
          return (
            <div
              className="image-showcase-item"
              key={`${image.src}-${index}`}
              aria-hidden={index >= images.length || undefined}
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
    </motion.div>
  );
}
