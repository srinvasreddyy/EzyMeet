import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';

function Navbar() {
  const { state, dispatch } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleLogout() {
    await fetch("/api/oauth/logout");
    toast.success("Logged out!");
    dispatch({ type: "LOGOUT" });
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="navbar-logo">
        EzyMeet
      </Link>

      <div className="navbar-links">
        {state?.user ? (
          <>
            <Link to="/" className="navbar-link">Home</Link>
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <span className="navbar-user">
              Hey, <strong>{state.user.name}</strong>
            </span>
            <button onClick={handleLogout} className="navbar-btn navbar-btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="navbar-link">Home</Link>
            <Link to="/welcome" className="navbar-link">About</Link>
            <Link to="/login" className="navbar-btn navbar-btn-primary" id="nav-signin">
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
