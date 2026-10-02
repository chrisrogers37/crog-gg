import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./SectionFadePreview.css";

/** Content within this much of maxHeight shows whole, with no fade or "see more". */
const FADE_TOLERANCE_PX = 20;

type SectionFadePreviewProps = {
  id: string;
  onExpand: (section: string) => void;
  children: React.ReactNode;
  maxHeight?: number;
};

export function SectionFadePreview({
  id,
  onExpand,
  children,
  maxHeight = 200,
}: SectionFadePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsFade, setNeedsFade] = useState(true);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsFade(contentRef.current.scrollHeight > maxHeight + FADE_TOLERANCE_PX);
    }
  }, [children, maxHeight]);

  return (
    <motion.div
      className="section-fade-preview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="section-fade-content"
        style={{ maxHeight: `${maxHeight}px` }}
        ref={contentRef}
      >
        {children}
      </div>
      {needsFade && (
        <div className="section-fade-overlay">
          <button className="section-fade-btn" onClick={() => onExpand(id)}>
            see more
          </button>
        </div>
      )}
    </motion.div>
  );
}
