import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GlobalContextState {
    currentPainPoint: string;
    currentPersona: string;
    currentProductContext: string;
    currentTitle: string;
    currentPattern: string;
    currentCopy: string;

    setPainPoint: (text: string) => void;
    setPersona: (text: string) => void;
    setProductContext: (text: string) => void;
    setTitle: (text: string) => void;
    setPattern: (text: string) => void;
    setCopy: (text: string) => void;
    clearAll: () => void;
}

export const useGlobalStore = create<GlobalContextState>()(
    persist(
        (set) => ({
            currentPainPoint: '',
            currentPersona: '',
            currentProductContext: '',
            currentTitle: '',
            currentPattern: '',
            currentCopy: '',

            setPainPoint: (text) => set({ currentPainPoint: text }),
            setPersona: (text) => set({ currentPersona: text }),
            setProductContext: (text) => set({ currentProductContext: text }),
            setTitle: (text) => set({ currentTitle: text }),
            setPattern: (text) => set({ currentPattern: text }),
            setCopy: (text) => set({ currentCopy: text }),
            clearAll: () => set({
                currentPainPoint: '',
                currentPersona: '',
                currentProductContext: '',
                currentTitle: '',
                currentPattern: '',
                currentCopy: ''
            })
        }),
        {
            name: 'xhs-global-context-storage', // unique name
        }
    )
);
