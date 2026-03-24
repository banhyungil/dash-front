import client from './client';

export interface Setting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'json';
  label: string;
  category: string;
}

export const fetchSettings = () =>
  client.get<Setting[]>('/settings').then(res => res.data);

export const updateSetting = (key: string, value: any) =>
  client.put(`/settings/${key}`, { value });

export const resetSettings = () =>
  client.post('/settings/reset');
