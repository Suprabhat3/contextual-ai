'use client';

import React from 'react';
import {
  Heart,
  Coffee,
  Zap,
  Gift,
  Github,
  Twitter,
  Mail
} from 'lucide-react';

const SupportMyWork: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Support My <span className="text-blue-400">Work</span>
            </h2>
            <p className="text-lg text-slate-400 mb-6">
              If you find value in this project, consider supporting its continued development. Your contribution helps cover server costs and fuels future innovation.
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Heart className="w-4 h-4 text-blue-400" />
              <span>Made with passion by an independent developer</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-8 mb-16">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Scan to Support</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Use your preferred UPI app to make a contribution. Every donation, big or small, is deeply appreciated!
              </p>

              {/* QR Code */}
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mx-auto p-2 shadow-lg">
                <img src="/qr.png" alt="UPI QR Code" className="rounded-md w-full h-full" />
              </div>

              <div className="mt-6 text-xs text-slate-500">
                <p>Currently accepting payments via UPI within India.</p>
              </div>
            </div>
          </div>

          {/* Why Support Matters */}
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-white mb-4">Why Your Support Matters</h3>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Your contribution directly enables continued research, covers server costs, and allows for countless hours of development to bring new features to life.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Heart, title: 'Show Your Appreciation', description: 'Your support is a powerful motivator to keep this project alive and growing.' },
                { icon: Coffee, title: 'Fuel Development', description: 'Help power late-night coding sessions and creative breakthroughs.' },
                { icon: Zap, title: 'Accelerate Features', description: 'Enable faster feature releases and the addition of new AI capabilities.' },
                { icon: Gift, title: 'Unlock the Future', description: 'Contribute to building a more advanced and feature-rich platform for everyone.' }
              ].map((item, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 text-left flex items-center gap-5 transition-all hover:border-slate-700 hover:bg-slate-800">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connect with Me */}
          <div className="text-center pt-12 border-t border-slate-800">
             <h3 className="text-xl font-bold text-white mb-4">Connect & Stay Updated</h3>
             <p className="text-slate-400 mb-6">Follow the development journey or get in touch.</p>
             <div className="flex justify-center items-center gap-6">
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="GitHub">
                    <Github className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                    <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Email">
                    <Mail className="w-6 h-6" />
                </a>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SupportMyWork;