"use client";

import { useState, useEffect } from "react";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
  const features = [
    {
      number: "01",
      title: "Intelligent Email Generation",
      description: "Transform your thoughts into professional emails with AI-powered generation that understands context and tone.",
      iconType: "sparkles",
      visualType: "brain",
    },
    {
      number: "02",
      title: "Smart Email Summarization",
      description: "Quickly grasp the essence of lengthy email threads with our advanced summarization technology.",
      iconType: "activity",
      visualType: "chart",
    },
    {
      number: "03",
      title: "Secure & Private",
      description: "Your data remains yours. We never store your emails or use them for training models.",
      iconType: "shield",
      visualType: "lock",
    },
    {
      number: "04",
      title: "Lightning Fast",
      description: "Experience sub-second response times with our optimized AI models and efficient processing pipeline.",
      iconType: "zap",
      visualType: "speed",
    },
  ];

  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            How it works
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-6">
            Powerful features
            <br />
            <span className="text-primary">that deliver</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Experience the future of email communication with our suite of intelligent tools designed to save you time and enhance productivity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.number}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  return (
    <div className="group relative">
      <div
        className={`flex h-[220px] w-full items-end group-hover:scale-[1.02] transition-transform duration-500 ${
          index % 2 === 0
            ? "lg:pl-20 lg:pr-0"
            : "lg:pl-0 lg:pr-20"
        }`}
      >
        <div
          className={`flex-1 grid place-items-center bg-background/50 backdrop-blur-sm rounded-xl border border-foreground/10 p-8 transition-all duration-500 group-hover:border-primary/20 ${
            index % 2 === 0
              ? "lg:pl-0 lg:pr-4"
              : "lg:pl-4 lg:pr-0"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary ${feature.iconType === "sparkles" && "animate-pulse"}`}
              >
                {/* Icon would go here */}
                {feature.iconType === "sparkles" && (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2.25c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zm0 17.25c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zm0-10.5c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zM3.75 4.69c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zm16.5 0c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zM4.69 18.56c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31zm11.31-11.31c-1.276 0-2.31 1.034-2.31 2.31s1.034 2.31 2.31 2.31 2.31-1.034 2.31-2.31-1.034-2.31-2.31-2.31z"/>
                  </svg>
                )}
                {feature.iconType === "activity" && (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                )}
                {feature.iconType === "shield" && (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 16l-2.92 2.84L12 15.72l-2.92-2.84L5.82 16l-5-4.87z"/>
                  </svg>
                )}
                {feature.iconType === "zap" && (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 3L3 9h6l4 11 8-5-6-2 4-7Z"/>
                  </svg>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        </div>
        <div className={`flex-shrink-0 w-48 h-40 relative ${index % 2 === 0 ? "lg:mt-0 lg:mb-4" : "lg:mt-4 lg:mb-0"} `}>
          <div className="absolute inset-0 flex items-center justify-center">
            {feature.visualType === "brain" && (
              <AnimatedVisual type="brain" />
            )}
            {feature.visualType === "chart" && (
              <AnimatedVisual type="chart" />
            )}
            {feature.visualType === "lock" && (
              <AnimatedVisual type="lock" />
            )}
            {feature.visualType === "speed" && (
              <AnimatedVisual type="speed" />
            )}
            {feature.visualType === "ai" && (
              <AnimatedVisual type="ai" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "brain":
      return <BrainVisual />;
    case "chart":
      return <ChartVisual />;
    case "lock":
      return <LockVisual />;
    case "speed":
      return <SpeedVisual />;
    case "ai":
      return <AIVisual />;
    default:
      return <AIVisual />;
  }
}

function BrainVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <path
        d="M100 20 C80 20 60 40 60 60 C60 80 80 100 100 100 C120 100 140 80 140 60 C140 40 120 20 100 20 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.2"
      />
      <circle cx="100" cy="80" r="30" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
    </svg>
  );
}

function ChartVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="40" y="60" width="20" height="60" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="80" y="40" width="20" height="80" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="120" y="50" width="20" height="70" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="60" y1="140" x2="140" y2="140" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function LockVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="70" y="50" width="60" height="80" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="40" r="15" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M90 50 Q100 30 110 50" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    </svg>
  );
}

function SpeedVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <circle cx="100" cy="80" r="60" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.1" />
      <path
        d="M100 20 L100 140 M40 80 L160 80"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      />
      <path d="M100 20 L110 40 L90 40 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    </svg>
  );
}

// Fixed AIVisual component to prevent hydration mismatch
function AIVisual() {
  const [count, setCount] = useState(12);
  const [radius, setRadius] = useState(60);
  const [points, setPoints] = useState(Array.from({ length: 12 }, (_, i) => i));

  useEffect(() => {
    setPoints(Array.from({ length: count }, (_, i) => i));
  }, [count]);

  // Helper to round numbers to 12 decimal places to prevent hydration mismatches
  const round12 = (num) => Math.round(num * 1e12) / 1e12;

  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <circle cx="100" cy="80" r="80" stroke="currentColor" strokeWidth="1" opacity="0.1" />
      {points.map((point, i) => {
        const angle = (i / count) * Math.PI * 2;
        // Calculate and round coordinates to prevent hydration mismatches
        const x = round12(100 + Math.cos(angle) * radius);
        const y = round12(80 + Math.sin(angle) * radius);
        return (
          <g key={i}>
            {/* Connection line */}
            <line
              x1="100"
              y1="80"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            {/* Animated dot */}
            <circle
              cx={x}
              cy={y}
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${x} ${y}`}
                to={`360 ${x} ${y}`}
                dur="20s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}