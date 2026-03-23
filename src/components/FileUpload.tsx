import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadFiles, type IngestResult as IngestResultType } from '../api/client';
import IngestResult from './IngestResult';

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResultType | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for PULSE_*.csv and VIB_*.csv
    const validFiles = acceptedFiles.filter((f) => {
      const name = f.name.toUpperCase();
      return name.endsWith('.CSV') && (name.startsWith('PULSE_') || name.startsWith('VIB_'));
    });

    const invalidCount = acceptedFiles.length - validFiles.length;
    if (invalidCount > 0) {
      toast.error(`${invalidCount}개 파일이 PULSE_*.csv / VIB_*.csv 패턴에 맞지 않아 제외됨`);
    }

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newFiles = validFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  });

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('파일을 선택하세요');
      return;
    }
    setUploading(true);

    try {
      const res = await uploadFiles(files);
      setResult(res);
      setFiles([]);
      toast.success(`${res.success_cycles} cycles 적재 완료`);
    } catch (err) {
      toast.error(`업로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setUploading(false);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          ...styles.dropzone,
          ...(isDragActive ? styles.dropzoneActive : {}),
        }}
      >
        <input {...getInputProps()} />
        <div style={styles.dropzoneContent}>
          <p style={{
            ...styles.dropzoneText,
            color: isDragActive ? '#89b4fa' : '#6c7086',
          }}>
            {isDragActive
              ? 'CSV 파일을 놓으세요'
              : 'CSV 파일을 여기에 드래그하거나 클릭하여 선택'}
          </p>
          <p style={styles.dropzoneHint}>PULSE_*.csv / VIB_*.csv</p>
        </div>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div style={styles.fileList}>
          <div style={styles.fileListHeader}>선택된 파일:</div>
          {files.map((file) => (
            <div key={file.name} style={styles.fileRow}>
              <span style={styles.fileIcon}>✓</span>
              <span style={styles.fileName}>{file.name}</span>
              <span style={styles.fileMeta}>({formatSize(file.size)})</span>
              <button
                style={styles.removeBtn}
                onClick={() => removeFile(file.name)}
              >
                ✕
              </button>
            </div>
          ))}

          <div style={styles.summary}>
            {files.length}개 파일 ({formatSize(totalSize)})
          </div>

          <button
            style={{
              ...styles.uploadBtn,
              ...(uploading ? styles.disabled : {}),
            }}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && <IngestResult result={result} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dropzone: {
    border: '2px dashed #313244',
    borderRadius: 12,
    padding: 40,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropzoneActive: {
    borderColor: '#2563EB',
    background: 'rgba(37, 99, 235, 0.1)',
  },
  dropzoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dropzoneText: {
    fontSize: 15,
    fontWeight: 500,
  },
  dropzoneHint: {
    fontSize: 12,
    color: '#6c7086',
  },
  fileList: {
    marginTop: 16,
  },
  fileListHeader: {
    fontSize: 13,
    fontWeight: 600,
    color: '#a6adc8',
    marginBottom: 8,
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    fontSize: 13,
    color: '#cdd6f4',
  },
  fileIcon: {
    color: '#0FB880',
  },
  fileName: {
    fontWeight: 500,
  },
  fileMeta: {
    color: '#6c7086',
    fontSize: 12,
  },
  removeBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#6c7086',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 6px',
  },
  summary: {
    marginTop: 12,
    fontSize: 13,
    color: '#a6adc8',
  },
  uploadBtn: {
    width: '100%',
    padding: '12px',
    marginTop: 12,
    fontSize: 15,
    fontWeight: 600,
    background: '#89b4fa',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
