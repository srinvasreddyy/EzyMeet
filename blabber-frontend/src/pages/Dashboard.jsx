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

  const dummyMeets = [
    {
      _id: "preview-1",
      meetingTitle: "Weekly Team Sync",
      convenor: "Alex (You)",
      blabberEmail: "alex@example.com",
      meetingStartTimeStamp: new Date(Date.now() - 3600000).toISOString(),
      meetingEndTimeStamp: new Date(Date.now() - 1800000).toISOString(),
      speakers: ["Alex", "Jordan", "Taylor"],
      attendees: ["Alex", "Jordan", "Taylor", "Sam"],
    },
    {
      _id: "preview-2",
      meetingTitle: "Client Discovery Call",
      convenor: "Alex (You)",
      blabberEmail: "alex@example.com",
      meetingStartTimeStamp: new Date(Date.now() - 86400000).toISOString(),
      meetingEndTimeStamp: new Date(Date.now() - 82800000).toISOString(),
      speakers: ["Alex", "Morgan"],
      attendees: ["Alex", "Morgan", "Casey"],
    }
  ];

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

      {!loading && !error && meets.length === 0 ? (
        <div className="empty-state-wrapper">
          <div className="empty-state-pulse"></div>
          
          <div className="empty-state-bg">
            <div className="dashboard-grid" style={{ opacity: 0.6, pointerEvents: 'none', filter: 'blur(3px) grayscale(0.2)', width: '100%' }}>
              {dummyMeets.map(meet => (
                <MeetCard
                  key={meet._id}
                  meet={meet}
                  isModalOpen={false}
                  setIsModalOpen={() => {}}
                />
              ))}
            </div>
          </div>
          
          <div className="empty-state-content">
            <div className="empty-state-icon">✨</div>
            <h2 className="empty-state-title">Your Dashboard is Empty</h2>
            <p className="empty-state-desc">
              Get ready to transform your meetings. Once you capture your first session, your transcripts, AI summaries, and actionable insights will appear right here.
            </p>
            <button className="btn-primary" onClick={() => window.open('https://meet.google.com/new', '_blank')}>
              Start a Google Meet
            </button>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {!loading && !error && meets.map(meet => (
            <MeetCard
              key={meet._id}
              meet={meet}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}
    </div>
  );
};

export default Dashboard;
