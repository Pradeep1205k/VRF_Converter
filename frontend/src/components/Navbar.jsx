import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between py-6">
      <Link to="/dashboard" className="font-display text-xl tracking-tight">
        Video Manipulator
      </Link>
      <div className="flex items-center gap-4 text-sm font-semibold">
        {user ? (
          <>
            <NavLink to="/dashboard" className="hover:text-ember">
              Dashboard
            </NavLink>
            <NavLink to="/images" className="hover:text-ember">
              Images
            </NavLink>
            <NavLink to="/history" className="hover:text-ember">
              History
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-ink px-4 py-2 hover:bg-ink hover:text-sand"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="hover:text-ember">
              Login
            </NavLink>
            <NavLink to="/register" className="hover:text-ember">
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
