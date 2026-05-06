// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-kl-white border-t border-kl-gray-line mt-16">
      <div className="max-w-[1200px] mx-auto px-[6%] pt-12 pb-8">
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] text-center md:text-left">
          {/* Brand */}
          <div>
            <div className="font-syne text-xl font-[800] text-kl-green-dark flex items-center gap-2 mb-4 justify-center md:justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-sm">
                <img src="/img/logo.png" alt="KhabirLens" className="w-7 h-7 rounded-lg" />
              </div>
              Khabir<span className="text-kl-orange">Lens</span>
            </div>
            <p className="text-kl-text-m text-[0.85rem] leading-relaxed mb-5">
              AI-powered nutrition platform helping you eat smarter and live better.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {['facebook-f', 'twitter', 'instagram', 'linkedin-in'].map(icon => (
                <a
                  key={icon}
                  href="#"
                  className="w-9 h-9 rounded-full bg-kl-green-light flex items-center justify-center text-kl-green-dark transition-all hover:bg-kl-orange hover:text-kl-white hover:-translate-y-0.5"
                >
                  <i className={`fab fa-${icon}`} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5">Quick Links</h4>
            <ul className="list-none space-y-3">
              {[{ to: '/', label: 'Home' }, { to: '/blog', label: 'Blog' }, { to: '/pricing', label: 'Pricing' }, { to: '/contact', label: 'Contact' }].map(l => (
                <li key={l.to}><Link to={l.to} className="text-kl-text-m no-underline text-[0.85rem] hover:text-kl-green-dark transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5">Resources</h4>
            <ul className="list-none space-y-3">
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'FAQs'].map(t => (
                <li key={t}><a href="#" className="text-kl-text-m no-underline text-[0.85rem] hover:text-kl-green-dark transition-colors">{t}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5">Contact Us</h4>
            <div className="space-y-3">
              <p className="flex items-center justify-center md:justify-start gap-3 text-kl-text-m text-[0.85rem]">
                <i className="fas fa-envelope w-5 text-kl-green-dark" /> hello@khabirlens.com
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3 text-kl-text-m text-[0.85rem]">
                <i className="fas fa-phone w-5 text-kl-green-dark" /> +213 123 456 789
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3 text-kl-text-m text-[0.85rem]">
                <i className="fas fa-map-marker-alt w-5 text-kl-green-dark" /> Constantine, Algeria
              </p>
            </div>
            <h4 className="font-syne text-base font-bold mt-4 mb-3">Newsletter</h4>
            <div className="flex max-w-md mx-auto md:mx-0">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 border-[1.5px] border-kl-gray-line rounded-l-[50px] bg-cream outline-none focus:border-kl-green text-sm"
              />
              <button className="bg-kl-orange border-none px-5 py-2.5 rounded-r-[50px] text-kl-white font-semibold cursor-pointer">
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-kl-gray-line pt-6 text-center text-kl-text-m text-xs flex flex-col md:flex-row justify-center md:justify-between items-center gap-4">
          <span>© 2026 KhabirLens. All rights reserved.</span>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map(l => (
              <a key={l} href="#" className="text-kl-text-m no-underline text-xs hover:text-kl-green-dark">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;