"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SecuritySection } from "@/components/landing/customer";
import { DevelopersSection } from "@/components/landing/benifits";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

const BACKEND_URL = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? ""        // production: use /api/* rewrite (same origin)
  : "http://localhost:5000"  // local: direct to Flask

export default function Home() {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndRedirect = async () => {
      // Only auto-redirect if the user just came back from OAuth
      // (referrer is Google, the backend, or empty on a fresh server redirect)
      const referrer = document.referrer;
      const isOAuthReturn =
        referrer === "" ||
        referrer.includes("accounts.google.com") ||
        referrer.includes("onrender.com");

      if (!isOAuthReturn) return; // user navigated here manually — let them stay

      try {
        const res = await fetch(`${BACKEND_URL}/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if ("emailAddress" in data) {
            router.replace("/generate");
          }
        }
      } catch {
        // not logged in — stay on landing page
      }
    };

    checkAndRedirect();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <DevelopersSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}