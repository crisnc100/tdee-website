'use client';

import { create } from 'zustand';

interface CoachingModalState {
  isOpen: boolean;
  source: string;
  openModal: (source: string) => void;
  closeModal: () => void;
}

export const useCoachingModal = create<CoachingModalState>((set) => ({
  isOpen: false,
  source: '',
  openModal: (source: string) => set({ isOpen: true, source }),
  closeModal: () => set({ isOpen: false, source: '' }),
}));