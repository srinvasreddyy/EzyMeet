const SignInPage = () => {
  const handleGoogleSignIn = (e) => {
    e.preventDefault();
    const callbackUrl = import.meta.env.PROD
      ? "/api/oauth/google"
      : "http://localhost:3000/api/oauth/google";
    window.open(callbackUrl, "_self");
  };

  return (
    <div className="signin-page">
      <div className="signin-bg" />

      <div className="signin-card">
        <h1 className="signin-title">Welcome to EzyMeet</h1>
        <p className="signin-subtitle">
          Sign in to access your meeting transcripts, AI summaries, and custom reports.
        </p>

        <ul className="signin-features">
          <li>
            <span>🎤</span>
            <span><span className="feature-label">Real-time Transcripts</span> for all meetings</span>
          </li>
          <li>
            <span>🧠</span>
            <span><span className="feature-label">AI-powered Summaries</span> for quick insights</span>
          </li>
          <li>
            <span>🔍</span>
            <span><span className="feature-label">Speaker Identification</span> to track discussions</span>
          </li>
          <li>
            <span>📊</span>
            <span><span className="feature-label">Organized History</span> of all meeting reports</span>
          </li>
        </ul>

        <button onClick={handleGoogleSignIn} className="google-btn" id="google-signin-btn">
          <img
            src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
            alt="Google"
          />
          Continue with Google
        </button>

        <p className="signin-privacy">
          Secure authentication via Google. We only access your name and email
          to personalize your experience.
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
