import { Colors } from '@/constants/constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'


type ColorScheme = keyof typeof Colors


export type ThemeState = {
    theme: ColorScheme,
    toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            toggleTheme: () => {
                const { theme } = get()
                set({ theme: theme === "dark" ? "light" : "dark" })
            }
        }),
        {
            name: "theme",
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
)