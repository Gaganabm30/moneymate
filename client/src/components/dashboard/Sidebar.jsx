import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiHome,
  FiCreditCard,
  FiPieChart,
  FiTarget,
  FiCpu,
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiX
} from "react-icons/fi";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiHome />
        }
      ]
    },
    {
      title: "MONEY",
      items: [
        {
          name: "Transactions",
          path: "/transactions",
          icon: <FiCreditCard />
        },
        {
          name: "Budgets",
          path: "/budgets",
          icon: <FiPieChart />
        }
      ]
    },
    {
      title: "PLANNING",
      items: [
        {
          name: "Goals",
          path: "/goals",
          icon: <FiTarget />
        }
      ]
    },
    {
      title: "INTELLIGENCE",
      items: [
        {
          name: "AI Insights",
          path: "/ai-insights",
          icon: <FiCpu />
        },
        {
          name: "Analytics",
          path: "/analytics",
          icon: <FiBarChart2 />
        }
      ]
    },
    {
      title: "ACCOUNT",
      items: [
        {
          name: "Profile",
          path: "/profile",
          icon: <FiUser />
        }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
        {/* ================= BRAND ================= */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            M
          </div>

          <div className="brand-text">
            <div className="brand-name">
              MoneyMate <span>AI</span>
            </div>

            <div className="brand-tagline">
              Smart Finance
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              className="sidebar-close-mobile"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="sidebar-navigation">
          {menuSections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">
                {section.title}
              </p>

              <div className="sidebar-items">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="sidebar-icon">
                      {item.icon}
                    </span>

                    <span className="sidebar-link-text">
                      {item.name}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ================= LOGOUT ================= */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}