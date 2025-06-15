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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#1E3A8A',
					foreground: '#FFFFFF',
					'50': '#EFF6FF',
					'100': '#DBEAFE',
					'200': '#BFDBFE',
					'300': '#93C5FD',
					'400': '#60A5FA',
					'500': '#3B82F6',
					'600': '#2563EB',
					'700': '#1D4ED8',
					'800': '#1E40AF',
					'900': '#1E3A8A',
				},
				secondary: {
					DEFAULT: '#F3F4F6',
					foreground: '#1E3A8A',
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: '#10B981',
					foreground: 'hsl(var(--success-foreground))',
					'100': '#D1FAE5',
					'800': '#065F46',
				},
				warning: {
					DEFAULT: '#F59E0B',
					foreground: 'hsl(var(--warning-foreground))',
					'50': '#FFFBEB',
					'800': '#92400E',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: '#6B7280',
				},
				accent: {
					DEFAULT: '#E0E7FF',
					foreground: '#1E3A8A'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'table-header': '#220F3B',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': 'calc(var(--radius) * 2.5)',
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
