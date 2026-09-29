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

// Every card is the same fixed box, whatever the source video's orientation.
const VIDEO_BOX_SIZE = 280;

function VideoCard({ video }) {
  // The video is scaled (in JS, with real pixel math) to fit inside the
  // fixed box on its longest side, then centered — a letterbox, like a
  // photo frame. This never crops: a portrait video gets black bars on the
  // sides, a landscape one gets them on top and bottom. Falls back to 16:9
  // for videos uploaded before dimensions were tracked.
  const hasDims = video.width && video.height;
  const ratio = hasDims ? video.width / video.height : 16 / 9;
  const frameWidth = ratio >= 1 ? VIDEO_BOX_SIZE : Math.round(VIDEO_BOX_SIZE * ratio);
  const frameHeight = ratio >= 1 ? Math.round(VIDEO_BOX_SIZE / ratio) : VIDEO_BOX_SIZE;

  return (
    <div
      style={{
        width: VIDEO_BOX_SIZE,
        height: VIDEO_BOX_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        border: '1px solid var(--line)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <iframe
        src={video.videoLink}
        title={video.fileName || 'Profile video'}
        style={{ width: frameWidth, height: frameHeight, border: 'none' }}
        allow="autoplay"
        allowFullScreen
      />
    </div>
  );
}

export default function MyProfilePage({ lead, email, birthday, videos, isOwnProfile, isAdmin, showSuccessModal, toast }) {
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
            {videos.map((v, i) => <VideoCard key={i} video={v} />)}
          </div>
        )}

        {(isOwnProfile || isAdmin) && (
          <VideoUpload targetName={lead.name} isOwnProfile={isOwnProfile} showSuccessModal={showSuccessModal} toast={toast} />
        )}
      </div>
    </div>
  );
}
