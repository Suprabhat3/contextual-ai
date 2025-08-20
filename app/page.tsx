import Navbar from '@/components/Navbar';
import ContextualAIHero from '@/components/hero';
import HowItWorks from '@/components/how-it-work';
import SupportMyWork from '@/components/support';
import OurProducts from '@/components/other';
import Footer from '@/components/footer';

export default function HomePage() {
  return (
    <>
      <Navbar />      
      <main className="pt-16 isolate">
        <ContextualAIHero />
        <div id="how"><HowItWorks /></div>
        <SupportMyWork />
        <OurProducts />
        <Footer />
      </main>
    </>
  );
}