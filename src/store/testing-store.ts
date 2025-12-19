import { create } from 'zustand'
import { HarnessConfig } from '../db/schema';

export type TestingState = {
	setupModal: boolean,
	setSetupModal: (open: boolean) => void,

	config: HarnessConfig | null,
	setConfig: (config: HarnessConfig) => void,

	chatReady: { [provider: string]: boolean },
	setChatReady: (provider: string, ready: boolean) => void,
};

export const useTestingStore = create<TestingState>((set, get) => ({
	setupModal: false,
	setSetupModal: (open: boolean) => {
		set({ setupModal: open });
	},

	config: null,
	setConfig: (config: HarnessConfig) => {
		set({ config: config });
	},

	chatReady: {},
	setChatReady: (provider: string, ready: boolean) => {
		const newChatReady = { ...get().chatReady };
		newChatReady[provider] = ready;
		set({ chatReady: newChatReady })
	},
}));
