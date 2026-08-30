import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDashboardLine,
  RiExchangeDollarLine,
  RiPieChartLine,
  RiBarChart2Line,
  RiFlag2Line,
  RiUserLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";

import { useAuth } from "../../context/AuthContext";
import "../../styles/sidebar.css";

const NAV_ITEMS = [
  { to: "/dashboard",    icon: <RiDashboardLine />,      label: "Dashboard" },
  { to: "/transactions", icon: <RiExchangeDollarLine />, label: "Transactions" },
  { to: "/budgets",      icon: <RiPieChartLine />,       label: "Budgets" },
  { to: "/analytics",   icon: <RiBarChart2Line />,       label: "Analytics" },
  { to: "/goals",        icon: <RiFlag2Line />,           label: "Goals" },
];

const BOTTOM_ITEMS = [
  { to: "/profile",  icon: <RiUserLine />,     label: "Profile" },
];

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: (i) => ({
    x: 0, opacity: 1,
    transition: { delay: i * 0.06, duration: 0.25, ease: "easeOut" },
  }),
};

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar${isOpen ? " open" : ""}`}
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand */}
        <Link to="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="sidebar-logo">M</div>
          <div className="sidebar-brand-text">
            <h2>MoneyMate</h2>
            <span>Finance Intelligence</span>
          </div>
        </Link>

        {/* Main nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main Menu</span>
          {NAV_ITEMS.map((item, i) => (
            <motion.div key={item.to} custom={i} variants={itemVariants} initial="hidden" animate="visible">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 8 }}>Account</span>
          {BOTTOM_ITEMS.map((item, i) => (
            <motion.div key={item.to} custom={i + NAV_ITEMS.length} variants={itemVariants} initial="hidden" animate="visible">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer: user + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email || ""}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>
            <span className="sidebar-link-icon"><RiLogoutBoxRLine /></span>
            Sign out
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;