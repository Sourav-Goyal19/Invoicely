import { create } from "zustand";

type NewBranchType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewBranch = create<NewBranchType>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
