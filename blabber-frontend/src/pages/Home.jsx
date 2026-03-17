import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const TOTAL_FRAMES = 240;

// Preload all frame images
function useFrameImages() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loaded = [];
    let count = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;
      img.onload = () => {
        count++;
        if (count === TOTAL_FRAMES) setImages([...loaded]);
      };
      loaded[i - 1] = img;
    }
  }, []);

  return images;
}

// Intersection Observer hook for scroll-reveal
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const timeout = setTimeout(() => {
      document.querySelectorAll(".animate-in").forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);
}

const FEATURES = [
  {
    icon: "🎤",
    title: "Real-time Transcripts",
    desc: "Capture every word in real-time during your Google Meet sessions with AI-powered speech recognition.",
  },
  {
    icon: "🧠",
    title: "AI-Powered Summaries",
    desc: "Get intelligent meeting summaries that highlight key decisions, action items, and important discussions.",
  },
  {
    icon: "🔍",
    title: "Speaker Identification",
    desc: "Automatically identify and label who said what, making your transcripts easy to follow and reference.",
  },
  {
    icon: "📊",
    title: "Custom Reports",
    desc: "Generate speaker-based, interval-based, or sentiment-based reports in PDF and DOCX formats.",
  },
  {
    icon: "✉️",
    title: "Automated Email Reports",
    desc: "Automatically receive comprehensive meeting reports directly in your inbox after every session.",
  },
  {
    icon: "📸",
    title: "Screenshot Capture",
    desc: "Capture key moments during meetings and include them in your reports for visual context.",
  },
];

const STEPS = [
  {
    title: "Install Extension",
    desc: "Add EzyMeet to Chrome from the Web Store. One click setup, zero configuration needed.",
  },
  {
    title: "Join Your Meeting",
    desc: "Start or join any Google Meet call. EzyMeet activates automatically in the background.",
  },
  {
    title: "Get AI Insights",
    desc: "After your meeting, access transcripts, summaries, and custom reports from your dashboard.",
  },
];

const TESTIMONIALS = [
  {
    text: "EzyMeet transformed how our team handles meeting notes. The AI summaries are incredibly accurate and save us hours every week.",
    name: "Sarah Chen",
    role: "Product Manager, TechCorp",
    initials: "SC",
  },
  {
    text: "The speaker identification feature is a game-changer for our client calls. We always know exactly who committed to what.",
    name: "Marcus Rivera",
    role: "Account Executive, SalesForce",
    initials: "MR",
  },
  {
    text: "As a remote team lead, EzyMeet's automated reports keep everyone aligned without extra effort. Absolutely essential tool.",
    name: "Priya Sharma",
    role: "Engineering Lead, StartupXYZ",
    initials: "PS",
  },
];

function Home() {
  const { state } = useAuthContext();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const heroSectionRef = useRef(null);
  const images = useFrameImages();

  useScrollReveal();

  // Scroll-driven frame animation
  const handleScroll = useCallback(() => {
    if (!canvasRef.current || images.length === 0) return;
    const section = heroSectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const scrollableHeight = rect.height - window.innerHeight;
    const scrollProgress = Math.max(0, Math.min(1, -rect.top / scrollableHeight));
    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(scrollProgress * TOTAL_FRAMES)
    );

    const ctx = canvasRef.current.getContext("2d");
    const img = images[frameIndex];
    if (img && ctx) {
      canvasRef.current.width = img.naturalWidth;
      canvasRef.current.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    }
  }, [images]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Draw first frame on load
  useEffect(() => {
    if (images.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = images[0];
      canvasRef.current.width = img.naturalWidth;
      canvasRef.current.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    }
  }, [images]);

  const handleGetStarted = () => {
    state?.user ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <div className="home-page">
      {/* ===== HERO WITH BACKGROUND FRAMES ===== */}
      <section className="hero-bg-section" ref={heroSectionRef}>
        {/* Sticky viewport container */}
        <div className="hero-sticky">
          {/* Full-screen canvas background */}
          <canvas ref={canvasRef} className="hero-bg-canvas" />

          {/* Dark gradient overlay on the right to improve text readability */}
          <div className="hero-right-overlay" />

          {/* Content strictly on the right */}
          <div className="hero-right-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Chrome Extension — Now Available
            </div>

            <h1 className="hero-title">
              Transform Your<br />
              Meetings with{" "}
              <span className="hero-title-gradient">AI Intelligence</span>
            </h1>

            <p className="hero-subtitle">
              EzyMeet captures, transcribes, and summarizes your Google Meet
              sessions in real-time. Never miss an action item again.
            </p>

            <div className="hero-actions">
              <button className="btn-primary" onClick={handleGetStarted} id="hero-cta">
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="btn-secondary" onClick={() => navigate("/welcome")} id="hero-learn">
                Learn More
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">10K+</div>
                <div className="hero-stat-label">Active Users</div>
              </div>
              <div>
                <div className="hero-stat-value">50K+</div>
                <div className="hero-stat-label">Meetings Captured</div>
              </div>
              <div>
                <div className="hero-stat-value">99.2%</div>
                <div className="hero-stat-label">Accuracy Rate</div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="scroll-indicator">
            <div className="scroll-mouse">
              <div className="scroll-wheel" />
            </div>
            <span className="scroll-text">Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="section" id="features">
        <div className="section-container">
          <div className="section-header animate-in">
            <span className="section-eyebrow">Powerful Features</span>
            <h2 className="section-title">Everything You Need for<br />Smarter Meetings</h2>
            <p className="section-desc">
              From real-time transcription to AI-powered analytics, EzyMeet gives you
              the complete toolkit to make every meeting count.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className={`feature-card animate-in delay-${idx + 1}`}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how-it-works">
        <div className="section-container">
          <div className="section-header animate-in">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">Three Simple Steps to<br />Meeting Intelligence</h2>
            <p className="section-desc">
              Getting started with EzyMeet takes less than 60 seconds.
              No complex setup, no learning curve.
            </p>
          </div>

          <div className="steps-container">
            {STEPS.map((step, idx) => (
              <div key={idx} className={`step-card animate-in delay-${idx + 1}`}>
                <div className="step-number">{idx + 1}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section" id="testimonials">
        <div className="section-container">
          <div className="section-header animate-in">
            <span className="section-eyebrow">Testimonials</span>
            <h2 className="section-title">Loved by Teams<br />Worldwide</h2>
            <p className="section-desc">
              See what professionals across industries are saying about EzyMeet.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className={`testimonial-card animate-in delay-${idx + 1}`}>
                <div className="testimonial-stars">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section" id="cta">
        <div className="cta-card animate-in">
          <div className="cta-glow cta-glow-1" />
          <div className="cta-glow cta-glow-2" />
          <h2 className="cta-title">
            Ready to Transform Your Meetings?
          </h2>
          <p className="cta-desc">
            Join thousands of professionals who trust EzyMeet to capture
            every insight from their conversations.
          </p>
          <div className="cta-actions">
            <button className="btn-primary" onClick={handleGetStarted} id="cta-start">
              Start for Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => navigate("/welcome")} id="cta-learn">
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
