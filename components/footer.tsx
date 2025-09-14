'use client';

import React from 'react';
import { 
  Github,
  Twitter,
  ExternalLink,
  Linkedin
} from 'lucide-react';

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Footer: React.FC = () => {
  const footerSections: FooterSection[] = [
    {
      title: "Product",
      links: [
        { title: "How it Works", href: "#how" },
        { title: "Features", href: "#features" },
        { title: "Pricing", href: "#pricing" },
        // { title: "API Documentation", href: "/docs", external: true }
      ]
    },
    {
      title: "Support",
      links: [
        { title: "Help Center", href: "/help" },
        { title: "Contact Us", href: "/contact" },
        { title: "Bug Reports", href: "/bugs" },
        { title: "Feature Requests", href: "/features" }
      ]
    },
    {
      title: "Company",
      links: [
        { title: "About", href: "/about" },
        { title: "Blog", href: "/blog" },
        { title: "Careers", href: "/careers" },
        { title: "Press Kit", href: "/press" }
      ]
    },
    {
      title: "Legal",
      links: [
        { title: "Privacy Policy", href: "/privacy" },
        { title: "Terms of Service", href: "/terms" },
        { title: "Cookie Policy", href: "/cookies" },
        { title: "GDPR", href: "/gdpr" }
      ]
    }
  ];

  const socialLinks: SocialLink[] = [
    {
      name: "GitHub",
      href: "https://github.com/Suprabhat3/contextual-ai",
      icon: Github
    },
    {
      name: "Twitter",
      href: "https://x.com/Suprabhat_3",
      icon: Twitter
    },
    {
      name: "Linkedin",
      href: "https://www.linkedin.com/in/suprabhatt/",
      icon: Linkedin
    }
  ];

  const currentYear = new Date().getFullYear();

  const handleLinkClick = (href: string, external?: boolean): void => {
    if (external) {
      window.open(href, '_blank', 'noopener noreferrer');
    } else {
      // For Next.js, you'd typically use router.push(href)
      console.log(`Navigating to: ${href}`);
    }
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid lg:grid-cols-5 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                  <span><img src="/logo.png" alt="Contextual AI Logo" className='rounded-md' /></span>
                </div>
                <span className="text-xl font-bold text-slate-900">Contextual AI</span>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Transform your documents into intelligent conversations with our advanced RAG technology.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <button
                      key={social.name}
                      onClick={() => handleLinkClick(social.href, true)}
                      className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-all duration-200"
                      aria-label={social.name}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
              {footerSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-slate-800 font-semibold mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.title}>
                        <button
                          onClick={() => handleLinkClick(link.href, link.external)}
                          className="text-slate-500 hover:text-slate-900 transition-colors duration-200 text-sm flex items-center gap-1 group"
                        >
                          {link.title}
                          {link.external && (
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom Footer */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-slate-500 text-sm">
                © {currentYear} Contextual AI. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>Made with ❤️ for the community by Suprabhat</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;