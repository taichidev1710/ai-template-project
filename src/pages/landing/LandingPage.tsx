import { useEffect } from 'react';
import './landing.css';
import { BRAND, TAGLINE } from './constants';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { Logos } from './sections/Logos';
import { Features } from './sections/Features';
import { Highlights } from './sections/Highlights';
import { Pricing } from './sections/Pricing';
import { Testimonials } from './sections/Testimonials';
import { CTA } from './sections/CTA';
import { Footer } from './sections/Footer';

/**
 * Public marketing landing page (Neon-style). Standalone surface with its own
 * scoped dark theme (see landing.css) — it does NOT use the admin design tokens
 * and does not flip with the app's light/dark mode. Route: paths.root ("/").
 */
export function LandingPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = `${BRAND} — ${TAGLINE}`;
    // The admin shell locks html/#root to height:100%; this page instead scrolls
    // the document (see landing.css) so mobile browsers behave. The class enables
    // smooth anchor-scroll + sticky-header offset on the real scroll host, scoped
    // to while the landing is mounted so the admin app is untouched.
    document.documentElement.classList.add('nl-scroll-host');
    return () => {
      document.title = prev;
      document.documentElement.classList.remove('nl-scroll-host');
    };
  }, []);

  return (
    <div className="neon-landing">
      <Header />
      <main>
        <Hero />
        <Logos />
        <Features />
        <Highlights />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
