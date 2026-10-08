import { Experience } from "@/components/experience/Experience";
import { getAvailableModels } from "@/lib/models.server";

export default function HomePage() {
  // Which /public/models/*.glb files exist; missing ones fall back to procedural shapes.
  const models = getAvailableModels();
  return <Experience models={models} />;
}
