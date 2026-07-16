import type { Metadata } from "next";
import ItineraryExperience from "./ItineraryExperience";

export const metadata: Metadata = {
  title: "Cinematic Editorial · California Road Trip",
  description: "A fluid 17-day California itinerary from San Francisco through Yosemite, Highway 1, Los Angeles, San Diego and the desert to Las Vegas.",
};

export default function Home() {
  return <ItineraryExperience />;
}
