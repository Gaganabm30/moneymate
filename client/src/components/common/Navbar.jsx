import { Link, useLocation } from "react-router-dom";
import { RiMenu2Line, RiSearch2Line, RiBellLine, RiSettings4Line } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import "../../styles/topbar.css";

const PAGE_TITLES = {
  "/dashboard":    { greeting: "Welcome back", title: "" },
  "/transactions": { greeting: "Manage your money", title: "Transactions" },
  "/budgets":      { greeting: "Stay on track", title: "Budgets" },
  "/analytics":    { greeting: "Money intelligence", title: "Analytics" },
  "/goals":        { greeting: "Make it happen", title: "Goals" },
  "/profile":      { greeting: "Your account", title: "Profile" },
  "/settings":     { greeting: "Preferences", title: "Settings" },
};

function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const meta = PAGE_TITLES[pathname] || { greeting: "MoneyMate", title: "" };
  const displayTitle = pathname === "/dashboard"
    ? `Good ${getTimeOfDay()}, ${user?.name?.split(" ")[0] || "there"} 👋`
    : meta.title;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="topbar">
      <button
        className="topbar-menu-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <RiMenu2Line />
      </button>

      <div className="topbar-left">
        {pathname === "/dashboard" && (
          <span className="topbar-greeting">{meta.greeting}</span>
        )}
        <span className="topbar-title">{displayTitle}</span>
      </div>

      <div className="topbar-search">
        <RiSearch2Line className="topbar-search-icon" />
        <input placeholder="Search transactions, budgets…" />
      </div>

      <div className="topbar-right">
        <Link to="/settings" className="topbar-icon-btn" aria-label="Settings">
          <RiSettings4Line />
        </Link>

        <button className="topbar-icon-btn" aria-label="Notifications">
          <RiBellLine />
          <span className="notif-dot" />
        </button>

        <Link to="/profile" className="topbar-avatar" aria-label="Profile">
          {initials}
        </Link>
      </div>
    </header>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default Navbar;