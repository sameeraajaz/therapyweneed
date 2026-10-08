import { AboutModel } from "@/components/AboutModel";
import { Bridge } from "@/components/Bridge";
import { Hero } from "@/components/Hero";
import { QuestionJourney } from "@/components/QuestionJourney";
import { ReachOut } from "@/components/ReachOut";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Bridge />
      <QuestionJourney />
      <AboutModel />
      <ReachOut />
    </>
  );
}
