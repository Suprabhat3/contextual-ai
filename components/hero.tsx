'use client';

import React, { useState, useEffect } from 'react';
import { Upload, MessageSquare, Zap, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Interfaces remain the same
interface ProcessStep {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  color: string;
  borderColor: string;
  shadowColor: string;
}

interface TrustMetric {
  value: string;
  label: string;
}

interface DemoCard {
  filename: string;
  question: string;
  answer: string;
  iconColor: string;
  position: string;
  rotation: string;
}

const ContextualAIHero: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 2500);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const steps: ProcessStep[] = [
    {
      icon: Upload,
      text: "Upload Document",
      color: "text-cyan-600",
      borderColor: "border-cyan-500",
      shadowColor: "shadow-cyan-500/25"
    },
    {
      icon: MessageSquare,
      text: "Ask Questions",
      color: "text-blue-600",
      borderColor: "border-blue-500",
      shadowColor: "shadow-blue-500/25"
    },
    {
      icon: Zap,
      text: "Get AI Answers",
      color: "text-indigo-600",
      borderColor: "border-indigo-500",
      shadowColor: "shadow-indigo-500/25"
    }
  ];

  const trustMetrics: TrustMetric[] = [
    { value: "10k+", label: "Documents Processed" },
    { value: "50k+", label: "Questions Answered" },
    { value: "99.9%", label: "Accuracy Rate" }
  ];

  const demoCards: DemoCard[] = [
    {
      filename: "Research Paper.pdf",
      question: "What are the main findings?",
      answer: "The study reveals three key insights about machine learning applications...",
      iconColor: "text-cyan-600",
      position: "absolute top-20 right-10 hidden lg:block",
      rotation: "transform rotate-2 hover:rotate-0"
    },
    {
      filename: "Manual.csv",
      question: "How do I configure this?",
      answer: "To configure the system, navigate to Settings and...",
      iconColor: "text-blue-600",
      position: "absolute bottom-32 left-10 hidden lg:block",
      rotation: "transform -rotate-2 hover:rotate-0"
    }
  ];

  const router = useRouter();
  const handleGetStarted = (): void => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Subtle mouse follower */}
      <div
        className="absolute w-96 h-96 pointer-events-none rounded-full"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, transparent 60%)',
          transition: 'transform 0.2s ease-out',
        }}
      />

      {/* Subtle background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-cyan-50 to-white rounded-full filter blur-3xl opacity-60 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-100 to-white rounded-full filter blur-3xl opacity-60 animate-[pulse_10s_ease-in-out_infinite_2s]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Main content */}
          <div className={`text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {/* Clean logo/icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md">
                <span><img src="/logo.png" alt="Contextual AI Logo" className='rounded-md' /></span>
              </div>
            </div>

            {/* Clean main heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Contextual AI
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              Transform your data into intelligent conversations.
            </p>

            {/* Description */}
            <p className="text-base text-slate-500 mb-12 max-w-2xl mx-auto">
              Upload any PDF or document and get precise, contextual answers. Our advanced <br />
              <span className="text-blue-600 font-semibold">RAG technology</span> understands your documents, so you don't have to.
            </p>

            {/* Process visualization */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 mb-16">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === index;
                return (
                  <div key={index} className="flex flex-col items-center relative">
                    <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? `${step.borderColor} bg-white ${step.color} scale-110 shadow-lg ${step.shadowColor}`
                        : 'border-slate-200 bg-white/50 text-slate-400'
                    }`}>
                      <IconComponent className="w-9 h-9" />
                    </div>
                    <p className={`mt-4 font-semibold transition-colors duration-500 ${
                      isActive ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {step.text}
                    </p>
                    {index < steps.length - 1 && (
                      <ArrowRight className={`hidden md:block absolute left-full top-8 w-8 h-8 transition-all duration-500 ml-4 ${
                        isActive ? 'text-slate-500 opacity-100' : 'text-slate-300 opacity-0'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA button */}
            <div className="flex justify-center">
              <button
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-blue-600 text-white font-bold text-base rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/40 flex items-center gap-3"
              >
                <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                Start Chatting with your Document
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-20 pt-8">
              <p className="text-slate-500 text-sm mb-6">Trusted by researchers, students, and professionals</p>
              <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12">
                {trustMetrics.map((metric, index) => (
                  <React.Fragment key={index}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-800">
                        {metric.value}
                      </div>
                      <div className="text-sm text-slate-500">
                        {metric.label}
                      </div>
                    </div>
                    {index < trustMetrics.length - 1 && (
                      <div className="hidden sm:block w-px h-12 bg-slate-200" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Floating demo cards */}
          {demoCards.map((card, index) => (
            <div key={index} className={card.position}>
              <div className={`bg-white/60 backdrop-blur-lg border border-slate-200 rounded-2xl p-5 w-72 ${card.rotation} transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{card.filename}</span>
                </div>
                <div className="text-sm text-slate-500 mb-3">💬 "{card.question}"</div>
                <div className="text-sm text-slate-600 bg-slate-100 rounded-lg p-3">
                  <span className="font-semibold text-slate-800">🤖 AI:</span> {card.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextualAIHero;