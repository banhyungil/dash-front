import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { uploadFiles, getJobStatus } from '../api/ingest';
import { isValidCsvFile } from '../utils/fileValidation';
import type { IngestResult, IngestJob } from '../api/types';

/** 파일 업로드 + 폴링 로직 hook. */
export function useFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [job, setJob] = useState<IngestJob | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((f) => isValidCsvFile(f.name));

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

  return { files, job, result, isUploading, totalSize, onDrop, removeFile, handleUpload };
}
