import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./SectionFadePreview.css";

type SectionFadePreviewProps = {
  id: string;
  label: string;
  onExpand: (section: string) => void;
  children: React.ReactNode;
  maxHeight?: number;
  index?: number;
};

export function SectionFadePreview({
  id,
  label,
  onExpand,
  children,
  maxHeight = 200,
  index = 0,
}: SectionFadePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsFade, setNeedsFade] = useState(true);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsFade(contentRef.current.scrollHeight > maxHeight + 20);
    }
  }, [children, maxHeight]);

  return (
    <motion.div
      className="section-fade-preview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <h3 className="section-fade-label">{label}</h3>
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
