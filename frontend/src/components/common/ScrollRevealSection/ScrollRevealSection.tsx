import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useUIStore } from "../../../store/uiStore";

interface SectionAtmosphere {
  bgTexture?: string;
  accentSecondary?: string;
  bgImage?: string;
}

interface ScrollRevealSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  atmosphere?: SectionAtmosphere;
  fullHeight?: boolean;
}

export function ScrollRevealSection({
  id,
  children,
  className = "",
  atmosphere,
  fullHeight = false,
}: ScrollRevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  useEffect(() => {
    if (isInView) {
      setActiveSection(id);
    }
  }, [isInView, id, setActiveSection]);

  const sectionStyle: Record<string, string> = {};
  if (atmosphere?.bgTexture) {
    sectionStyle["--section-texture"] = atmosphere.bgTexture;
  }
  if (atmosphere?.accentSecondary) {
    sectionStyle["--section-accent"] = atmosphere.accentSecondary;
  }

  return (
    <section
      id={id}
      ref={ref}
      className={`scroll-reveal-section ${fullHeight ? "min-h-screen" : ""} ${className}`}
      style={sectionStyle}
      data-section={id}
    >
      {atmosphere?.bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(${atmosphere.bgImage})`,
            mixBlendMode: "luminosity",
          }}
        >
          <div className="absolute inset-0 bg-base/70" />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </section>
  );
}
