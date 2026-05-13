import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Music as MusicSection } from "../../components/sections/Music";

export function MusicPage() {
  return (
    <motion.div
      className="max-w-3xl mx-auto px-6 py-20"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>Music — crog</title>
      </Helmet>
      <h1 className="font-heading text-4xl font-bold text-text-primary mb-4">
        Music
      </h1>
      <p className="text-text-secondary text-lg mb-12">
        i make electronic music under the name crog.
      </p>
      <MusicSection />
    </motion.div>
  );
}
