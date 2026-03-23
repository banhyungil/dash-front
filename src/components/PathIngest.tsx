import { useState } from 'react';
import toast from 'react-hot-toast';
import { scanFolder, ingestFiles } from '../api/ingest';
import type { ScanFile, IngestResult as IngestResultType } from '../api/types';
import IngestResult from './IngestResult';

export default function PathIngest() {
  const [folder, setFolder] = useState('');
  const [scanning, setScanning] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [files, setFiles] = useState<ScanFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<IngestResultType | null>(null);

  const handleScan = async () => {
    if (!folder.trim()) {
      toast.error('경로를 입력하세요');
      return;
    }
    setScanning(true);
    setFiles([]);
    setSelected(new Set());
    setResult(null);

    try {
      const res = await scanFolder(folder.trim());
      setFiles(res.files);
      // Auto-select files that aren't already ingested
      const autoSelected = new Set(
        res.files.filter((f) => !f.already_ingested).map((f) => f.path)
      );
      setSelected(autoSelected);
      if (res.files.length === 0) {
        toast('CSV 파일이 없습니다', { icon: '📁' });
      }
    } catch (err) {
      toast.error(`스캔 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setScanning(false);
  };

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleIngest = async () => {
    if (selected.size === 0) {
      toast.error('파일을 선택하세요');
      return;
    }
    setIngesting(true);

    try {
      const res = await ingestFiles(Array.from(selected));
      setResult(res);
      toast.success(`${res.success_cycles} cycles 적재 완료`);
    } catch (err) {
      toast.error(`적재 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
    setIngesting(false);
  };

  const selectedCount = selected.size;
  const selectedCycles = files
    .filter((f) => selected.has(f.path))
    .reduce((sum, f) => sum + f.estimated_cycles, 0);

  return (
    <div>
      {/* Path input */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="C:/data/Measured_2601"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button
          style={{
            ...styles.scanBtn,
            ...(scanning ? styles.disabled : {}),
          }}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? '스캔 중...' : '스캔'}
        </button>
      </div>

      {/* Scan results */}
      {files.length > 0 && (
        <div style={styles.fileList}>
          <div style={styles.fileListHeader}>스캔 결과:</div>
          {files.map((file) => (
            <label key={file.path} style={styles.fileRow}>
              <input
                type="checkbox"
                checked={selected.has(file.path)}
                onChange={() => toggleFile(file.path)}
                disabled={file.already_ingested}
                style={styles.checkbox}
              />
              <span style={{
                ...styles.fileName,
                color: file.already_ingested ? '#6c7086' : '#cdd6f4',
              }}>
                {file.filename}
              </span>
              <span style={styles.fileMeta}>
                {file.already_ingested
                  ? '(이미 적재됨)'
                  : `(${file.estimated_cycles} cycles, ${(file.size_bytes / 1024).toFixed(0)} KB)`}
              </span>
            </label>
          ))}

          <div style={styles.summary}>
            선택: {selectedCount}개 파일 / {selectedCycles} cycles
          </div>

          <button
            style={{
              ...styles.ingestBtn,
              ...(selectedCount === 0 || ingesting ? styles.disabled : {}),
            }}
            onClick={handleIngest}
            disabled={selectedCount === 0 || ingesting}
          >
            {ingesting ? '적재 중...' : '적재 시작'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && <IngestResult result={result} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inputRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: 14,
    background: '#1e1e2e',
    color: '#cdd6f4',
    border: '1px solid #45475a',
    borderRadius: 6,
    outline: 'none',
  },
  scanBtn: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    background: '#89b4fa',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
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
    cursor: 'pointer',
    fontSize: 13,
  },
  checkbox: {
    accentColor: '#89b4fa',
  },
  fileName: {
    fontWeight: 500,
  },
  fileMeta: {
    color: '#6c7086',
    fontSize: 12,
  },
  summary: {
    marginTop: 12,
    fontSize: 13,
    color: '#a6adc8',
  },
  ingestBtn: {
    width: '100%',
    padding: '12px',
    marginTop: 12,
    fontSize: 15,
    fontWeight: 600,
    background: '#0FB880',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
