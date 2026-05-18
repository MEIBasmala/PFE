// src/pages/Contact.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '@/components/layout';

import { toast } from '@/hooks/use-toast';
import {
  ScrollToTop,
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Label,
  Badge,
  Separator,
} from '@/components/ui';

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
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm font-semibold tracking-wide uppercase inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> Get in Touch
          </Badge>
          <h1 className="font-syne text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-[hsl(var(--green-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-[hsl(var(--text-m))] max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      <Separator className="mx-[6%]" />

      {/* Contact Form & Info */}
      <section className="py-16 px-[6%]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Left – Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-syne text-3xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--green-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
                Contact Information
              </h2>
              <p className="text-[hsl(var(--text-m))]">
                You can reach us through any of the channels below. We aim to respond within 24 hours.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center">
                  <Mail size={18} className="text-[hsl(var(--green-dark))]" />
                </div>
                <div>
                  <p className="font-medium text-[hsl(var(--text-dark))]">Email</p>
                  <a href="mailto:hello@khabirlens.com" className="text-[hsl(var(--text-m))] hover:text-[hsl(var(--orange))] transition-colors">
                    hello@khabirlens.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center">
                  <Phone size={18} className="text-[hsl(var(--green-dark))]" />
                </div>
                <div>
                  <p className="font-medium text-[hsl(var(--text-dark))]">Phone</p>
                  <a href="tel:+213123456789" className="text-[hsl(var(--text-m))] hover:text-[hsl(var(--orange))] transition-colors">
                    +213 123 456 789
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center">
                  <MapPin size={18} className="text-[hsl(var(--green-dark))]" />
                </div>
                <div>
                  <p className="font-medium text-[hsl(var(--text-dark))]">Office</p>
                  <p className="text-[hsl(var(--text-m))]">Algiers, Algeria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Full Name
                  </Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="bg-white/90 border-gray-200 focus:border-[hsl(var(--green))] focus:ring-2 focus:ring-[hsl(var(--green-light))]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="bg-white/90 border-gray-200 focus:border-[hsl(var(--green))] focus:ring-2 focus:ring-[hsl(var(--green-light))]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-[0.8px] text-[hsl(var(--text-m))]">
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us about your health goals or any questions..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="bg-white/90 border-gray-200 focus:border-[hsl(var(--green))] focus:ring-2 focus:ring-[hsl(var(--green-light))] resize-none"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {submitting ? 'Sending…' : <><Send size={16} /> Send Message</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;