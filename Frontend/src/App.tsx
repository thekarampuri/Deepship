import { useState } from 'react';
import Navbar from './components/LandingPage/Navbar';
import Hero from './components/LandingPage/Hero';
import StatsBar from './components/LandingPage/StatsBar';
import FeaturesGrid from './components/LandingPage/FeaturesGrid';
import CTASection from './components/LandingPage/CTASection';
import Footer from './components/LandingPage/Footer';
import LoginPage from './components/LoginPage/LoginPage';

function App() {
  const [view, setView] = useState<'landing' | 'login'>('landing');

  if (view === 'login') {
    return <LoginPage onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-surface-dim selection:bg-primary-container selection:text-on-primary-container">
      <Navbar onSignIn={() => setView('login')} />
      <main>
        <Hero onSignUp={() => setView('login')} />
        <StatsBar />
        <FeaturesGrid />
        <CTASection onSignUp={() => setView('login')} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
