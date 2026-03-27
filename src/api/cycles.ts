import client from './client';
import type { MonthInfo, DateInfo, DailyDataResponse, WaveformResponse, TestExportResponse, CycleData } from './types';

export async function fetchMonths() {
  const res = await client.get<MonthInfo[]>('/months');
  return res.data;
}

export async function fetchDates(month: string) {
  const res = await client.get<DateInfo[]>('/dates', { params: { month } });
  return res.data;
}

export async function fetchDailyCycles(month: string, date: string) {
  const res = await client.get<DailyDataResponse>('/cycles/daily', { params: { month, date } });
  return res.data;
}

export async function exportCycles(month: string, date: string) {
  const res = await client.get<TestExportResponse>('/cycles/export', { params: { month, date } });
  return res.data;
}

export async function downloadExcel(month: string, date: string) {
  const res = await client.get('/cycles/export-excel', { params: { month, date }, responseType: 'blob' });
  return res.data as Blob;
}

export async function fetchDailyWaveforms(month: string, date: string) {
  const res = await client.get<WaveformResponse>('/cycles/daily/waveforms', { params: { month, date } });
  return res.data;
}

export async function fetchCycleDetail(date: string, deviceName: string, cycleIndex: number) {
  const res = await client.get<CycleData>('/cycles/detail', { params: { date, device_name: deviceName, cycle_index: cycleIndex } });
  return res.data;
}
