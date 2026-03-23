import client from './client';
import type { MonthInfo, DateInfo, DailyDataResponse, TestExportResponse } from './types';

export const fetchMonths = () =>
  client.get<MonthInfo[]>('/months').then(res => res.data);

export const fetchDates = (month: string) =>
  client.get<DateInfo[]>('/dates', { params: { month } }).then(res => res.data);

export const fetchDailyCycles = (month: string, date: string) =>
  client.get<DailyDataResponse>('/cycles/daily', { params: { month, date } }).then(res => res.data);

export const exportCycles = (month: string, date: string) =>
  client.get<TestExportResponse>('/cycles/export', { params: { month, date } }).then(res => res.data);
