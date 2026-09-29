import { useState } from 'react';
import { formatBirthdayDate } from '../lib/dates.js';
import { fileToBase64, getVideoDimensions, MAX_VIDEO_BYTES } from '../lib/files.js';
import { postToSheet, profileVideoPayload } from '../lib/webhook.js';

function initials(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function VideoUpload({ targetName, isOwnProfile, showSuccessModal, toast }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) { setError('Choose a video first.'); return; }
    setError('');
    setUploading(true);
    try {
      const [video, dims] = await Promise.all([
        fileToBase64(file, MAX_VIDEO_BYTES),
        getVideoDimensions(file),
      ]);
      postToSheet(
        profileVideoPayload({ tl: targetName, video, width: dims?.width, height: dims?.height })
      ).then((res) => {
        if (!res.ok) toast("Upload didn't reach the sheet — check the webhook URL and try again");
      });
      setFile(null);
      showSuccessModal('Video submitted! It can take a moment to show up — refresh to see it.');
    } catch (err) {
      setError(err.message || 'Something went wrong reading that file.');
    }
    setUploading(false);
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>
        {isOwnProfile ? 'Add a video to your profile' : `Add a video to ${targetName}'s profile`} (max {Math.round(MAX_VIDEO_BYTES / (1024 * 1024))} MB)
      </p>
      <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0] || null)} style={{ fontSize: 12 }} />
      <div style={{ marginTop: 8 }}>
        <button className="primary" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? 'Uploading…' : 'Upload video'}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 6 }}>{error}</p>}
    </div>
  );
}

// Browsing and playback are two different jobs, so they get two different
// sizes. The grid tile is a small, uniform square — it's just there to be
// clicked, so it's fine if a non-square video gets cropped in it, the same
// way a YouTube or Drive file-list thumbnail crops. The iframe itself is
// given pointer-events: none so clicks always reach the tile underneath
// instead of Drive's own player controls.
const THUMB_SIZE = 140;

function VideoThumbnail({ video, onOpen }) {
  return (
    <div
      onClick={() => onOpen(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(video);
      }}
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        border: '1px solid var(--line)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#000',
        cursor: 'pointer',
      }}
    >
      <iframe
        src={video.videoLink}
        title={video.fileName || 'Profile video'}
        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
        tabIndex={-1}
      />
    </div>
  );
}

// The modal is where playback actually happens, so it's the one place the
// video is shown at its real captured ratio — full video visible, no crop,
// no letterbox bars needed because the box is shaped to match it exactly.
// Capped to fit comfortably inside the viewport. Falls back to 16:9 for a
// video uploaded before dimensions were tracked.
function VideoModal({ video, onClose }) {
  if (!video) return null;
  const hasDims = video.width && video.height;
  const ratio = hasDims ? video.width / video.height : 16 / 9;
  const maxWidth = Math.min(640, window.innerWidth - 48);
  const maxHeight = window.innerHeight - 96;
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: -36,
            right: 0,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <iframe
          src={video.videoLink}
          title={video.fileName || 'Profile video'}
          style={{ width, height, border: 'none', borderRadius: 8 }}
          allow="autoplay"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function MyProfilePage({ lead, email, birthday, videos, isOwnProfile, isAdmin, showSuccessModal, toast }) {
  const [openVideo, setOpenVideo] = useState(null);

  if (!lead) {
    return (
      <div className="card home-section">
        <p className="empty-note">Couldn't find your profile — check that your name matches between the Users and TeamLeads sheets.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card profile-card" style={{ maxWidth: 320, padding: 24 }}>
        {lead.photoLink ? (
          <img src={lead.photoLink} alt={lead.name} className="profile-photo" style={{ width: 96, height: 96 }} />
        ) : (
          <div
            className="profile-photo profile-photo-fallback"
            style={{ width: 96, height: 96, fontSize: 28, background: lead.color }}
          >
            {initials(lead.name)}
          </div>
        )}
        <p className="profile-name" style={{ fontSize: 15, marginTop: 8 }}>
          {lead.name}
        </p>
        <p className="profile-line">{email || 'No email on file'}</p>
        <p className="profile-line">{birthday ? formatBirthdayDate(birthday.date) : 'No birthday on file'}</p>
      </div>

      <div style={{ marginTop: 20 }}>
        <p className="home-section-title" style={{ marginBottom: 10 }}>
          {isOwnProfile ? 'Your videos' : `${lead.name}'s videos`} {videos?.length ? `(${videos.length})` : ''}
        </p>
        {(!videos || videos.length === 0) ? (
          <p className="empty-note">No videos yet.</p>
        ) : (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {videos.map((v, i) => <VideoThumbnail key={i} video={v} onOpen={setOpenVideo} />)}
          </div>
        )}

        {(isOwnProfile || isAdmin) && (
          <VideoUpload targetName={lead.name} isOwnProfile={isOwnProfile} showSuccessModal={showSuccessModal} toast={toast} />
        )}
      </div>

      <VideoModal video={openVideo} onClose={() => setOpenVideo(null)} />
    </div>
  );
}
