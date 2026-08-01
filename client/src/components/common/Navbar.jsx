import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="muted">Welcome back</p>
        <h3>{user?.name}</h3>
      </div>

      <div className="avatar">
        {user?.name?.charAt(0)?.toUpperCase()}
      </div>
    </header>
  );
}

export default Navbar;