// src/components/layout/Footer.tsx
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleLinkClick = (e: React.MouseEvent, to: string) => {
    if (to.startsWith("#")) {
      e.preventDefault();
      scrollToSection(to.slice(1));
    }
  };

  return (
    <footer className="bg-[hsl(var(--pure-white))] border-t border-[hsl(var(--gray-line))] mt-16">
      <div className="max-w-[1200px] mx-auto px-[6%] pt-12 pb-8">
        <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] text-center md:text-left">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 group no-underline mb-4"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] flex items-center justify-center transition-transform group-hover:rotate-[8deg]">
                <img
                  src="/img/logo.png"
                  alt="KhabirLens"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span className="font-syne font-extrabold text-[1.3rem] text-[hsl(var(--green-dark))] tracking-tight">
                Khabir
                <span className="bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
                  Lens
                </span>
              </span>
            </Link>
            <p className="text-[hsl(var(--text-m))] text-[0.85rem] leading-relaxed mb-5 max-w-[240px] mx-auto md:mx-0">
              AI-powered nutrition platform helping you eat smarter and live
              better.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {["facebook-f", "twitter", "instagram", "linkedin-in"].map(
                (icon) => (
                  <a
                    key={icon}
                    href="#"
                    aria-label={icon}
                    className="w-9 h-9 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center text-[hsl(var(--green-dark))] transition-all hover:bg-[hsl(var(--orange))] hover:text-white hover:-translate-y-0.5"
                  >
                    <i className={`fab fa-${icon}`} />
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5 text-[hsl(var(--text-dark))]">
              Quick Links
            </h4>
            <ul className="list-none space-y-3">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleLinkClick(e, "#home")}
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#blog-section"
                  onClick={(e) => handleLinkClick(e, "#blog-section")}
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors cursor-pointer"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleLinkClick(e, "#pricing")}
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5 text-[hsl(var(--text-dark))]">
              Resources
            </h4>
            <ul className="list-none space-y-3">
              <li>
                <a
                  href="#"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/faqs"
                  className="text-[hsl(var(--text-m))] no-underline text-[0.85rem] hover:text-[hsl(var(--green-dark))] transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-syne text-base font-bold mb-5 text-[hsl(var(--text-dark))]">
              Contact Us
            </h4>
            <div className="space-y-3">
              <p className="flex items-center justify-center md:justify-start gap-3 text-[hsl(var(--text-m))] text-[0.85rem]">
                <i className="fas fa-envelope w-5 text-[hsl(var(--green-dark))]" />{" "}
                hello@khabirlens.com
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3 text-[hsl(var(--text-m))] text-[0.85rem]">
                <i className="fas fa-phone w-5 text-[hsl(var(--green-dark))]" />{" "}
                +213 123 456 789
              </p>
              <p className="flex items-center justify-center md:justify-start gap-3 text-[hsl(var(--text-m))] text-[0.85rem]">
                <i className="fas fa-map-marker-alt w-5 text-[hsl(var(--green-dark))]" />{" "}
                Constantine, Algeria
              </p>
            </div>

            <h4 className="font-syne text-base font-bold mt-5 mb-3 text-[hsl(var(--text-dark))]">
              Newsletter
            </h4>
            <div className="flex max-w-md mx-auto md:mx-0">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 border-[1.5px] border-[hsl(var(--gray-line))] rounded-l-full bg-[hsl(var(--cream-bg))] outline-none focus:border-[hsl(var(--green))] text-sm"
              />
              <button
                aria-label="Subscribe"
                className="bg-[hsl(var(--orange))] border-none px-5 py-2.5 rounded-r-full text-white font-semibold cursor-pointer transition-all hover:bg-[hsl(var(--green))] hover:-translate-y-0.5"
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-[hsl(var(--gray-line))] pt-6 text-center text-[hsl(var(--text-m))] text-xs flex flex-col md:flex-row justify-center md:justify-between items-center gap-4">
          <span>© 2026 KhabirLens. All rights reserved.</span>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-[hsl(var(--text-m))] no-underline text-xs hover:text-[hsl(var(--green-dark))]"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-[hsl(var(--text-m))] no-underline text-xs hover:text-[hsl(var(--green-dark))]"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-[hsl(var(--text-m))] no-underline text-xs hover:text-[hsl(var(--green-dark))]"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
