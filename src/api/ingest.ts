import client from './client';
import type { ScanResult, IngestJob, IngestStatus } from './types';

export async function scanFolder(folder: string) {
  const res = await client.post<ScanResult>('/ingest/scan', { folder });
  return res.data;
}

export async function ingestFiles(paths: string[]) {
  const res = await client.post<IngestJob>('/ingest', { paths });
  return res.data;
}

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await client.post<IngestJob>('/ingest/upload', formData);
  return res.data;
}

export async function getJobStatus(jobId: string) {
  const res = await client.get<IngestJob>(`/ingest/job/${jobId}`);
  return res.data;
}

export async function getIngestStatus() {
  const res = await client.get<IngestStatus>('/ingest/status');
  return res.data;
}
