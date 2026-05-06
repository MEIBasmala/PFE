// src/pages/Contact.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {Navbar , Footer} from '@/components/layout';

import { toast } from '@/hooks/use-toast';
import {ScrollToTop} from '@/components/ui';
import { Mail, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import '../styles/homepage.css';

export const IMAGE_URLS = {
  contactBg: '../src/assets/creamBg.jpg',
} as const;

const Contact = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: 'Message sent!', description: "We'll get back to you soon." });
    setContactForm({ name: '', email: '', message: '' });
    setSubmitting(false);
  };

  return (
    <div className="warm-bg">
      <Navbar />
      <ScrollToTop />

      {/* Hero */}
      <section className="relative py-24 px-[6%] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${IMAGE_URLS.contactBg}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-kl-green-dark bg-kl-green-light/50 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles size={16} /> Get in Touch
          </span>
          <h1 className="font-syne text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-kl-green-dark to-kl-orange bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-kl-text-m max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-[6%]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Left – Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-syne text-3xl font-bold mb-4 bg-gradient-to-r from-kl-green-dark to-kl-orange bg-clip-text text-transparent">
                Contact Information
              </h2>
              <p className="text-kl-text-m">
                You can reach us through any of the channels below. We aim to respond within 24 hours.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-kl-green-light flex items-center justify-center">
                  <Mail size={18} className="text-kl-green-dark" />
                </div>
                <div>
                  <p className="font-medium text-kl-text-dark">Email</p>
                  <a href="mailto:hello@khabirlens.com" className="text-kl-text-m hover:text-kl-orange transition-colors">
                    hello@khabirlens.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-kl-green-light flex items-center justify-center">
                  <Phone size={18} className="text-kl-green-dark" />
                </div>
                <div>
                  <p className="font-medium text-kl-text-dark">Phone</p>
                  <a href="tel:+213123456789" className="text-kl-text-m hover:text-kl-orange transition-colors">
                    +213 123 456 789
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-kl-green-light flex items-center justify-center">
                  <MapPin size={18} className="text-kl-green-dark" />
                </div>
                <div>
                  <p className="font-medium text-kl-text-dark">Office</p>
                  <p className="text-kl-text-m">Algiers, Algeria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-kl-text-m mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-white/90 border border-gray-200 rounded-lg py-3 px-4 focus:border-kl-green focus:ring-2 focus:ring-kl-green-light transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-kl-text-m mb-1">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-white/90 border border-gray-200 rounded-lg py-3 px-4 focus:border-kl-green focus:ring-2 focus:ring-kl-green-light transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-kl-text-m mb-1">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your health goals or any questions..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-white/90 border border-gray-200 rounded-lg py-3 px-4 focus:border-kl-green focus:ring-2 focus:ring-kl-green-light transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-kl-orange to-orange-500 text-white font-semibold py-3 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
              >
                {submitting ? 'Sending…' : <><Send size={16} /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;