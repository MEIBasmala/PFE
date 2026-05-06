import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
        transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
      }}
      className={[
        "fixed bottom-6 right-6 z-50",
        "w-11 h-11 rounded-full",
        "bg-[hsl(var(--orange))] text-white",
        "shadow-[0_4px_14px_hsl(var(--orange)/0.4)]",
        "flex items-center justify-center",
        "border-none cursor-pointer",
        "hover:-translate-y-1 hover:shadow-[0_8px_20px_hsl(var(--orange)/0.5)]",
        "transition-[box-shadow,transform] duration-200",
        "active:scale-95",
      ].join(' ')}
    >
      <ArrowUp size={18} />
    </button>
  );
};

export default ScrollToTop;