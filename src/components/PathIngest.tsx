import { usePathIngest } from '../hooks/usePathIngest';
import IngestResult from './IngestResult';

export default function PathIngest() {
  const {
    folder, setFolder, scanning, files, selected,
    job, result, isIngesting, selectedCount, selectedCycles,
    handleScan, toggleFile, toggleAll, handleIngest,
  } = usePathIngest();

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
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-subtext">스캔 결과:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-subtext">
              <input
                type="checkbox"
                checked={files.filter(f => !f.already_ingested).every(f => selected.has(f.path))}
                onChange={() => toggleAll()}
                className="accent-blue"
              />
              전체 선택
            </label>
          </div>
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

          {/* Progress bar */}
          {isIngesting && job && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-subtext mb-1">
                <span>적재 중... {job.completed_files}/{job.total_files} 파일</span>
                <span>{job.success_cycles} cycles</span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-green rounded-full transition-all duration-300"
                  style={{ width: `${(job.completed_files / job.total_files) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            className="w-full py-3 mt-3 text-[15px] font-semibold bg-green text-bg border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleIngest}
            disabled={selectedCount === 0 || isIngesting}
          >
            {isIngesting ? `적재 중 (${job?.completed_files}/${job?.total_files})...` : '적재 시작'}
          </button>
        </div>
      )}

      {result && <IngestResult result={result} />}
    </div>
  );
}
