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
      <div className="h-full bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 group-hover:border-slate-300 group-hover:shadow-lg group-hover:-translate-y-1">
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img 
            src={imageSrc} 
            alt={`${name} product preview`} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{name}</h3>
          <ul className="space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
        "Ace Your Next Interview with AI",
        "Realistic AI Interviews",
        "Instant AI Feedback"
      ],
      url: "https://www.hirementis.site/"
    },
    // You can add a third product here to utilize the third column on large screens
    // {
    //   imageSrc: "/path-to-your-image.png",
    //   name: "Another Product",
    //   features: [
    //     "Feature A",
    //     "Feature B",
    //     "Feature C"
    //   ],
    //   url: "https://example.com"
    // },
  ];

  return (
    <section className="py-20 bg-slate-50 text-slate-800">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Our Other AI Products for <br /><span className="text-blue-600">Every Need</span>
          </h2>
          <p className="text-lg text-slate-600">
            Explore our suite of powerful, intuitive tools designed to bring the power of AI to your fingertips.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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