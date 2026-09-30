import { Link } from 'react-router-dom';
import FighterAvatar from '../components/FighterAvatar.jsx';
import hero from '../assets/hero.jpg';

const FEATURES = [
  {
    num: '01',
    title: 'Build Your Profile',
    body: 'Weight class, height class, fighting style, and strengths — the profile other fighters see when they swipe.',
  },
  {
    num: '02',
    title: 'Find a Fade',
    body: "Swipe on fighters near you who are looking. Match, chat, and schedule when you're both ready.",
  },
  {
    num: '03',
    title: 'The Overseer Runs It',
    body: 'The nearest verified overseer is called automatically, approves the fight, and confirms the result.',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <img src={hero} alt="Two fighters facing off on a city street at dusk" className="landing-hero-img" />
        <div className="landing-hero-overlay" />
      </div>

      <div className="landing-content">
        <div className="landing-top">
          <div className="landing-brand">
            <FighterAvatar size={40} />
            <span>
              Run<span className="landing-brand-accent">The</span>Fade
            </span>
          </div>
          <Link to="/admin/login" className="landing-admin-link">Admin</Link>
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

        <div className="landing-card-grid">
          {FEATURES.map((f) => (
            <div className="landing-card" key={f.num} tabIndex={0}>
              <div className="landing-card-num">{f.num}</div>
              <div className="landing-card-title">{f.title}</div>
              <div className="landing-card-body">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}