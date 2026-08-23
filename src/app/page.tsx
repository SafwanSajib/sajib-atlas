import BCSSection from "@/components/BCSSection";
import DomainGrid from "@/components/DomainGrid";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import GeographySection from "@/components/GeographySection";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import QuickAccess from "@/components/QuickAccess";

export default function Home() {
  return <main><Navbar /><Hero /><DomainGrid /><FeatureSection /><BCSSection /><GeographySection /><QuickAccess /><Footer /></main>;
}
