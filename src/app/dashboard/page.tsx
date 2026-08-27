import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/navigation/Footer";
import LearningSignals from "@/components/learning/LearningSignals";

export default function DashboardPage() {
  return (
    <main>
      <Navbar />
      <div className="section shell">
        <h1>Dashboard</h1>
        <p>Welcome back to your learner dashboard.</p>
      </div>
      <LearningSignals />
      <Footer />
    </main>
  );
}
