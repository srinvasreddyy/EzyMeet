import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

function GoogleSuccess() {
  const navigate = useNavigate();
  const { state } = useAuthContext();

  useEffect(() => {
    if (!state?.user) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
    return () => clearTimeout(timer);
  }, [state?.user, navigate]);

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon">✅</div>
        <h1 className="status-title status-title-success">Login Successful!</h1>
        <p className="status-text">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}

export default GoogleSuccess;