'use client';

import React, { useState } from 'react';
import {
  Upload,
  MessageSquare,
  Zap,
  FileText,
  Brain,
  CheckCircle,
  Shield,
  Rocket,
  Users,
} from 'lucide-react';

// Interfaces remain the same
interface WorkStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const workSteps: WorkStep[] = [
    {
      id: 0,
      title: "Upload Your Document",
      description: "Simply drag and drop or select your PDF, DOCX, or CSV file. All standard formats are supported.",
      icon: Upload,
      details: [
        "Supports files up to 5MB",
        "Works with text-based & scanned PDFs (OCR)",
        "Secure encrypted upload",
        "Instant processing starts on upload"
      ]
    },
    {
      id: 1,
      title: "AI Document Analysis",
      description: "Our RAG system intelligently breaks down, indexes, and creates vector embeddings of your document.",
      icon: Brain,
      details: [
        "Advanced text extraction & chunking",
        "Semantic understanding of content",
        "Contextual preservation for accuracy",
        "State-of-the-art vector embeddings"
      ]
    },
    {
      id: 2,
      title: "Ask Questions",
      description: "Interact with your document using natural language. Ask anything about the content.",
      icon: MessageSquare,
      details: [
        "Natural language query support",
        "Handles complex, multi-part questions",
        "Maintains conversational context",
        "Ask follow-up questions for clarity"
      ]
    },
    {
      id: 3,
      title: "Get Precise Answers",
      description: "Receive accurate, contextual answers with citations pointing to the exact source in your document.",
      icon: Zap,
      details: [
        "Source citations included with answers",
        "Page and section number references",
        "Confidence scoring for reliability",
        "Suggestions for related questions"
      ]
    }
  ];

  const features: Feature[] = [
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your documents are processed securely and are never stored permanently or used for training."
    },
    {
      icon: Rocket,
      title: "Lightning Fast",
      description: "Get answers in seconds with our optimized and scalable AI infrastructure."
    },
    {
      icon: Users,
      title: "Collaborate & Share (Coming Soon)",
      description: "Easily share documents and findings with team members for collaborative analysis."
    }
  ];

  return (
    <section className="py-20 bg-white text-slate-800">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
              How It <span className="text-blue-600">Works</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our RAG (Retrieval-Augmented Generation) technology makes it simple to extract valuable insights from your documents in four easy steps.
            </p>
          </div>

          {/* Interactive Steps */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Steps Navigation */}
            <div className="space-y-4">
              {workSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = activeStep === index;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`cursor-pointer p-6 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? 'border-blue-500 bg-slate-50 shadow-lg'
                        : 'border-slate-200 bg-transparent hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${
                        isActive ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-4 pl-16">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Demo */}
            <div className="relative">
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  </div>
                  <span className="text-slate-400 text-sm font-medium">AI Chat Interface</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <FileText className="w-4 h-4" />
                    <span>research-paper.pdf uploaded and analyzed.</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-500 mb-1">You:</p>
                    <p className="text-slate-800">What are the main conclusions of this research?</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-600 mb-2 font-medium">AI Assistant:</p>
                    <p className="text-slate-800">The paper concludes with three main findings:</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 list-disc list-inside">
                      <li>Model accuracy improved by 95% with the new method.</li>
                      <li>Data processing time was reduced by 60%.</li>
                      <li>Overall cost efficiency saw a 40% increase.</li>
                    </ul>
                    <p className="text-xs text-blue-500 mt-3 opacity-80">📄 Source: Page 15-17, Section 4.2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-10 border-t border-slate-200">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center p-6 bg-slate-50/50 border border-slate-200 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;