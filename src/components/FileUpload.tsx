import { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadFiles, getJobStatus } from '../api/ingest';
import type { IngestResult as IngestResultType, IngestJob } from '../api/types';
import IngestResult from './IngestResult';

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<IngestResultType | null>(null);
  const [job, setJob] = useState<IngestJob | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
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
    setJob(null);
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
    setResult(null);

    try {
      const jobRes = await uploadFiles(files);
      setJob(jobRes);
      setFiles([]);

      pollingRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus(jobRes.job_id);
          setJob(status);

          if (status.status === 'done') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            if (status.result) {
              setResult(status.result);
              toast.success(`${status.result.success_cycles} cycles 적재 완료`);
            }
          }
        } catch {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }, 1000);
    } catch (err) {
      toast.error(`업로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const isUploading = job !== null && job.status !== 'done';
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
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-brand bg-brand/10' : 'border-overlay'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <p className={`text-[15px] font-medium ${isDragActive ? 'text-blue' : 'text-muted'}`}>
            {isDragActive
              ? 'CSV 파일을 놓으세요'
              : 'CSV 파일을 여기에 드래그하거나 클릭하여 선택'}
          </p>
          <p className="text-xs text-muted">PULSE_*.csv / VIB_*.csv</p>
        </div>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] font-semibold text-subtext mb-2">선택된 파일:</div>
          {files.map((file) => (
            <div key={file.name} className="flex items-center gap-2 py-1.5 text-[13px] text-text">
              <span className="text-green">✓</span>
              <span className="font-medium">{file.name}</span>
              <span className="text-muted text-xs">({formatSize(file.size)})</span>
              <button
                className="ml-auto bg-transparent border-none text-muted cursor-pointer text-sm px-1.5"
                onClick={() => removeFile(file.name)}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="mt-3 text-[13px] text-subtext">
            {files.length}개 파일 ({formatSize(totalSize)})
          </div>

          <button
            className="w-full py-3 mt-3 text-[15px] font-semibold bg-blue text-bg border-none rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {isUploading && job && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-subtext mb-1">
            <span>적재 중... {job.completed_files}/{job.total_files} 파일</span>
            <span>{job.success_cycles} cycles</span>
          </div>
          <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-blue rounded-full transition-all duration-300"
              style={{ width: `${(job.completed_files / job.total_files) * 100}%` }}
            />
          </div>
        </div>
      )}

      {result && <IngestResult result={result} />}
    </div>
  );
}
