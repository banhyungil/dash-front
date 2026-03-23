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
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2.5 text-sm bg-bg text-text border border-border rounded-md outline-none focus:border-blue"
          type="text"
          placeholder="C:/data/Measured_2601"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <button
          className="px-5 py-2.5 text-sm font-semibold bg-blue text-bg border-none rounded-md cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? '스캔 중...' : '스캔'}
        </button>
      </div>

      {/* Scan results */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] font-semibold text-subtext mb-2">스캔 결과:</div>
          <div className="max-h-60 overflow-y-auto">
          {files.map((file) => (
            <label key={file.path} className="flex items-center gap-2 py-1.5 cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={selected.has(file.path)}
                onChange={() => toggleFile(file.path)}
                disabled={file.already_ingested}
                className="accent-blue"
              />
              <span className={`font-medium ${file.already_ingested ? 'text-muted' : 'text-text'}`}>
                {file.filename}
              </span>
              <span className="text-muted text-xs">
                {file.already_ingested
                  ? '(이미 적재됨)'
                  : `(${file.estimated_cycles} cycles, ${(file.size_bytes / 1024).toFixed(0)} KB)`}
              </span>
            </label>
          ))}
          </div>

          <div className="mt-3 text-[13px] text-subtext">
            선택: {selectedCount}개 파일 / {selectedCycles} cycles
          </div>

          <button
            className="w-full py-3 mt-3 text-[15px] font-semibold bg-green text-bg border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleIngest}
            disabled={selectedCount === 0 || ingesting}
          >
            {ingesting ? '적재 중...' : '적재 시작'}
          </button>
        </div>
      )}

      {result && <IngestResult result={result} />}
    </div>
  );
}
