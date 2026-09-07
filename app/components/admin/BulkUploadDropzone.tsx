'use client';
import { useState, useRef, useCallback } from 'react';

interface BulkUploadDropzoneProps {
  endpoint: string; // e.g. '/api/portfolio/bulk-upload' or '/api/events/[id]/media'
  category?: string;
  isFeatured?: boolean;
  onComplete?: (count: number) => void;
  onClose?: () => void;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const BATCH_SIZE = 5; // upload 5 files at a time

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

const CATEGORIES = ['Weddings', 'Pre-Wedding', 'Engagements', 'Birthdays', 'Events', 'Portraits', 'Films', 'Albums'];
const EVENT_CATEGORIES = ['Ceremony', 'Portraits', 'Reception', 'Pre-Wedding', 'Details', '35mm'];

export default function BulkUploadDropzone({
  endpoint,
  category: initialCategory,
  isFeatured: initialFeatured = false,
  onComplete,
  onClose,
}: BulkUploadDropzoneProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [category, setCategory] = useState(initialCategory || 'Weddings');
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const isEventUpload = endpoint.includes('/media');
  const categories = isEventUpload ? EVENT_CATEGORIES : CATEGORIES;

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/') ||
      /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$/i.test(f.name)
    );
    setFiles(prev => [
      ...prev,
      ...accepted.map(file => ({ file, status: 'pending' as const })),
    ]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadBatch = async (batch: FileStatus[], batchCategory: string, featured: boolean, batchTitle: string, batchSubtitle: string): Promise<{ ok: number; fail: number }> => {
    const formData = new FormData();
    batch.forEach(fs => formData.append('files', fs.file));
    formData.append('category', batchCategory);
    formData.append('isFeatured', String(featured));
    if (batchTitle) formData.append('title', batchTitle);
    if (batchSubtitle) formData.append('subtitle', batchSubtitle);

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        return { ok: data.count || batch.length, fail: 0 };
      }
      return { ok: 0, fail: batch.length };
    } catch {
      return { ok: 0, fail: batch.length };
    }
  };

  const startUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setDone(false);
    let totalOk = 0;
    let totalFail = 0;

    // Mark all as uploading
    setFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading' } : f));

    // Upload in batches
    for (let i = 0; i < pendingFiles.length; i += BATCH_SIZE) {
      const batch = pendingFiles.slice(i, i + BATCH_SIZE);
      const { ok, fail } = await uploadBatch(batch, category, isFeatured, title, subtitle);
      totalOk += ok;
      totalFail += fail;

      // Update statuses for this batch
      const batchNames = new Set(batch.map(b => b.file.name));
      setFiles(prev => prev.map(f => {
        if (batchNames.has(f.file.name) && f.status === 'uploading') {
          return { ...f, status: ok > 0 ? 'done' : 'error' };
        }
        return f;
      }));

      setSuccessCount(c => c + ok);
      setFailCount(c => c + fail);
    }

    setUploading(false);
    setDone(true);
    if (onComplete) onComplete(totalOk);
  };

  const retry = () => {
    setFiles(prev => prev.map(f => f.status === 'error' ? { ...f, status: 'pending' } : f));
    setDone(false);
    setSuccessCount(0);
    setFailCount(0);
  };

  const totalFiles = files.length;
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const progressPct = totalFiles > 0 ? Math.round(((doneCount + errorCount) / totalFiles) * 100) : 0;

  return (
    <div style={{
      backgroundColor: S.surface,
      border: `1px solid ${S.outlineVariant}`,
      padding: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ ...S.label, color: S.secondary, margin: 0 }}>Bulk Upload</p>
          <h3 style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.5rem', fontWeight: 400, color: S.primary, margin: '0.25rem 0 0' }}>
            {isEventUpload ? 'Upload Event Media' : 'Upload Portfolio Media'}
          </h3>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: S.onSurfaceVariant }}>×</button>
        )}
      </div>

      {/* Metadata Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
            Project Title
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul & Priya Wedding"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={uploading}
            style={{ width: '100%', border: `1px solid ${S.outlineVariant}`, backgroundColor: S.surface, padding: '0.625rem 0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: '#1d1b18' }}
          />
        </div>
        <div>
          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
            Description / Subtitle
          </label>
          <input
            type="text"
            placeholder="e.g. Lake Como, Italy"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            disabled={uploading}
            style={{ width: '100%', border: `1px solid ${S.outlineVariant}`, backgroundColor: S.surface, padding: '0.625rem 0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: '#1d1b18' }}
          />
        </div>
        <div>
          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
            Category
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={uploading}
            style={{ width: '100%', border: `1px solid ${S.outlineVariant}`, backgroundColor: S.surface, padding: '0.625rem 0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: '#1d1b18' }}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {!isEventUpload && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
            <input
              type="checkbox"
              id="bulk-featured"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              disabled={uploading}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <label htmlFor="bulk-featured" style={{ ...S.label, color: S.primary, fontSize: '0.6875rem', cursor: 'pointer' }}>
              Mark All as Featured
            </label>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? S.primary : S.outlineVariant}`,
          backgroundColor: dragging ? S.containerHigh : S.containerLow,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1.5rem',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && addFiles(e.target.files)}
          disabled={uploading}
        />
        <p style={{ fontFamily: "'Bodoni Moda', serif", fontSize: '1.25rem', fontWeight: 400, color: S.primary, margin: 0 }}>
          {dragging ? 'Drop files here' : 'Drop files or click to select'}
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8125rem', color: S.onSurfaceVariant, marginTop: '0.5rem' }}>
          JPEG, PNG, WebP, MP4, MOV, WebM · Unlimited files
        </p>
      </div>

      {/* File count summary */}
      {totalFiles > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>
              {totalFiles} file{totalFiles !== 1 ? 's' : ''} selected
            </span>
            {uploading && (
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.secondary }}>
                {doneCount + errorCount} / {totalFiles} processed
              </span>
            )}
            {done && (
              <span style={{ ...S.label, fontSize: '0.625rem', color: errorCount > 0 ? '#ba1a1a' : '#22c55e' }}>
                ✓ {successCount} uploaded{errorCount > 0 ? ` · ${errorCount} failed` : ''}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {(uploading || done) && (
            <div style={{ backgroundColor: S.containerHigh, height: '4px', width: '100%', marginBottom: '1rem' }}>
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: errorCount > 0 && done ? '#ba1a1a' : S.primary,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          )}

          {/* File list — only show first 20 for performance */}
          {totalFiles <= 50 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${S.dim}` }}>
              {files.map((fs, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderBottom: i < files.length - 1 ? `1px solid ${S.dim}` : 'none',
                  backgroundColor: fs.status === 'done' ? 'rgba(34,197,94,0.04)' : fs.status === 'error' ? 'rgba(186,26,26,0.04)' : 'transparent',
                }}>
                  <span style={{ fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif", color: S.primary }}>
                    {fs.file.name}
                  </span>
                  <span style={{ ...S.label, fontSize: '0.5rem', color: fs.status === 'done' ? '#22c55e' : fs.status === 'error' ? '#ba1a1a' : fs.status === 'uploading' ? S.secondary : S.onSurfaceVariant }}>
                    {fs.status === 'uploading' ? '⟳' : fs.status === 'done' ? '✓' : fs.status === 'error' ? '✕' : '○'}
                  </span>
                  {!uploading && fs.status === 'pending' && (
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer', color: S.onSurfaceVariant, padding: '0 0.25rem' }}>×</button>
                  )}
                </div>
              ))}
            </div>
          )}
          {totalFiles > 50 && (
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8125rem', color: S.onSurfaceVariant, textAlign: 'center', padding: '0.5rem' }}>
              {totalFiles} files queued for upload
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {!done && (
          <button
            onClick={startUpload}
            disabled={uploading || pendingCount === 0}
            style={{
              backgroundColor: (uploading || pendingCount === 0) ? S.containerHigh : S.primary,
              color: (uploading || pendingCount === 0) ? S.onSurfaceVariant : '#fff',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: 'none',
              cursor: (uploading || pendingCount === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading
              ? `Uploading… (${uploadingCount > 0 ? uploadingCount : pendingCount} remaining)`
              : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
          </button>
        )}
        {done && errorCount > 0 && (
          <button
            onClick={retry}
            style={{
              backgroundColor: '#ba1a1a',
              color: '#fff',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry {errorCount} Failed
          </button>
        )}
        {done && (
          <button
            onClick={() => { setFiles([]); setDone(false); setSuccessCount(0); setFailCount(0); }}
            style={{
              backgroundColor: 'transparent',
              color: S.primary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: `1px solid ${S.primary}`,
              cursor: 'pointer',
            }}
          >
            Upload More
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: S.onSurfaceVariant,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: `1px solid ${S.dim}`,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
