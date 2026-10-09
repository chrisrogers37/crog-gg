import { AnimatePresence, motion } from "framer-motion";
import { useMotionPreference } from "../hooks/useMotionPreference";

/**
 * The About text from bio.yaml, a paragraph per block between blank lines. A
 * new text (SUMMON's rewrite, or putting it back) fades in where the last one
 * faded out.
 */
export function AboutText({ text }: { text: string }) {
  const reduceMotion = useMotionPreference();
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={text}
        className="about-text"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: reduceMotion ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
