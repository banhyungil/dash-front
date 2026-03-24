import { create } from 'zustand';

interface DateStore {
  /** YYMM 형식 (예: "2603") */
  month: string | null;
  /** YYMMDD 형식 (예: "260301") */
  date: string | null;
  selectDate: (month: string, date: string) => void;
}

export const useDateStore = create<DateStore>((set) => ({
  month: null,
  date: null,
  selectDate: (month, date) => set({ month, date }),
}));
