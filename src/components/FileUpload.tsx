import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '../hooks/useFileUpload';
import { formatFileSize } from '../utils/fileValidation';
import IngestResult from './IngestResult';

export default function FileUpload() {
  const { files, job, result, isUploading, totalSize, onDrop, removeFile, handleUpload } =
    useFileUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  });

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
              <span className="text-muted text-xs">({formatFileSize(file.size)})</span>
              <button
                className="ml-auto bg-transparent border-none text-muted cursor-pointer text-sm px-1.5"
                onClick={() => removeFile(file.name)}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="mt-3 text-[13px] text-subtext">
            {files.length}개 파일 ({formatFileSize(totalSize)})
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
