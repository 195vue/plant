import { create } from "zustand";

interface DevNotesState {
  visible: boolean;
  activeId: string | null;
  toggle: () => void;
  setActive: (id: string | null) => void;
}

export const useDevNotesStore = create<DevNotesState>((set) => ({
  visible: false,
  activeId: null,
  toggle: () =>
    set((state) => ({ visible: !state.visible, activeId: null })),
  setActive: (id) => set({ activeId: id }),
}));
