function Loader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050510',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.9rem',
          color: '#a0a0c0',
          fontWeight: 500,
        }}>Loading...</span>
      </div>
    </div>
  );
}

export default Loader;