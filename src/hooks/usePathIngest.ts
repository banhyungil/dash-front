import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { scanFolder, ingestFiles, getJobStatus } from '../api/ingest';
import type { ScanFile, IngestResult, IngestJob } from '../api/types';

/** 경로 스캔 + 적재 + 폴링 로직 hook. */
export function usePathIngest() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState('');
  const [scanning, setScanning] = useState(false);
  const [files, setFiles] = useState<ScanFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<IngestResult | null>(null);
  const [job, setJob] = useState<IngestJob | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleScan = async () => {
    if (!folder.trim()) {
      toast.error('경로를 입력하세요');
      return;
    }
    setScanning(true);
    setFiles([]);
    setSelected(new Set());
    setResult(null);
    setJob(null);

    try {
      const res = await scanFolder(folder.trim());
      setFiles(res.files);
      const autoSelected = new Set(
        res.files.filter((f) => !f.already_ingested).map((f) => f.path),
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

  const toggleAll = () => {
    const selectable = files.filter((f) => !f.already_ingested);
    const allSelected = selectable.every((f) => selected.has(f.path));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable.map((f) => f.path)));
    }
  };

  const handleIngest = async () => {
    if (selected.size === 0) {
      toast.error('파일을 선택하세요');
      return;
    }
    setResult(null);

    try {
      const jobRes = await ingestFiles(Array.from(selected));
      setJob(jobRes);

      pollingRef.current = setInterval(async () => {
        try {
          const status = await getJobStatus(jobRes.job_id);
          setJob(status);

          if (status.status === 'done') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            queryClient.invalidateQueries({ queryKey: ['ingest-status'] });
            if (status.result) {
              setResult(status.result);
              toast.success(`${status.result.success_cycles} cycles 적재 완료`);
            }
            setFiles((prev) =>
              prev.map((f) => (selected.has(f.path) ? { ...f, already_ingested: true } : f)),
            );
            setSelected(new Set());
          }
        } catch {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }, 1000);
    } catch (err) {
      toast.error(`적재 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const isIngesting = job !== null && job.status !== 'done';
  const selectedCount = selected.size;
  const selectedCycles = files
    .filter((f) => selected.has(f.path))
    .reduce((sum, f) => sum + f.estimated_cycles, 0);

  return {
    folder, setFolder, scanning, files, selected,
    job, result, isIngesting, selectedCount, selectedCycles,
    handleScan, toggleFile, toggleAll, handleIngest,
  };
}
