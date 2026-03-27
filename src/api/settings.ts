import client from './client';
import type { Setting } from './types';

export async function fetchSettings() {
  const res = await client.get<Setting[]>('/settings');
  return res.data;
}

export async function updateSetting(key: string, value: any) {
  await client.put(`/settings/${key}`, { value });
}

export async function resetSettings() {
  await client.post('/settings/reset');
}
