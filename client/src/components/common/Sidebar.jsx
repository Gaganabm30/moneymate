import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-logo">M</div>

          <div>
            <h2>MoneyMate</h2>
            <span>Finance Intelligence</span>
          </div>
        </div>

        <nav>
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/transactions">
            Transactions
          </NavLink>

          <NavLink to="/budgets">
            Budgets
          </NavLink>

          <NavLink to="/analytics">
            Analytics
          </NavLink>

          <NavLink to="/goals">
            Goals
          </NavLink>
        </nav>
      </div>

      <button
        className="logout-button"
        onClick={logout}
      >
        Sign out
      </button>
    </aside>
  );
}

export default Sidebar;