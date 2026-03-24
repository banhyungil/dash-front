// ===== Cycles =====

export interface MonthInfo {
  month: string;
  label: string;
}

export interface DateInfo {
  date: string;
  label: string;
  cycle_count: number;
  high_vib_events: number;
}

export interface AxisStats {
  rms: number;
  peak: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  exceed_count: number;
  exceed_ratio: number;
  exceed_duration_ms: number;
  burst_count: number;
  peak_impact_count: number;
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
  pulse_timeline: number[];
  pulse_accel_x: number[];
  pulse_accel_y: number[];
  pulse_accel_z: number[];
  vib_accel_x: number[];
  vib_accel_z: number[];
  stats_pulse_x?: AxisStats;
  stats_pulse_y?: AxisStats;
  stats_pulse_z?: AxisStats;
  stats_vib_x?: AxisStats;
  stats_vib_z?: AxisStats;
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

export interface TestExportResponse {
  status: string;
  test_dir: string;
  raw_files_copied: number;
  raw_files: string[];
  integrated_files: string[];
  total_cycles: number;
  filtered_cycles: number;
}

// ===== Ingest =====

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
  high_vib_events: number;
}

export interface IngestStatus {
  months: IngestStatusMonth[];
  total_dates: number;
  total_cycles: number;
}

export interface IngestJob {
  job_id: string;
  status: 'queued' | 'running' | 'done';
  total_files: number;
  completed_files: number;
  success_cycles: number;
  result: IngestResult | null;
}
