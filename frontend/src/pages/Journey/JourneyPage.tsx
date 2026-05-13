import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useContentLoader } from "../../hooks";
import { useTimeline, useIsLoading } from "../../store";
import { Timeline } from "../../components/sections/Timeline";

export function JourneyPage() {
  useContentLoader();
  const timeline = useTimeline();
  const isLoading = useIsLoading();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto px-6 py-20"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>Journey — Chris Rogers</title>
      </Helmet>
      <h1 className="font-heading text-4xl font-bold text-text-primary mb-4">
        Journey
      </h1>
      <p className="text-text-secondary text-lg mb-12">
        The timeline so far.
      </p>
      <Timeline data={timeline} />
    </motion.div>
  );
}
