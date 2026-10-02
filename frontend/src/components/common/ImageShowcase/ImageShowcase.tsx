import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import site from "virtual:site-config";
import { loadShowcase } from "../../../utils/showcaseLoader";
import type { ShowcaseImage } from "../../../types/Showcase";
import { photoSrc, photoSrcSet } from "../../../utils/photos";
import "./ImageShowcase.css";

type ImageShowcaseProps = {
  /** Override images instead of loading from YAML (useful for testing) */
  images?: ShowcaseImage[];
};

export function ImageShowcase({ images: propImages }: ImageShowcaseProps) {
  const [images, setImages] = useState<ShowcaseImage[]>(propImages || []);

  useEffect(() => {
    if (!propImages) {
      loadShowcase().then(setImages);
    }
  }, [propImages]);

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
              {/* src last, as in AboutPage: set first, Safari fetches it eagerly. */}
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
