import { useEffect, useState } from 'react';
import MeetCard from '../components/MeetCard';
import { FaExclamationCircle, FaSpinner, FaCalendarTimes } from 'react-icons/fa';

const Dashboard = () => {
  const [meets, setMeets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    const fetchMeets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/meet', {
          method: "GET",
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw (data);
        setMeets(data || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAutoEnabled = async () => {
      try {
        const response = await fetch('/api/auto-enabled', {
          method: 'GET',
          credentials: 'include',
        });
        const { autoEnabled } = await response.json();
        setAutoEnabled(autoEnabled || false);
      } catch (error) {
        console.error("Error fetching auto-enabled status:", error);
      }
    };

    fetchMeets();
    fetchAutoEnabled();
  }, []);

  const handleToggleChange = async () => {
    setAutoEnabled(!autoEnabled);
    try {
      await fetch('/api/auto-enabled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autoEnabled: !autoEnabled }),
      });
    } catch (error) {
      console.error("Error updating auto-enabled status:", error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Meet Dashboard</h1>

        <div className="toggle-container">
          <span className="toggle-label">Auto email reports</span>
          <button
            className={`toggle-btn ${autoEnabled ? 'toggle-btn-on' : 'toggle-btn-off'}`}
            onClick={handleToggleChange}
          >
            <span className={`toggle-knob ${autoEnabled ? 'toggle-knob-on' : 'toggle-knob-off'}`} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="dashboard-empty">
          <FaSpinner className="icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-purple)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading meets...</span>
        </div>
      )}

      {error && (
        <div className="dashboard-empty">
          <FaExclamationCircle className="icon" style={{ color: '#f87171' }} />
          <span style={{ color: '#f87171' }}>{error}</span>
        </div>
      )}

      {!loading && !error && meets.length === 0 && (
        <div className="dashboard-empty">
          <FaCalendarTimes className="icon" style={{ color: 'var(--text-muted)' }} />
          <span>No meets available.</span>
        </div>
      )}

      <div className="dashboard-grid">
        {meets.map(meet => (
          <MeetCard
            key={meet._id}
            meet={meet}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}
    </div>
  );
};

export default Dashboard;
