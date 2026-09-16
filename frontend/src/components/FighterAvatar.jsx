// An original idle-stance fighter mark, built from basic shapes — used in the
// nav brand, auth screens, and empty states. Deliberately abstract/geometric
// rather than a character illustration.
export default function FighterAvatar({ size = 64 }) {
  return (
    <svg
      className="fighter-avatar"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="fighter-avatar-body">
        {/* back leg */}
        <path d="M46 62 L36 88 L44 88 L52 66 Z" fill="var(--surface-raised)" />
        {/* front leg */}
        <path d="M54 64 L60 88 L68 88 L58 60 Z" fill="var(--text-muted)" opacity="0.5" />
        {/* torso */}
        <path d="M40 34 Q50 28 60 34 L58 62 Q50 68 42 62 Z" fill="var(--text-muted)" opacity="0.75" />
        {/* head */}
        <circle cx="50" cy="22" r="10" fill="var(--text-muted)" opacity="0.85" />
        {/* back arm */}
        <path d="M41 38 Q30 40 27 32" stroke="var(--text-muted)" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.6" />
        <circle className="fighter-avatar-glove" cx="26" cy="30" r="7" fill="var(--cyan)" />
        {/* front arm, guard up */}
        <path d="M58 36 Q68 30 66 18" stroke="var(--text-muted)" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85" />
        <circle className="fighter-avatar-glove lead" cx="66" cy="16" r="7.5" fill="var(--accent)" />
      </g>
    </svg>
  );
}
