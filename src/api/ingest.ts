import client from './client';
import type { ScanResult, IngestJob, IngestStatus } from './types';

export const scanFolder = (folder: string) =>
  client.post<ScanResult>('/ingest/scan', { folder }).then(res => res.data);

export const ingestFiles = (paths: string[]) =>
  client.post<IngestJob>('/ingest', { paths }).then(res => res.data);

export const uploadFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return client.post<IngestJob>('/ingest/upload', formData).then(res => res.data);
};

export const getJobStatus = (jobId: string) =>
  client.get<IngestJob>(`/ingest/job/${jobId}`).then(res => res.data);

export const getIngestStatus = () =>
  client.get<IngestStatus>('/ingest/status').then(res => res.data);
