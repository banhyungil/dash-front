/**
 * API client for day_viewer backend
 */

const API_BASE = 'http://localhost:8001/api';

export interface MonthInfo {
  month: string;
  label: string;
}

export interface DateInfo {
  date: string;
  label: string;
}

export interface CycleData {
  timestamp: string;
  session: string;
  cycle_index: number;
  date: string;
  rpm_mean: number;
  rpm_min: number;
  rpm_max: number;
  rpm_timeline: number[];
  rpm_data: number[];
  mpm_mean: number;
  mpm_min: number;
  mpm_max: number;
  mpm_data: number[];
  duration_ms: number;
  set_count: number;
  expected_count: number;
  timeline_offset: number;
  // Pulse accelerometer data
  pulse_timeline: number[];
  pulse_accel_x: number[];
  pulse_accel_y: number[];
  pulse_accel_z: number[];
  // VIB accelerometer data
  vib_accel_x: number[];
  vib_accel_z: number[];
}

export interface DailyDataResponse {
  date: string;
  device: string;
  settings: {
    shaft_dia: number;
    pattern_width: number;
    target_rpm: number;
  };
  cycles: CycleData[];
  total_cycles: number;
}

export async function fetchMonths(): Promise<MonthInfo[]> {
  const response = await fetch(`${API_BASE}/months`);
  return response.json();
}

export async function fetchDevices(month: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/devices?month=${month}`);
  return response.json();
}

export async function fetchDates(month: string, device: string): Promise<DateInfo[]> {
  const response = await fetch(`${API_BASE}/dates?month=${month}&device=${device}`);
  return response.json();
}

export async function fetchDailyData(
  month: string,
  date: string,
): Promise<DailyDataResponse> {
  const response = await fetch(
    `${API_BASE}/daily-data?month=${month}&date=${date}`
  );
  return response.json();
}

export interface TestExportResponse {
  status: string;
  test_dir: string;
  raw_files_copied: number;
  raw_files: string[];
  integrated_files: string[];
  total_cycles: number;
  filtered_cycles: number;
}

export async function testExport(
  month: string,
  date: string,
): Promise<TestExportResponse> {
  const response = await fetch(
    `${API_BASE}/test-export?month=${month}&date=${date}`
  );
  return response.json();
}

// ===== Ingest API Types =====

export interface ScanFile {
  path: string;
  filename: string;
  type: 'PULSE' | 'VIB';
  size_bytes: number;
  estimated_cycles: number;
  already_ingested: boolean;
}

export interface ScanResult {
  folder: string;
  files: ScanFile[];
}

export interface IngestDetail {
  filename: string;
  cycles_ingested: number;
  cycles_skipped: number;
  errors: string[];
}

export interface IngestResult {
  total_files: number;
  success_cycles: number;
  skipped_cycles: number;
  failed_lines: number;
  details: IngestDetail[];
}

export interface IngestStatusMonth {
  month: string;
  date_count: number;
  total_cycles: number;
  valid_cycles: number;
  high_vib_events: number;
}

export interface IngestStatus {
  months: IngestStatusMonth[];
  total_dates: number;
  total_cycles: number;
}

// ===== Ingest API Functions =====

export async function scanFolder(folder: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/ingest/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!response.ok) throw new Error(`Scan failed: ${response.statusText}`);
  return response.json();
}

export async function ingestPaths(paths: string[]): Promise<IngestResult> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!response.ok) throw new Error(`Ingest failed: ${response.statusText}`);
  return response.json();
}

export async function uploadFiles(files: File[]): Promise<IngestResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
  return response.json();
}

export async function getIngestStatus(): Promise<IngestStatus> {
  const response = await fetch(`${API_BASE}/ingest/status`);
  if (!response.ok) throw new Error(`Status failed: ${response.statusText}`);
  return response.json();
}
