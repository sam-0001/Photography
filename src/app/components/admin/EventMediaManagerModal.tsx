'use client';
import { useState, useEffect, useCallback } from 'react';
import BulkUploadDropzone from './BulkUploadDropzone';

interface EventDoc {
  _id: string;
  eventName: string;
  clientName: string;
  urlToken: string;
  visibilityStatus: string;
  mediaIds?: string[];
}

interface MediaItem {
  _id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  category: string;
  sortOrder: number;
}

interface EventMediaManagerModalProps {
  event: EventDoc;
  isOpen: boolean;
  onClose: () => void;
  onMediaChanged: () => void;
}

const S = {
  primary: '#000000',
  secondary: '#775927',
  surface: '#fef9f2',
  containerLow: '#f8f3ec',
  containerHigh: '#ece7e1',
  dim: '#ded9d3',
  outlineVariant: '#ccc5bd',
  onSurfaceVariant: '#4a4640',
  label: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6875rem' as const,
    fontWeight: 600 as const,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },
};

export default function EventMediaManagerModal({ event, isOpen, onClose, onMediaChanged }: EventMediaManagerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDriveSync, setShowDriveSync] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [hasConfirmedDelete, setHasConfirmedDelete] = useState(false);

  const endpoint = `/api/events/${event._id}/media`;

  const handleDriveSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveFolderUrl) return;
    setSyncing(true);
    setActionMsg('Syncing from Google Drive... This may take a moment.');
    try {
      const res = await fetch(`/api/events/${event._id}/drive-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderUrl: driveFolderUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Imported ${data.count} new items (Found ${data.totalFound} total).`);
        setShowDriveSync(false);
        setDriveFolderUrl('');
        loadMedia();
        onMediaChanged();
      } else {
        setActionMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setActionMsg('Failed to sync with Google Drive.');
    }
    setSyncing(false);
  };

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) setMedia(data.media || []);
    } catch (err) {
      console.error('Failed to load event media', err);
    }
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, loadMedia]);

  const deleteMediaItem = async (mediaId: string) => {
    if (!hasConfirmedDelete) {
      if (!confirm('Delete this media item? (We won\'t ask again this session)')) return;
      setHasConfirmedDelete(true);
    }
    
    try {
      await fetch(`${endpoint}/${mediaId}`, { method: 'DELETE' });
      setMedia(prev => prev.filter(m => m._id !== mediaId));
      onMediaChanged();
      setActionMsg('Media deleted.');
    } catch {
      setActionMsg('Failed to delete media.');
    }
  };

  const downloadQR = async (format: 'png' | 'svg' = 'png') => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/events/${event._id}/qr?format=${format}`);
      if (!res.ok) throw new Error('Failed to generate QR');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Show preview
      const reader = new FileReader();
      reader.onload = () => setQrPreview(reader.result as string);
      reader.readAsDataURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `gallery-qr-${event.urlToken}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setActionMsg(`QR code downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setActionMsg('QR code generation failed. Make sure the server is running.');
    }
    setQrLoading(false);
  };

  const photos = media.filter(m => m.mediaType === 'image');
  const videos = media.filter(m => m.mediaType === 'video');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
        backgroundColor: '#FAF8F5',
        width: 'min(90vw, 1000px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: `1px solid ${S.dim}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          backgroundColor: S.surface,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <p style={{ ...S.label, color: S.secondary, margin: 0 }}>Event Media Manager</p>
            <h2 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.5rem', fontWeight: 400, color: S.primary, margin: '0.25rem 0 0' }}>
              {event.eventName}
            </h2>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8125rem', color: S.onSurfaceVariant, margin: '0.25rem 0 0' }}>
              {event.clientName} · {photos.length} photos · {videos.length} videos
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setShowDriveSync(!showDriveSync);
                setShowUpload(false);
              }}
              style={{
                backgroundColor: S.surface,
                color: S.primary,
                border: `1px solid ${S.outlineVariant}`,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                ...S.label,
              }}
            >
              {showDriveSync ? 'Cancel' : 'Import from Drive'}
            </button>
            <button
              onClick={() => {
                setShowUpload(!showUpload);
                setShowDriveSync(false);
              }}
              style={{
                backgroundColor: S.primary,
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                ...S.label,
              }}
            >
              {showUpload ? 'Cancel' : 'Upload Files'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: S.onSurfaceVariant, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Drive Sync Area */}
        {showDriveSync && (
          <div style={{ padding: '2rem', borderBottom: `1px solid ${S.dim}`, backgroundColor: S.containerLow }}>
            <h4 style={{ margin: '0 0 1rem 0', fontFamily: "'Bodoni Moda', serif", fontSize: '1.25rem', color: S.primary }}>Import from Google Drive</h4>
            <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant, marginBottom: '1.5rem', maxWidth: '600px' }}>
              Paste a public Google Drive folder link. Make sure the folder is set to <strong>&quot;Anyone with the link can view&quot;</strong>. We will instantly sync all images directly into this gallery.
            </p>
            <form onSubmit={handleDriveSync} style={{ display: 'flex', gap: '1rem', maxWidth: '600px' }}>
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveFolderUrl}
                onChange={e => setDriveFolderUrl(e.target.value)}
                required
                disabled={syncing}
                style={{ flex: 1, padding: '0.75rem', border: `1px solid ${S.outlineVariant}`, backgroundColor: S.surface, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button
                type="submit"
                disabled={syncing}
                style={{
                  backgroundColor: syncing ? S.onSurfaceVariant : '#1a73e8', // Google Blue
                  color: '#fff',
                  border: 'none',
                  padding: '0 1.5rem',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  ...S.label,
                }}
              >
                {syncing ? 'Syncing...' : 'Start Import'}
              </button>
            </form>
          </div>
        )}

        {/* Upload Area */}
        {showUpload && (
          <div style={{ borderBottom: `1px solid ${S.dim}` }}>
            <BulkUploadDropzone
              endpoint={endpoint}
              onClose={() => setShowUpload(false)}
              onComplete={() => {
                loadMedia();
                onMediaChanged();
              }}
            />
          </div>
        )}


        {/* Action banner */}
        {actionMsg && (
          <div style={{ backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: '#1d1b18' }}>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        )}

        <div style={{ padding: '2rem', flex: 1 }}>

          {/* QR Code & Gallery Link section */}
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ ...S.label, color: S.secondary, marginBottom: '1rem' }}>Gallery Access</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant, marginBottom: '0.375rem' }}>Gallery Link</p>
                <code style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8125rem', color: S.primary, backgroundColor: S.containerLow, padding: '0.5rem 0.75rem', display: 'block', wordBreak: 'break-all', border: `1px solid ${S.outlineVariant}` }}>
                  /gallery/{event.urlToken}
                </code>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/gallery/${event.urlToken}`)
                        .then(() => setActionMsg('Gallery link copied!'));
                    }}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: `1px solid ${S.primary}`, backgroundColor: 'transparent', color: S.primary, cursor: 'pointer' }}
                  >
                    Copy Link
                  </button>
                  <a
                    href={`/gallery/${event.urlToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: `1px solid ${S.outlineVariant}`, color: S.onSurfaceVariant, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    View Gallery ↗
                  </a>
                </div>
              </div>

              {/* QR Code */}
              <div style={{ minWidth: '180px' }}>
                <p style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant, marginBottom: '0.375rem' }}>QR Code</p>
                {qrPreview ? (
                  <img src={qrPreview} alt="QR Code" style={{ width: '120px', height: '120px', border: `1px solid ${S.outlineVariant}`, display: 'block', marginBottom: '0.5rem' }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', border: `2px dashed ${S.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: S.onSurfaceVariant, textAlign: 'center' }}>QR<br />Preview</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => downloadQR('png')}
                    disabled={qrLoading}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', border: 'none', backgroundColor: qrLoading ? S.containerHigh : S.primary, color: qrLoading ? S.onSurfaceVariant : '#fff', cursor: qrLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {qrLoading ? '…' : '↓ PNG'}
                  </button>
                  <button
                    onClick={() => downloadQR('svg')}
                    disabled={qrLoading}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', border: `1px solid ${S.primary}`, backgroundColor: 'transparent', color: qrLoading ? S.onSurfaceVariant : S.primary, cursor: qrLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {qrLoading ? '…' : '↓ SVG'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upload section */}
          <div style={{ marginBottom: '1.5rem' }}>
            {!showUpload ? (
              <button
                onClick={() => setShowUpload(true)}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', border: 'none', backgroundColor: S.primary, color: '#fff', cursor: 'pointer' }}
              >
                + Upload Media to This Gallery
              </button>
            ) : (
              <BulkUploadDropzone
                endpoint={endpoint}
                category="Ceremony"
                onComplete={(count) => {
                  setActionMsg(`${count} file${count !== 1 ? 's' : ''} uploaded successfully!`);
                  setShowUpload(false);
                  loadMedia();
                  onMediaChanged();
                }}
                onClose={() => setShowUpload(false)}
              />
            )}
          </div>

          {/* Media grid */}
          <div>
            <p style={{ ...S.label, color: S.secondary, marginBottom: '1rem' }}>
              Gallery Media · {media.length} items
            </p>

            {loading && (
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: S.onSurfaceVariant }}>Loading media…</p>
            )}

            {!loading && media.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', border: `2px dashed ${S.outlineVariant}` }}>
                <p style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.25rem', color: S.primary }}>No media yet</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: S.onSurfaceVariant, marginTop: '0.5rem' }}>
                  Upload photos and videos using the button above.
                </p>
              </div>
            )}

            {!loading && media.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {media.map(item => (
                  <div
                    key={item._id}
                    style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, overflow: 'hidden', position: 'relative' }}
                  >
                    <div
                      style={{ aspectRatio: '4/3', backgroundColor: S.containerHigh, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                      onClick={() => setLightboxItem(item)}
                    >
                      {item.mediaType === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d1b18' }}>
                          <span style={{ fontSize: '1.5rem', color: '#fff' }}>▶</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '0.375rem', left: '0.375rem', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.125rem 0.375rem', fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {item.mediaType}
                      </div>
                    </div>
                    <div style={{ padding: '0.5rem 0.625rem' }}>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: S.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {item.title}
                      </p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.625rem', color: S.secondary, marginTop: '0.125rem', marginBottom: '0.375rem' }}>
                        {item.category}
                      </p>
                      <button
                        onClick={() => deleteMediaItem(item._id)}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.25rem 0.5rem', border: `1px solid #ba1a1a`, color: '#ba1a1a', backgroundColor: 'transparent', cursor: 'pointer', width: '100%' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.97)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setLightboxItem(null)}
        >
          <button
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}
            onClick={() => setLightboxItem(null)}
          >×</button>
          {lightboxItem.mediaType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxItem.url}
              alt={lightboxItem.title}
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightboxItem.url}
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
