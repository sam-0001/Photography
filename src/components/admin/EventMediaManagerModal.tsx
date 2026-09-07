'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface EventMediaItem {
  _id: string;
  eventId: string;
  urlToken: string;
  title: string;
  caption?: string;
  category: string;
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  isCover?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface EventDocSummary {
  _id: string;
  eventName: string;
  clientName: string;
  urlToken: string;
  clientEmail?: string;
  clientPhone?: string;
  mediaIds?: string[];
  visibilityStatus?: string;
}

export interface EventMediaManagerModalProps {
  event: EventDocSummary;
  isOpen: boolean;
  onClose: () => void;
  onMediaChanged?: (newCount: number) => void;
}

const S = {
  bodoni: { fontFamily: "'Bodoni Moda', Georgia, serif" } as React.CSSProperties,
  jakarta: { fontFamily: "'Plus Jakarta Sans', sans-serif" } as React.CSSProperties,
  label: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6875rem',
    fontWeight: 600 as const,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },
  primary: '#000000',
  secondary: '#775927',
  surface: '#fef9f2',
  bg: '#FAF8F5',
  containerLow: '#f8f3ec',
  containerHigh: '#ece7e1',
  dim: '#ded9d3',
  outlineVariant: '#ccc5bd',
  onSurfaceVariant: '#4a4640',
  onSurface: '#1d1b18',
  danger: '#ba1a1a',
  success: '#22c55e',
};

