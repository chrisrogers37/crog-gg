import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loadShowcase } from "../../../utils/showcaseLoader";
import type { ShowcaseImage } from "../../../types/Showcase";
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
      aria-label="Photo showcase"
      role="presentation"
    >
      <div
        className="image-showcase-track"
        style={
          {
            "--image-count": images.length,
          } as React.CSSProperties
        }
      >
        {duplicatedImages.map((image, index) => (
          <div className="image-showcase-item" key={`${image.src}-${index}`}>
            <img
              src={image.src}
              alt={image.alt}
              className="image-showcase-photo"
              loading="lazy"
              width={140}
              height={140}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
