import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleFailure() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon">❌</div>
        <h1 className="status-title status-title-error">Login Failed</h1>
        <p className="status-text">Something went wrong. Redirecting you to sign in...</p>
      </div>
    </div>
  );
}

export default GoogleFailure;