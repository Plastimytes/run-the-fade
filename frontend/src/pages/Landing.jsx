import { Link } from 'react-router-dom';
import FighterAvatar from '../components/FighterAvatar.jsx';
import hero from '../assets/hero.jpg';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <img src={hero} alt="Two fighters facing off on a city street at dusk" className="landing-hero-img" />
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-content">
        <div className="landing-brand">
          <FighterAvatar size={40} />
          <span>
            Run<span className="landing-brand-accent">The</span>Fade
          </span>
        </div>

        <h1 className="landing-title">
          FIND YOUR<br />NEXT FADE
        </h1>
        <p className="landing-tagline">
          Match with fighters near you. Get called to a fade by a verified overseer. Climb the rankings.
        </p>

        <div className="landing-actions">
          <Link to="/signup" className="btn btn-primary landing-btn">Create Account</Link>
          <Link to="/login" className="btn btn-secondary landing-btn">Sign In</Link>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-num">01</span>
            Build your profile — weight class, style, strengths
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num">02</span>
            Swipe on fighters looking for a fade near you
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num">03</span>
            The nearest overseer runs the fight and confirms the result
          </div>
        </div>
      </div>
    </div>
  );
}