import Hero from "@/components/layout/Hero";
import DomainGrid from "@/components/content/DomainGrid";
import GeographySection from "@/components/legacy/GeographySection";
import BCSSection from "@/components/legacy/BCSSection";
import FeatureSection from "@/components/legacy/FeatureSection";
import QuickAccess from "@/components/shared/QuickAccess";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";

export default function Home() {
  return <main><Navbar /><Hero /><DomainGrid /><FeatureSection /><BCSSection /><GeographySection /><QuickAccess /><Footer /></main>;
}
