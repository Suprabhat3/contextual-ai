// app/page.tsx
import Navbar from '@/components/Navbar';
import ContextualAIHero from '@/components/hero';
import HowItWorks from '@/components/how-it-work';
import SupportMyWork from '@/components/support';
import Footer from '@/components/footer';

export default function HomePage() {
  return (
    <>
      <Navbar />          {/* ← shows only on the home page */}
      <main className="pt-16 isolate"> {/* padding to clear the fixed navbar */}
        <ContextualAIHero />
        <HowItWorks />
        <SupportMyWork />
        <Footer />
      </main>
    </>
  );
}