// src/components/layout/DashboardLayout.tsx
import { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import NotificationDropdown from '@/components/ui/NotificationDropdown';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  navItems?: NavItem[];
  sections?: { title: string; items: NavItem[] }[];
  userName: string;
  userRole: string;
  userAvatar: string;
  logoImg?: string;
}

const DashboardLayout = ({
  children,
  title,
  navItems = [],
  sections,
  userName,
  userRole,
  userAvatar,
  logoImg
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem) => (
    <Link
      key={item.id}
      to={item.path}
      className={`sb-item ${isActive(item.path) ? 'active' : ''}`}
      onClick={() => setSidebarOpen(false)}
    >
      <span className="sb-ico"><i className={`fas fa-${item.icon}`} /></span>
      <span>{item.label}</span>
      {item.badge && <span className="sb-badge">{item.badge}</span>}
    </Link>
  );

  const allItems = sections ? sections.flatMap(s => s.items) : navItems;
  const currentItem = allItems.find(i => isActive(i.path));
  const pageTitle = currentItem?.label || title;
  return (
    <div className="flex min-h-screen warm-bg">
      <div
        className={`kl-sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`kl-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <Link to="/" className="sb-logo group no-underline">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center transition-transform group-hover:rotate-[8deg]">
            <img src="../img/logo.png" alt="KhabirLens" className="w-full h-full object-contain p-0.5" />
          </div>
          <span className="font-syne font-extrabold text-[1.3rem] text-kl-green-dark tracking-tight">
            Khabir
            <span className="bg-gradient-to-br from-kl-green to-kl-orange bg-clip-text text-transparent">
              Lens
            </span>
          </span>
        </Link>


        <nav className="sb-nav">
          {sections
            ? sections.map((section, idx) => (
              <div key={idx}>
                <div className="sb-section">{section.title}</div>
                {section.items.map(renderNavItem)}
                {idx < sections.length - 1 && <hr className="sb-divider" />}
              </div>
            ))
            : navItems.map(renderNavItem)}
        </nav>

        <div className="sb-bottom">
          <button
            className="sb-item text-kl-error hover:bg-kl-error-light"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            <span className="sb-ico">
              <LogOut size={16} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main
        className="kl-main flex-1 min-h-screen flex flex-col"
        style={{ marginLeft: 240 }}
      >
        <div className="kl-topbar">
          <div className="flex items-center gap-3 flex-1">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              <i className="fas fa-bars" />
            </button>
            <div className="tb-title">{pageTitle}</div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div
              className="flex items-center gap-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                const role = userRole.toUpperCase();
                const profilePath =
                  role === "PATIENT" ? "/patient/profile" :
                    role === "NUTRITIONIST" ? "/nutritionist/profile" :
                        "/profile";
                navigate(profilePath);
              }}
            >
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-[0.9rem] font-bold text-kl-text-dark shadow-[0_2px_8px_rgba(194,230,110,0.35)] transition-all group-hover:-translate-y-0.5"
                style={{ width: 36, height: 36, fontSize: "0.9rem" }}
              >
                {userAvatar}
              </div>
              <div className="user-info-topbar">
                <div className="text-[0.86rem] font-semibold text-kl-text-dark">
                  {userName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content area with floating food background */}
        <div className="kl-content flex-1 p-8 max-md:p-4 page-enter relative">
          {/* Floating food layer - appears on all dashboards */}
          <div className="food-float-layer">
            <div className="food-float food-1">🥑</div>
            <div className="food-float food-2">🥗</div>
            <div className="food-float food-3">🍎</div>
            <div className="food-float food-4">🥦</div>
            <div className="food-float food-5">🍓</div>
            <div className="food-float food-6">🥝</div>
          </div>
          {/* Actual page content */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;