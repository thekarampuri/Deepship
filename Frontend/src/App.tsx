import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/LandingPage/Navbar';
import Hero from './components/LandingPage/Hero';
import StatsBar from './components/LandingPage/StatsBar';
import FeaturesGrid from './components/LandingPage/FeaturesGrid';
import CTASection from './components/LandingPage/CTASection';
import Footer from './components/LandingPage/Footer';
import LoginPage from './components/LoginPage/LoginPage';
import Dashboard from './components/Dashboard/Dashboard';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-dim selection:bg-primary-container selection:text-on-primary-container">
      <Navbar onSignIn={() => navigate('/loginpage')} />
      <main>
        <Hero onSignUp={() => navigate('/loginpage')} />
        <StatsBar />
        <FeaturesGrid />
        <CTASection onSignUp={() => navigate('/loginpage')} />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/loginpage" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
