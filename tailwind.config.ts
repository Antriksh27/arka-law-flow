import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				background: '#F9FAFB',
				foreground: '#1F2937',
				primary: {
					DEFAULT: '#1E3A8A',
					50: '#EFF6FF',
					100: '#DBEAFE',
					200: '#BFDBFE',
					300: '#93C5FD',
					400: '#60A5FA',
					500: '#3B82F6',
					600: '#2563EB',
					700: '#1D4ED8',
					800: '#1E40AF',
					900: '#1E3A8A',
					foreground: '#FFFFFF'
				},
				accent: {
					DEFAULT: '#E0E7FF',
					50: '#EEF2FF'
				},
				secondary: {
					DEFAULT: '#F3F4F6',
					100: '#F3F4F6',
					200: '#E5E7EB',
					foreground: '#1E3A8A'
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#fff'
				},
				success: {
					DEFAULT: '#10B981',
					50: '#ECFDF5',
					800: '#065F46',
				},
				warning: {
					DEFAULT: '#F59E0B',
					50: '#FFFBEB',
					800: '#92400E',
				},
				info: {
					DEFAULT: '#3B82F6',
					50: '#EFF6FF',
					800: '#1E40AF',
				},
				muted: {
					DEFAULT: '#6B7280'
				},
				legal: {
					blue: '#1E3A8A',
					'blue-light': '#E0E7FF',
					background: '#F9FAFB',
					text: '#1F2937',
					'text-light': '#6B7280'
				},
				card: {
					DEFAULT: '#fff',
					background: '#fff',
				},
				border: '#E5E7EB',
			},
			borderRadius: {
				xl: '1rem',
				'2xl': '1.5rem',
				lg: '0.75rem',
				md: '0.5rem',
				sm: '0.375rem'
			},
			boxShadow: {
				card: '0 4px 24px rgba(30, 58, 138, 0.05)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
