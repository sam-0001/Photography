'use client';

import React, { useState, useRef, useCallback } from 'react';

export interface BulkUploadDropzoneProps {
  onUploadSuccess?: (uploadedMedia: any[]) => void;
  onCancel?: () => void;
  defaultCategory?: string;
  allowedCategories?: string[];
  maxFileSizeMB?: number;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CATEGORIES = [
  'Weddings',
  'Pre-Wedding',
  'Portraits',
  'Films',
  'Editorial',
  'Engagements',
  'Albums',
];

export default function BulkUploadDropzone({
  onUploadSuccess,
  onCancel,
  defaultCategory = 'Weddings',
  allowedCategories = DEFAULT_CATEGORIES,
  maxFileSizeMB = 50,
  className = '',
  style = {},
}: BulkUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSummary, setSuccessSummary] = useState<{ count: number; media: any[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Format byte size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Validate & add files
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setErrorMessage(null);
      setSuccessSummary(null);
      const incoming = Array.from(newFiles);
      const valid: File[] = [];
      const errors: string[] = [];

      incoming.forEach((file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
        if (!isImage && !isVideo) {
          errors.push(`${file.name}: Unsupported format. Only images and videos are accepted.`);
          return;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxFileSizeMB) {
          errors.push(`${file.name}: Exceeds ${maxFileSizeMB}MB limit (${sizeMB.toFixed(1)}MB).`);
          return;
        }

        const exists = stagedFiles.some((f) => f.name === file.name && f.size === file.size);
        if (!exists) {
          valid.push(file);
        }
      });

      if (errors.length > 0) {
        setErrorMessage(errors.join(' | '));
      }

      if (valid.length > 0) {
        setStagedFiles((prev) => [...prev, ...valid]);
      }
    },
    [stagedFiles, maxFileSizeMB]
  );