const CATEGORIES = ['Ceremony', 'Portraits', 'Reception', '35mm', 'Pre-Wedding', 'Details'];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function EventMediaManagerModal({
  event,
  isOpen,
  onClose,
  onMediaChanged,
}: EventMediaManagerModalProps) {
  const [media, setMedia] = useState<EventMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload states
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('Ceremony');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Card operation states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<EventMediaItem | null>(null);

  // 1. Fetch event media
  const fetchMedia = useCallback(async () => {
    if (!event?._id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/events/${event._id}/media`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMedia(data.media || []);
      } else {
        setErrorMsg(data.error || 'Failed to load media for this event.');
      }
    } catch {
      setErrorMsg('Network error while loading event media.');
    } finally {
      setLoading(false);
    }
  }, [event?._id]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  // 2. Keyboard & Body Scroll Lock
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxItem) {
          setLightboxItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, lightboxItem, onClose]);

  if (!isOpen) return null;

  // Staging files
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid = Array.from(files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(f.name)
    );
    if (valid.length < files.length) {
      setErrorMsg('Some non-image/non-video files were skipped.');
    }
    setStagedFiles(prev => [...prev, ...valid]);
    setActiveTab('upload');
  };

  const removeStagedFile = (idx: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload execution
  const handleUpload = () => {
    if (stagedFiles.length === 0) {
      setErrorMsg('Please select at least one photo or video to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    stagedFiles.forEach(f => formData.append('files', f));
    formData.append('category', uploadCategory);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/events/${event._id}/media`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 201 || (xhr.status === 200 && res.success)) {
          const added = res.media || [];
          const nextMedia = [...added, ...media];
          setMedia(nextMedia);
          setStagedFiles([]);
          setSuccessMsg(`Successfully uploaded ${added.length} media ${added.length === 1 ? 'item' : 'items'}.`);
          setActiveTab('gallery');
          onMediaChanged?.(nextMedia.length);
        } else {
          setErrorMsg(res.error || 'Upload failed.');
        }
      } catch {
        setErrorMsg('Error parsing server response.');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setErrorMsg('Network error during media upload.');
    };

    xhr.send(formData);
  };

  // Delete media
  const handleDelete = async (mediaId: string, title: string) => {
    if (!window.confirm(`Permanently remove "${title || 'this media'}" from the event gallery?`)) {
      return;
    }
    setDeletingId(mediaId);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/events/${event._id}/media/${mediaId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextMedia = media.filter(m => m._id !== mediaId);
        setMedia(nextMedia);
        setSuccessMsg('Media item removed.');
        onMediaChanged?.(nextMedia.length);
      } else {
        setErrorMsg(data.error || 'Failed to delete media item.');
      }
    } catch {
      setErrorMsg('Network error while deleting media.');
    } finally {
      setDeletingId(null);
    }
  };

  // Set as Cover Image
  const handleSetCover = async (mediaItem: EventMediaItem) => {
    setSettingCoverId(mediaItem._id);
    setErrorMsg('');
    try {
      // Optimistic update
      setMedia(prev => prev.map(m => ({ ...m, isCover: m._id === mediaItem._id })));

      const res = await fetch(`/api/events/${event._id}/media/${mediaItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCover: true }),
      });

      if (!res.ok) {
        await fetch(`/api/events/${event._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverMediaId: mediaItem._id }),
        }).catch(() => {});
      }
      setSuccessMsg(`"${mediaItem.title || 'Selected asset'}" is now the event cover image.`);
    } catch {
      setErrorMsg('Network error setting cover image.');
    } finally {
      setSettingCoverId(null);
    }
  };

  // Filtered media list
  const filteredMedia = media.filter(item => {
    if (filterType !== 'all' && item.mediaType !== filterType) return false;
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  const photoCount = media.filter(m => m.mediaType === 'image').length;
  const videoCount = media.filter(m => m.mediaType === 'video').length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        style={{
          backgroundColor: S.surface,
          border: `1px solid ${S.dim}`,
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${S.dim}`, backgroundColor: S.bg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                <span style={{ ...S.label, fontSize: '0.625rem', backgroundColor: S.containerHigh, padding: '0.2rem 0.5rem' }}>
                  REF: {event._id.slice(-8).toUpperCase()}
                </span>
                <span style={{ ...S.label, color: S.secondary, fontSize: '0.625rem' }}>
                  Client Gallery Vault · Media Asset Manager
                </span>
              </div>
              <h2 style={{ ...S.bodoni, fontSize: '1.75rem', fontWeight: 400, color: S.primary, margin: 0 }}>
                {event.eventName}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant, marginTop: '0.25rem', marginBottom: 0 }}>
                Client: <strong>{event.clientName}</strong> · Token: <code>{event.urlToken}</code>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: S.onSurfaceVariant,
                padding: '0.25rem 0.5rem',
                lineHeight: 1,
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Quick links and counters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>Gallery URL:</span>
              <code style={{ fontSize: '0.75rem', color: S.primary, backgroundColor: S.containerLow, padding: '0.2rem 0.5rem', border: `1px solid ${S.outlineVariant}` }}>
                /gallery/{event.urlToken}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/gallery/${event.urlToken}`);
                  setSuccessMsg('Gallery link copied to clipboard!');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${S.dim}`,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.625rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Copy
              </button>
              <a
                href={`/gallery/${event.urlToken}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.625rem', color: S.secondary, fontWeight: 600, textDecoration: 'none', marginLeft: '0.25rem' }}
              >
                Open ↗
              </a>
            </div>

            {/* Counts */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>
                Total Assets: <strong style={{ color: S.primary }}>{media.length}</strong>
              </span>
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>
                Photos: <strong style={{ color: S.primary }}>{photoCount}</strong>
              </span>
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>
                Videos: <strong style={{ color: S.primary }}>{videoCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Banners */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '0.75rem 2rem', color: S.danger, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠ {errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.danger }}>✕</button>
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '0.75rem 2rem', color: '#15803d', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}>✕</button>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${S.dim}`, backgroundColor: S.containerLow }}>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            style={{
              padding: '0.875rem 1.75rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              backgroundColor: activeTab === 'gallery' ? S.surface : 'transparent',
              borderBottom: activeTab === 'gallery' ? `2px solid ${S.primary}` : '2px solid transparent',
              color: activeTab === 'gallery' ? S.primary : S.onSurfaceVariant,
              cursor: 'pointer',
            }}
          >
            Media Gallery ({media.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '0.875rem 1.75rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? S.surface : 'transparent',
              borderBottom: activeTab === 'upload' ? `2px solid ${S.primary}` : '2px solid transparent',
              color: activeTab === 'upload' ? S.primary : S.onSurfaceVariant,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>☁ Bulk Upload to Event</span>
            {stagedFiles.length > 0 && (
              <span style={{ backgroundColor: S.secondary, color: '#fff', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.625rem' }}>
                {stagedFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>

          {/* TAB 1: GALLERY */}
          {activeTab === 'gallery' && (
            <div>
              {/* Filter Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Media Type filters */}
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {(['all', 'image', 'video'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      style={{
                        padding: '0.375rem 0.875rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        borderRadius: '9999px',
                        border: `1px solid ${S.outlineVariant}`,
                        backgroundColor: filterType === t ? S.primary : S.containerLow,
                        color: filterType === t ? '#fff' : S.onSurfaceVariant,
                        cursor: 'pointer',
                      }}
                    >
                      {t === 'all' ? `All (${media.length})` : t === 'image' ? `📷 Photos (${photoCount})` : `🎥 Videos (${videoCount})`}
                    </button>
                  ))}
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>Category:</span>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{
                      border: `1px solid ${S.outlineVariant}`,
                      backgroundColor: S.surface,
                      padding: '0.375rem 0.75rem',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.75rem',
                      color: S.onSurface,
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Loading indicator */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: S.onSurfaceVariant }}>
                  <p style={{ ...S.label, letterSpacing: '0.2em' }}>Loading Media Assets…</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', border: `1px dashed ${S.dim}`, backgroundColor: S.containerLow }}>
                  <p style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '0.5rem' }}>
                    {media.length === 0 ? 'No Media in Vault' : 'No Matching Assets'}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant, marginBottom: '1.5rem' }}>
                    {media.length === 0
                      ? 'Upload the initial batch of high-resolution images or videos for this client gallery.'
                      : 'Try resetting your filter selection above.'}
                  </p>
                  {media.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      style={{
                        backgroundColor: S.primary,
                        color: '#fff',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      + Upload First Asset
                    </button>
                  )}
                </div>
              ) : (
                /* Media Cards Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {filteredMedia.map(item => (
                    <div
                      key={item._id}
                      style={{
                        backgroundColor: S.containerLow,
                        border: `1px solid ${item.isCover ? S.secondary : S.dim}`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        boxShadow: item.isCover ? `0 0 0 1px ${S.secondary}` : 'none',
                      }}
                    >
                      {/* Image Thumbnail Container */}
                      <div
                        style={{
                          aspectRatio: '4/3',
                          backgroundColor: S.containerHigh,
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                        onClick={() => setLightboxItem(item)}
                        title="Click to view full-size preview"
                      >
                        {item.mediaType === 'image' ? (
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.title || 'Client media'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#1d1b18', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {item.thumbnailUrl && (
                              <img src={item.thumbnailUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                            )}
                            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>
                              ▶
                            </div>
                          </div>
                        )}

                        {/* Badges Overlay */}
                        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {item.isCover && (
                            <span style={{ backgroundColor: S.secondary, color: '#fff', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0.2rem 0.4rem', textTransform: 'uppercase' }}>
                              ★ Cover
                            </span>
                          )}
                          <span style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.2rem 0.4rem', textTransform: 'uppercase' }}>
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: S.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }} title={item.title}>
                            {item.title || '(untitled)'}
                          </p>
                          <p style={{ fontSize: '0.6875rem', color: S.onSurfaceVariant, marginTop: '0.25rem', marginBottom: 0 }}>
                            {formatBytes(item.fileSize)} {item.createdAt ? `· ${new Date(item.createdAt).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>

                        {/* Action Controls */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', borderTop: `1px solid ${S.dim}`, paddingTop: '0.5rem' }}>
                          {/* Cover button */}
                          <button
                            type="button"
                            onClick={() => handleSetCover(item)}
                            disabled={item.isCover || settingCoverId === item._id}
                            style={{
                              flex: 1,
                              backgroundColor: item.isCover ? S.containerHigh : 'transparent',
                              color: item.isCover ? S.secondary : S.primary,
                              border: `1px solid ${item.isCover ? S.secondary : S.outlineVariant}`,
                              padding: '0.375rem 0.5rem',
                              fontSize: '0.5625rem',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              cursor: item.isCover ? 'default' : 'pointer',
                            }}
                          >
                            {item.isCover ? '★ Cover' : 'Make Cover'}
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id, item.title)}
                            disabled={deletingId === item._id}
                            style={{
                              backgroundColor: 'transparent',
                              color: S.danger,
                              border: `1px solid ${S.outlineVariant}`,
                              padding: '0.375rem 0.5rem',
                              fontSize: '0.625rem',
                              cursor: 'pointer',
                            }}
                            title="Delete this asset"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BULK UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              {/* Category selector & file trigger */}
              <div style={{ backgroundColor: S.bg, border: `1px solid ${S.outlineVariant}`, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>
                      Assign Gallery Category *
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={e => setUploadCategory(e.target.value)}
                      style={{
                        width: '100%',
                        border: `1px solid ${S.outlineVariant}`,
                        backgroundColor: S.surface,
                        padding: '0.625rem 0.75rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.875rem',
                        color: S.onSurface,
                        outline: 'none',
                      }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: S.onSurfaceVariant, margin: '0 0 0.5rem 0' }}>
                      Files will be stored locally in <code>/public/uploads/events/{event.urlToken}/</code>
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${S.primary}`,
                        color: S.primary,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '0.625rem 1.25rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      📁 Browse Local Files…
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                      onChange={e => handleFileSelect(e.target.files)}
                    />
                  </div>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={() => setIsDragging(true)}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                style={{
                  border: isDragging ? `2px dashed ${S.secondary}` : `2px dashed ${S.dim}`,
                  backgroundColor: isDragging ? S.containerHigh : S.containerLow,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.5rem',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', lineHeight: 1 }}>☁</p>
                <p style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, margin: 0 }}>
                  Drag &amp; Drop Client Photos or Videos Here
                </p>
                <p style={{ fontSize: '0.75rem', color: S.onSurfaceVariant, marginTop: '0.5rem' }}>
                  Supports high-resolution JPG, PNG, WEBP, MP4, and MOV formats.
                </p>
              </div>

              {/* Staged files list */}
              {stagedFiles.length > 0 && (
                <div style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ ...S.label, color: S.primary }}>
                      Staged for Upload ({stagedFiles.length} files · {formatBytes(stagedFiles.reduce((acc, f) => acc + f.size, 0))})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStagedFiles([])}
                      style={{ background: 'none', border: 'none', color: S.danger, fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: `1px solid ${S.dim}` }}>
                    {stagedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          borderBottom: idx === stagedFiles.length - 1 ? 'none' : `1px solid ${S.dim}`,
                          backgroundColor: idx % 2 === 0 ? S.surface : S.containerLow,
                          fontSize: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span>{file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name) ? '🎥' : '📷'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                            {file.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: S.onSurfaceVariant }}>{formatBytes(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeStagedFile(idx)}
                            style={{ background: 'none', border: 'none', color: S.danger, cursor: 'pointer', fontWeight: 700 }}
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar during upload */}
                  {uploading && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', marginBottom: '0.25rem', color: S.onSurfaceVariant }}>
                        <span>Uploading files to server…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: S.dim, width: '100%', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: S.primary, width: `${uploadProgress}%`, transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      style={{
                        backgroundColor: uploading ? S.dim : S.primary,
                        color: '#fff',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '0.75rem 1.75rem',
                        border: 'none',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {uploading ? `Uploading… (${uploadProgress}%)` : `☁ Confirm Upload (${stagedFiles.length} Assets)`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gallery')}
                      style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${S.dim}`,
                        color: S.onSurfaceVariant,
                        fontSize: '0.6875rem',
                        padding: '0.75rem 1.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 2rem', borderTop: `1px solid ${S.dim}`, backgroundColor: S.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: S.onSurfaceVariant }}>
            Client Event ID: <code>{event._id}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: S.primary,
              color: '#fff',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.5rem 1.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Preview */}
      {lightboxItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setLightboxItem(null)}
        >
          <button
            type="button"
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 70,
            }}
            onClick={() => setLightboxItem(null)}
          >
            ✕
          </button>

          <div
            style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {lightboxItem.mediaType === 'image' ? (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title || 'Preview'}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
              />
            ) : (
              <video
                src={lightboxItem.url}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '75vh' }}
              />
            )}
            <div style={{ marginTop: '1rem', color: '#ded9d3', textAlign: 'center' }}>
              <p style={{ ...S.bodoni, fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                {lightboxItem.title}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#ccc5bd', marginTop: '0.25rem', marginBottom: 0 }}>
                Category: <strong>{lightboxItem.category}</strong> · {formatBytes(lightboxItem.fileSize)}
                {lightboxItem.isCover ? ' · ★ Current Cover Image' : ''}
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={lightboxItem.url}
                  download
                  style={{
                    display: 'inline-block',
                    padding: '0.375rem 0.875rem',
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  ↓ Download Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
