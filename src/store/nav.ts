import { create } from 'zustand';

export type Screen =
  | { name: 'home' }
  | { name: 'open'; packId: string }
  | { name: 'binder'; setId: string }
  | { name: 'card'; cardId: string; from: Screen }
  | { name: 'debug' };

interface NavState {
  screen: Screen;
  go: (screen: Screen) => void;
}

export const useNav = create<NavState>((set) => ({
  screen: { name: 'home' },
  go: (screen) => set({ screen }),
}));
