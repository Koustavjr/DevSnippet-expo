export const Colors = {
    light: {
        background: '#F4F9FC',  // Clean, soft ice-blue white tint
        text: '#0F172A',        // Deep obsidian/slate text for high contrast
        card: '#FFFFFF',        // Pure white cards to float cleanly off the ice-blue bg
        border: '#E2E8F0',      // Subtle gridline border
        primary: '#06B6D4',     // Vibrant Cyan/Teal (Main action wheels)
        secondary: '#0EA5E9',   // Electric Sky Blue (Supporting active links)
        placeholder: '#94A3B8', // Muted slate gray placeholder
        error: '#EF4444',       // Sharp warning red
        success: '#10B981',     // Emerald accent success
        tabBar: '#FFFFFF',      // Clean white navigation baseline
    },
    dark: {
        background: '#0B0F19',  // Deep Cyber Space Navy Blue (Perfect IDE dark base)
        text: '#F1F5F9',        // Crisp silver-white readable typography
        card: '#161F30',        // Elevated rich slate-blue card container
        border: '#24324D',      // Clean electric-border tint
        primary: '#38BDF8',     // Neon Sky Cyan (Glows perfectly on deep blue)
        secondary: '#818CF8',   // Pastel Purple/Indigo for tertiary tags
        placeholder: '#475569', // Deep muted slate placeholder
        error: '#F87171',       // High-visibility soft red
        success: '#34D399',     // High-visibility seafoam green
        tabBar: '#0E1420',      // Solid matching base for bottom tabs
    }
} as const;

export type ColorScheme = keyof typeof Colors;

// export const Colors = {
//     light: {
//         background: '#ffffff',
//         text: '#000000',
//         card: '#f5f5f5',
//         border: '#e0e0e0',
//         primary: '#6366f1',
//         secondary: '#8b5cf6',
//         placeholder: '#9ca3af',
//         error: '#ef4444',
//         success: '#22c55e',
//         tabBar: '#ffffff',
//     },
//     dark: {
//         background: '#1a1a1a',
//         text: '#ffffff',
//         card: '#2a2a2a',
//         border: '#3a3a3a',
//         primary: '#6366f1',
//         secondary: '#8b5cf6',
//         placeholder: '#6b7280',
//         error: '#ef4444',
//         success: '#22c55e',
//         tabBar: '#1a1a1a',
//     }
// } as const

// export type ColorScheme = keyof typeof Colors