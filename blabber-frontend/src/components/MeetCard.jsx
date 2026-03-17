import { useState } from 'react';
import Modal from 'react-modal';

// Helper function to format time to 12-hour AM/PM format with full date
const formatTime = (dateString) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true 
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

// Helper function to calculate meeting duration
const calculateDuration = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime - startTime;

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.ceil((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} hour(s) ${minutes} minute(s)`;
};

const reportTypes = [
    { value: 'normal', label: 'General Report' },
    { value: 'speaker_ranking', label: 'Speaker Report' },
    { value: 'sentiment', label: 'Sentiment Report' },
    { value: 'interval', label: 'Interval Based Report' }
  ];
  
  const reportFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' }
  ];
  
  // Modal Styles
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      borderRadius: '20px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-glass)',
      color: 'var(--text-primary)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    overlay: {
      backgroundColor: 'rgba(5, 5, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
    },
  };
  const MeetCard = ({ meet }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); // Move modal state here
    const [reportType, setReportType] = useState('');
    const [reportFormat, setReportFormat] = useState('');
    const [meetingTitle, setMeetingTitle] = useState(meet.meetingTitle); // Use meet title from props
    const [loading, setLoading] = useState(false);
    const [interval, setInterval]=useState(undefined)
    const [error, setError] = useState(null);
    const [emails, setEmails] = useState(['']); // Start with one empty email field

    const addEmail = () => {
        setEmails([...emails, '']); // Add a new empty email input
    };
    
    const removeEmail = (index) => {
        const newEmails = emails.filter((_, i) => i !== index); // Remove the selected email
        setEmails(newEmails);
    };
    
    const handleEmailChange = (e, index) => {
        const newEmails = [...emails];
        newEmails[index] = e.target.value; // Update the email at the given index
        setEmails(newEmails);
    };
    
  
    const openModal = () => {
      setIsModalOpen(true);
      setMeetingTitle(meet.meetingTitle); // Ensure the correct title is set when modal opens
    };
  
    const closeModal = () => {
      setIsModalOpen(false);
      setMeetingTitle(meet.meetingTitle); // Reset title when modal closes
    };
  
    const handleGenerateReport = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
        console.log(emails)
      const payload = {
        meeting_title: meetingTitle,
        report_type: reportType,
        report_format: reportFormat,
        meeting_id: meet._id,
        report_interval: interval,
        emails
      };

      if(interval) payload[interval]=interval
  
      try {
        const response = await fetch('/api/get-report', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate report');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
  
        const link = document.createElement('a');
        link.href = url;
        const fileExtension = reportFormat === 'pdf' ? 'pdf' : 'docx';
        link.download = `${meetingTitle.replace(/\s+/g, '_')}_report.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        meet.meetingTitle=meetingTitle
        closeModal();
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="meet-card">
            <div className="meet-card-content">
                <div className="meet-card-main">
                    <div className="meet-card-header">
                        <div>
                            <h2 className="meet-title">{meet.meetingTitle}</h2>
                            <p className="meet-host">Hosted by <span>{meet.convenor}</span></p>
                        </div>
                        <div className="meet-time">
                            <p><strong>From:</strong> {formatTime(meet.meetingStartTimeStamp)}</p>
                            <p><strong>To:</strong> {formatTime(meet.meetingEndTimeStamp)}</p>
                        </div>
                    </div>

                    <div className="meet-divider"></div>

                    <div className="meet-details">
                        <p><strong>Email:</strong> {meet.blabberEmail}</p>
                        <p><strong>Duration:</strong> {calculateDuration(meet.meetingStartTimeStamp, meet.meetingEndTimeStamp)}</p>
                    </div>

                    <div className="meet-divider"></div>

                    <div className="meet-participants">
                        <p><strong>Speakers:</strong> {meet.speakers?.length > 0 ? meet.speakers.join(', ') : 'No speakers'}</p>
                        <p><strong>Attendees:</strong> {meet.attendees?.length > 0 ? meet.attendees.join(', ') : 'No attendees'}</p>
                    </div>

                    {meet.screenshots && meet.screenshots.length > 0 && (
                        <>
                            <div className="meet-divider"></div>
                            <div className="meet-screenshots">
                                <p className="mb-2"><strong>Screenshots:</strong></p>
                                <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
                                    {meet.screenshots.map((screenshot, index) => (
                                        <div key={index} className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
                                            <img 
                                                src={`/api/screenshots/${meet.blabberEmail}/${screenshot.filename}`} 
                                                alt={`Screenshot from ${formatTime(screenshot.timestamp)}`}
                                                className="h-24 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                                onClick={() => window.open(`/api/screenshots/${meet.blabberEmail}/${screenshot.filename}`, '_blank')}
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                By: {screenshot.takenBy}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        onClick={openModal}
                        className="btn-primary mt-4"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Generate Report
                    </button>
                </div>
            </div>
            {/* Modal for Report Generation */}
            <Modal
    isOpen={isModalOpen}
    onRequestClose={closeModal}
    style={customStyles}
    contentLabel="Generate Report Modal"
>
    <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Generate Report</h2>

    <form onSubmit={handleGenerateReport} className="flex flex-col gap-4">
        {/* Meeting Title */}
        <div>
            <label className="block text-gray-400 text-sm font-semibold mb-1">Meeting Title:</label>
            <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
            />
        </div>

        {/* Report Type Dropdown */}
        <div>
            <label className="block text-gray-400 text-sm font-semibold mb-1">Type of Report:</label>
            <select
                value={reportType}
                onChange={(e) => {
                    setReportType(e.target.value);
                    setInterval(undefined);
                }}
                className="w-full bg-[#0a0a1a] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                required
            >
                <option value="" disabled>Select Report Type</option>
                {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                        {type.label}
                    </option>
                ))}
            </select>

            {/* Conditional rendering for interval input */}
            {reportType === "interval" && (
                <input
                    type="number"
                    min="1"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-4 text-white mt-3 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Enter interval (minutes)"
                />
            )}
        </div>

        {/* Report Format Dropdown */}
        <div>
            <label className="block text-gray-400 text-sm font-semibold mb-1">Choose a Format:</label>
            <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                required
            >
                <option value="" disabled>Select Report Format</option>
                {reportFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                        {format.label}
                    </option>
                ))}
            </select>
        </div>

        {/* Email Input Field */}
        <div>
            <label className="block text-gray-400 text-sm font-semibold mb-1">Send to Email(s):</label>
            <div className="flex flex-col gap-2">
                {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e, index)}
                            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="colleague@example.com"
                            required
                        />
                        {emails.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeEmail(index)}
                                className="px-3 py-2.5 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addEmail}
                    className="text-sm text-purple-400 hover:text-purple-300 font-medium self-start mt-1 flex items-center gap-1"
                >
                    + Add Another Email
                </button>
            </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-4">
            {error && <p className="text-red-400 text-sm self-center mr-auto">{error}</p>}

            <button
                type="button"
                className="px-5 py-2.5 border border-[rgba(255,255,255,0.1)] text-gray-300 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors font-medium"
                onClick={closeModal}
                disabled={loading}
            >
                Cancel
            </button>
            <button
                type="submit"
                className={`btn-primary px-6 py-2.5 rounded-xl font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
            >
                {loading ? 'Generating...' : 'Generate '}
            </button>
        </div>
    </form>
</Modal>

        </div>
    );
};

export default MeetCard;
