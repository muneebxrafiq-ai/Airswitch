import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// A - Standard / Light Theme (Premium Tech)
const COLORS_LIGHT = {
    primary: '#0052FF', // Electric Blue (Trust/Tech)
    primaryDark: '#0039B3',
    secondary: '#0A0B1E', // Deep Navy (Almost Black)
    accent: '#00D4FF', // Cyan Accent
    background: '#F4F6F9', // Very light grey-blue (Premium feel)
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    success: '#10B981',
    error: '#EF4444',
    border: '#E5E7EB',
    white: '#FFFFFF',
    black: '#000000',
};

// B - Dark Theme (Cyber / Night Mode)
const COLORS_DARK = {
    primary: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondary: '#FAFAFA',
    accent: '#14B8A6',
    background: '#111827', // Dark Grey/Blue
    surface: '#1F2937', // Lighter Grey
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
    border: '#374151',
    white: '#FFFFFF',
    black: '#000000',
};

// Toggle this to switch themes basically (or implement Context later)
export const COLORS = COLORS_LIGHT;

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
};

export const SIZES = {
    width,
    height,
    h1: 30,
    h2: 24,
    h3: 20,
    body: 16,
    small: 14,
    caption: 12,
    radius: 16, // Modern rounded corners
    iconL: 32,
    iconM: 24,
    iconS: 18,
};

export const SHADOWS = {
    // Soft, diffuse shadows for "Floaty" feel
    small: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    large: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
};

export const FONTS = {
    bold: 'Inter_700Bold',
    semiBold: 'Inter_600SemiBold',
    medium: 'Inter_500Medium',
    regular: 'Inter_400Regular',
    extraBold: 'Inter_800ExtraBold',
};