  // Drag & drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const removeFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setStagedFiles([]);
    setErrorMessage(null);
    setSuccessSummary(null);
    setUploadProgress(0);
    setStatusMessage('');
  };

  // Upload handler via XMLHttpRequest for real-time progress
  const startUpload = async () => {
    if (stagedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage(`Preparing ${stagedFiles.length} file(s)...`);
    setErrorMessage(null);
    setSuccessSummary(null);

    const formData = new FormData();
    stagedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('category', category);
    formData.append('isFeatured', isFeatured ? 'true' : 'false');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/portfolio/bulk-upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
        if (percent < 100) {
          setStatusMessage(`Uploading ${stagedFiles.length} asset(s) (${percent}%)...`);
        } else {
          setStatusMessage('Processing media & writing to disk...');
        }
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setSuccessSummary({
              count: res.count || res.media?.length || stagedFiles.length,
              media: res.media || [],
            });
            setStagedFiles([]);
            setUploadProgress(100);
            setStatusMessage('');
            onUploadSuccess?.(res.media || []);
          } else {
            setErrorMessage(res.error || 'Server rejected bulk upload.');
          }
        } catch {
          setErrorMessage('Invalid server response format.');
        }
      } else {
        let err = `Server returned HTTP ${xhr.status}`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error) err = res.error;
        } catch {
          // fallback
        }
        setErrorMessage(err);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setErrorMessage('Network connection lost during upload.');
    };

    xhr.send(formData);
  };

  const totalBytes = stagedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#f8f3ec',
        border: '1px solid #ccc5bd',
        padding: '1.75rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#775927',
            }}
          >
            Bulk Asset Ingestion
          </span>
          <h3
            style={{
              fontFamily: "'Bodoni Moda', serif",
              fontSize: '1.25rem',
              fontWeight: 400,
              color: '#000000',
              margin: '0.25rem 0 0',
            }}
          >
            Batch Portfolio Uploader
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              color: '#4a4640',
            }}
            title="Dismiss Uploader"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            color: '#ba1a1a',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Summary Alert */}
      {successSummary && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              ✓ Successfully archived {successSummary.count} asset(s) to &quot;{category}&quot;
            </span>
            <button
              type="button"
              onClick={() => setSuccessSummary(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
            >
              ✕
            </button>
          </div>
          {successSummary.media && successSummary.media.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', maxHeight: '100px', overflowY: 'auto' }}>
              {successSummary.media.map((item, idx) => (
                <div key={item._id || idx} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ color: '#047857' }}>● {item.title}</span>
                  <span style={{ color: '#6b7280' }}>→ {item.url}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#775927' : '#ccc5bd'}`,
          backgroundColor: dragActive ? 'rgba(119, 89, 39, 0.06)' : '#fef9f2',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1.25rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => {
            if (e.target.files) {
              addFiles(e.target.files);
              e.target.value = '';
            }
          }}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        <div style={{ fontSize: '2.25rem', color: dragActive ? '#775927' : '#4a4640', marginBottom: '0.75rem' }}>
          ☁
        </div>

        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#1d1b18' }}>
          Drag and drop your high-resolution photographs or films here
        </p>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: '#4a4640' }}>
          or <span style={{ color: '#775927', textDecoration: 'underline' }}>browse from your machine</span> (JPG, PNG, WEBP, MP4, MOV up to {maxFileSizeMB}MB)
        </p>
      </div>

      {/* Batch Metadata Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end',
          marginBottom: '1.5rem',
          backgroundColor: '#fef9f2',
          border: '1px solid #ccc5bd',
          padding: '1rem',
        }}
      >
        <div>
          <label
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1d1b18',
              display: 'block',
              marginBottom: '0.375rem',
            }}
          >
            Target Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isUploading}
            style={{
              width: '100%',
              border: '1px solid #ccc5bd',
              backgroundColor: '#ffffff',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              color: '#1d1b18',
              outline: 'none',
            }}
          >
            {allowedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '0.5rem 0',
            }}
          >
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={isUploading}
              style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
            />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#1d1b18',
              }}
            >
              Mark batch as Featured
            </span>
          </label>
        </div>
      </div>

      {/* Staged Files List */}
      {stagedFiles.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#4a4640',
              }}
            >
              Queued Files ({stagedFiles.length}) · Total: {formatBytes(totalBytes)}
            </span>
            <button
              type="button"
              onClick={clearAll}
              disabled={isUploading}
              style={{
                background: 'none',
                border: 'none',
                color: '#ba1a1a',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              Clear All
            </button>
          </div>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid #ded9d3',
              backgroundColor: '#fef9f2',
            }}
          >
            {stagedFiles.map((file, idx) => {
              const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
              return (
                <div
                  key={`${file.name}-${file.size}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderBottom: idx < stagedFiles.length - 1 ? '1px solid #ece7e1' : 'none',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                    <span
                      style={{
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        backgroundColor: isVid ? '#ffd799' : '#ece7e1',
                        color: isVid ? '#775927' : '#1d1b18',
                      }}
                    >
                      {isVid ? 'VID' : 'IMG'}
                    </span>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: '#1d1b18',
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#775927', whiteSpace: 'nowrap' }}>
                      ({formatBytes(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={isUploading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ba1a1a',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                    }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem', color: '#1d1b18' }}>
            <span>{statusMessage}</span>
            <span style={{ fontWeight: 600 }}>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#ece7e1', overflow: 'hidden' }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#775927',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={startUpload}
          disabled={stagedFiles.length === 0 || isUploading}
          style={{
            backgroundColor: stagedFiles.length === 0 || isUploading ? '#ccc5bd' : '#000000',
            color: '#ffffff',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0.75rem 1.75rem',
            border: 'none',
            cursor: stagedFiles.length === 0 || isUploading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          {isUploading ? 'Uploading Batch…' : `Ingest ${stagedFiles.length} File${stagedFiles.length === 1 ? '' : 's'}`}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            style={{
              backgroundColor: 'transparent',
              color: '#000000',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: '1px solid #000000',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        )}

        {stagedFiles.length > 0 && !isUploading && (
          <span style={{ fontSize: '0.75rem', color: '#4a4640', marginLeft: 'auto' }}>
            Files will be stored locally in <code>public/uploads/portfolio/</code>
          </span>
        )}
      </div>
    </div>
  );
}
