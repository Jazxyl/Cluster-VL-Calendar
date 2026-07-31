const ICONS = {
  home: (
    <path d="M4 12l8-8 8 8M6 10v10h5v-6h2v6h5V10" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  form: (
    <>
      <path d="M14 3v5h5" />
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  bell: (
    <>
      <path d="M12 3a5 5 0 0 0-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 0 0-5-5z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </>
  ),
};

function NavIcon({ name, color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function NavCards({ items, active, onSelect }) {
  return (
    <div className="nav-cards">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            className={`nav-card ${isActive ? 'nav-card-active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            <NavIcon name={item.icon} color={isActive ? '#6EFF7B' : '#69C920'} />
            <p className="nav-card-title">{item.title}</p>
            <p className="nav-card-desc">{item.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
