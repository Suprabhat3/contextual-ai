'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';


interface ProductCardProps {
  imageSrc: string;
  name: string;
  features: string[];
  url: string; 
}

const ProductCard: React.FC<ProductCardProps> = ({ imageSrc, name, features, url }) => {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block group"
    >
      <div className="h-full bg-slate-800/50 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 group-hover:border-slate-700 group-hover:bg-slate-800 group-hover:-translate-y-1">
        <div className="aspect-video bg-slate-700/50 overflow-hidden">
          <img 
            src={imageSrc} 
            alt={`${name} product preview`} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">{name}</h3>
          <ul className="space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </a>
  );
};

// Main Section Component
const ProductsSection: React.FC = () => {
  const products = [
    {
      imageSrc: "/cp.png",
      name: "Chhaya Persona",
      features: [
        "Conversations with the Greatest Minds",
        "AI Power Persona",
        "Open-Source"
      ],
      url: "https://chhayapersona.suprabhat.site/" 
    },
    {
      imageSrc: "/hirementies.png",
      name: "HireMentis",
      features: [
        "Ace Your Next Interview with AI-Powered Practice",
        "Realistic AI Interviews",
        "Instant AI Feedback"
      ],
      url: "https://www.hirementis.site/"
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Our Other AI Products for <br /><span className="text-blue-400">Every Need</span>
          </h2>
          <p className="text-lg text-slate-400">
            Powerful, intuitive tools designed to help you extract maximum value from your documents with ease and precision.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard 
              key={index}
              imageSrc={product.imageSrc}
              name={product.name}
              features={product.features}
              url={product.url} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;