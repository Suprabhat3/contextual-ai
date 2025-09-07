'use client';

import React, { useState, useEffect } from 'react';
import { Upload, MessageSquare, Zap, FileText, ArrowRight, Sparkles } from 'lucide-react';
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
    }, 2500); // Slowed down the interval for a calmer feel

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
      text: "Upload PDF",
      color: "text-cyan-300",
      borderColor: "border-cyan-400",
      shadowColor: "shadow-cyan-500/10"
    },
    {
      icon: MessageSquare,
      text: "Ask Questions",
      color: "text-blue-300",
      borderColor: "border-blue-400",
      shadowColor: "shadow-blue-500/10"
    },
    {
      icon: Zap,
      text: "Get AI Answers",
      color: "text-indigo-300",
      borderColor: "border-indigo-400",
      shadowColor: "shadow-indigo-500/10"
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
      iconColor: "text-cyan-400",
      position: "absolute top-20 right-10 hidden lg:block",
      rotation: "transform rotate-2 hover:rotate-0"
    },
    {
      filename: "Manual.csv",
      question: "How do I configure this?",
      answer: "To configure the system, navigate to Settings and...",
      iconColor: "text-blue-400",
      position: "absolute bottom-32 left-10 hidden lg:block",
      rotation: "transform -rotate-2 hover:rotate-0"
    }
  ];

  const router = useRouter();
  const handleGetStarted = (): void => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* Subtle mouse follower */}
      <div
        className="absolute w-96 h-96 pointer-events-none rounded-full"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(148, 163, 184, 0.05) 0%, transparent 60%)',
          transition: 'transform 0.2s ease-out',
        }}
      />

      {/* Subtle background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full filter blur-3xl opacity-40 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-900/50 to-slate-900 rounded-full filter blur-3xl opacity-40 animate-[pulse_10s_ease-in-out_infinite_2s]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Main content */}
          <div className={`text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {/* Clean logo/icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
           <span><img src="/logo.png" alt="" className='rounded-md' /></span>
              </div>
            </div>

            {/* Clean main heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-100 mb-6 leading-tight">
              Contextual AI
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-400 mb-4 max-w-3xl mx-auto leading-relaxed">
              Transform your Data into intelligent conversations.
            </p>

            {/* Description */}
            <p className="text-base text-gray-300 mb-12 max-w-2xl mx-auto">
              Upload any PDF or other document and get precise, contextual answers. Our advanced <br />
              <span className="text-blue-400 font-semibold"> RAG technology</span> understands your documents, so you don't have to.
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
                        ? `${step.borderColor} bg-slate-800 ${step.color} scale-110 shadow-lg ${step.shadowColor}`
                        : 'border-slate-700 bg-slate-800/50 text-slate-500'
                    }`}>
                      <IconComponent className="w-9 h-9" />
                    </div>
                    <p className={`mt-4 font-semibold transition-colors duration-500 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}>
                      {step.text}
                    </p>
                    {index < steps.length - 1 && (
                      <ArrowRight className={`hidden md:block absolute left-full top-8 w-8 h-8 transition-all duration-500 ml-4 ${
                        isActive ? 'text-slate-400 opacity-100' : 'text-slate-700 opacity-0'
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
                className="group px-8 py-4 bg-blue-600 text-white font-bold text-base rounded-lg hover:bg-blue-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 flex items-center gap-3"
              >
                <Upload className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                Start Chatting with your Docx
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-20 pt-8">
              <p className="text-slate-400 text-sm mb-6">Trusted by researchers, students, and professionals</p>
              <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 text-slate-500">
                {trustMetrics.map((metric, index) => (
                  <React.Fragment key={index}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {metric.value}
                      </div>
                      <div className="text-sm text-slate-400">
                        {metric.label}
                      </div>
                    </div>
                    {index < trustMetrics.length - 1 && (
                      <div className="hidden sm:block w-px h-12 bg-slate-700" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Floating demo cards */}
          {demoCards.map((card, index) => (
            <div key={index} className={card.position}>
              <div className={`bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-2xl p-5 w-72 ${card.rotation} transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <FileText className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-200">{card.filename}</span>
                </div>
                <div className="text-sm text-gray-300 mb-3">💬 "{card.question}"</div>
                <div className="text-sm text-gray-200 bg-slate-700/50 rounded-lg p-3">
                  <span className="font-semibold text-gray-300">🤖 AI:</span> {card.answer}
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