import { create } from 'zustand'

export type TestingState = {
	setupModal: boolean,
	setSetupModal: (open: boolean) => void,
};

export const useTestingStore = create<TestingState>((set, get) => ({
	setupModal: true,
	setSetupModal: (open: boolean) => {
		set({ setupModal: open });
	},
}))
