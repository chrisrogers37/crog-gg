import { Helmet } from "react-helmet-async";
import { Music as MusicSection } from "../../components/sections/Music";

export function MusicPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
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
    </div>
  );
}
