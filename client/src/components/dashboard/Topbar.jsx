import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiMenu
} from "react-icons/fi";

export default function Topbar({ searchQuery = "", onSearchChange, onToggleMobileSidebar, user }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "MM";

  return (
    <header className="dashboard-topbar">
      {/* LEFT: Mobile Menu Button & Search Bar */}
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <FiMenu />
        </button>

        <div className="topbar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* RIGHT: Notifications, Profile */}
      <div className="topbar-right">
        <button
          className="topbar-icon-btn notification-btn"
          aria-label="Notifications"
        >
          <FiBell />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-profile">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email ? "Personal Account" : "Personal Account"}</span>
          </div>

          <FiChevronDown className="profile-arrow" />
        </div>
      </div>
    </header>
  );
}