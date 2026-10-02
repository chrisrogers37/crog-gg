import { AnimatePresence, motion } from "framer-motion";

/**
 * The About text from bio.yaml, a paragraph per block between blank lines. A
 * new text (SUMMON's rewrite, or putting it back) fades in where the last one
 * faded out.
 */
export function AboutText({ text }: { text: string }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={text}
        className="about-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
