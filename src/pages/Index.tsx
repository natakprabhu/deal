import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TopArticlesSection from "@/components/home/TopArticlesSection";
import MostTrackedSection from "@/components/home/MostTrackedSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HowItWorksSection />
        <TopArticlesSection />
        <MostTrackedSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
