export default function SuccessModal({ message, onConfirm }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <div className="card" style={{ padding: 28, maxWidth: 340, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--brand-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l6 6L20 6" />
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', margin: '0 0 18px' }}>{message}</p>
        <button className="primary" onClick={onConfirm} style={{ width: '100%' }}>
          Confirm
        </button>
      </div>
    </div>
  );
}
