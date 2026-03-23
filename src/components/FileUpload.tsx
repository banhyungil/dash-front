import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadFiles } from '../api/ingest';
import type { IngestResult as IngestResultType } from '../api/types';
import IngestResult from './IngestResult';

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResultType | null>(null);

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
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-brand bg-brand/10'
            : 'border-overlay'
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
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}

      {result && <IngestResult result={result} />}
    </div>
  );
}
