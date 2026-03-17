function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">EzyMeet</div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} EzyMeet. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#how-it-works" className="footer-link">How It Works</a>
          <a href="#testimonials" className="footer-link">Testimonials</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
