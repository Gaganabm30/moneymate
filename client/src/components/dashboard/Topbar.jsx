import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiMenu,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService";

export default function Topbar({
  searchQuery = "",
  onSearchChange,
  onToggleMobileSidebar,
  user,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MM";

  const fetchNotifs = async () => {
    try {
      const data = await getNotifications();
      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll notifications every 60s
    const timer = setInterval(fetchNotifs, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifs();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await markNotificationRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      if (notif.entityType === "bill" || notif.entityType === "recurring") {
        setIsOpen(false);
        navigate("/recurring");
      }
    } catch (err) {
      console.error("Notification click handler error:", err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "overdue":
        return <FiAlertCircle className="notif-type-icon overdue" />;
      case "reminder":
        return <FiClock className="notif-type-icon reminder" />;
      case "success":
        return <FiCheckCircle className="notif-type-icon success" />;
      default:
        return <FiInfo className="notif-type-icon info" />;
    }
  };

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
      <div className="topbar-right" ref={dropdownRef}>
        <div className="notification-wrapper" style={{ position: "relative" }}>
          <button
            className={`topbar-icon-btn notification-btn ${
              isOpen ? "active" : ""
            }`}
            aria-label="Notifications"
            onClick={toggleDropdown}
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notification-dot-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* IN-APP NOTIFICATIONS DROPDOWN */}
          {isOpen && (
            <div className="topbar-notifications-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-title-row">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <span className="unread-counter-pill">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    disabled={loading}
                  >
                    <FiCheck /> Mark all read
                  </button>
                )}
              </div>

              <div className="dropdown-content-list">
                {notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <FiBell className="empty-bell-icon" />
                    <p>No notifications right now.</p>
                    <span>Reminders and updates will appear here.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`notification-item-row ${
                        !notif.read ? "unread" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-icon-col">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="notif-body-col">
                        <div className="notif-title-line">
                          <strong>{notif.title || "Notification"}</strong>
                          {!notif.read && <span className="item-unread-dot" />}
                        </div>
                        <p>{notif.message}</p>
                        <span className="notif-time-ago">
                          {new Date(notif.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {(notifications.length > 0 || unreadCount > 0) && (
                <div className="dropdown-footer">
                  <button
                    type="button"
                    className="view-recurring-link"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/recurring");
                    }}
                  >
                    Go to Recurring Payments & Bills →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="topbar-profile">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || "Personal Account"}</span>
          </div>

          <FiChevronDown className="profile-arrow" />
        </div>
      </div>
    </header>
  );
}