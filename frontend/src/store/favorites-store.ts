import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type FavoritesState = {
  ids: string[];
  isHydrated: boolean;
  setIds: (ids: string[]) => void;
  add: (propertyId: string) => void;
  remove: (propertyId: string) => void;
  has: (propertyId: string) => boolean;
  clear: () => void;
  markHydrated: (value: boolean) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      isHydrated: false,
      setIds: (ids) => set({ ids }),
      add: (propertyId) => {
        const current = get().ids;
        if (current.includes(propertyId)) {
          return;
        }
        set({ ids: [...current, propertyId] });
      },
      remove: (propertyId) => {
        set({ ids: get().ids.filter((id) => id !== propertyId) });
      },
      has: (propertyId) => get().ids.includes(propertyId),
      clear: () => set({ ids: [] }),
      markHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'property-platform-favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ids: state.ids }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true);
      },
    },
  ),
);
