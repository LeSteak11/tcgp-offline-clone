import { create } from 'zustand';

interface SettingsState {
  unlimitedPacks: boolean; // debug default: on (there is no currency in v0)
  forceGodPack: boolean;
  setUnlimitedPacks: (v: boolean) => void;
  setForceGodPack: (v: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  unlimitedPacks: true,
  forceGodPack: false,
  setUnlimitedPacks: (v) => set({ unlimitedPacks: v }),
  setForceGodPack: (v) => set({ forceGodPack: v }),
}));
