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
				foreground: '#111827', // Gray-900 for main text
				primary: {
					DEFAULT: '#111827',   // Gray-900 instead of blue
					50:   '#F9FAFB',      // very light
					100:  '#F3F4F6',
					200:  '#E5E7EB',
					300:  '#D1D5DB',
					400:  '#9CA3AF',
					500:  '#6B7280',
					600:  '#4B5563',
					700:  '#374151',
					800:  '#1F2937',
					900:  '#111827',      // Gray-900 (primary)
					foreground: '#FFFFFF'
				},
				accent: {
					DEFAULT: '#F3F4F6',   // lighter gray for accent
					50: '#F9FAFB'
				},
				secondary: {
					DEFAULT: '#F3F4F6',
					100: '#F3F4F6',
					200: '#E5E7EB',
					foreground: '#111827' // text color to Gray-900
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
					DEFAULT: '#6B7280', // info to muted gray
					50: '#F9FAFB',
					800: '#1F2937',
				},
				muted: {
					DEFAULT: '#6B7280'
				},
				legal: {
					blue: '#111827',  // override to Gray-900
					'blue-light': '#F3F4F6',
					background: '#F9FAFB',
					text: '#111827',
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
