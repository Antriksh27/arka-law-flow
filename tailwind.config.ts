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
    			sans: [
    				'Roboto',
    				'ui-sans-serif',
    				'system-ui',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'Helvetica Neue',
    				'Arial',
    				'Noto Sans',
    				'sans-serif'
    			],
    			mono: [
    				'Roboto Mono',
    				'ui-monospace',
    				'SFMono-Regular',
    				'Menlo',
    				'Monaco',
    				'Consolas',
    				'Liberation Mono',
    				'Courier New',
    				'monospace'
    			],
    			serif: [
    				'Libre Caslon Text',
    				'ui-serif',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'Times',
    				'serif'
    			]
    		},
    		colors: {
    			background: '#F9FAFB',
    			foreground: '#111827',
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			},
    			primary: {
    				'50': '#F9FAFB',
    				'100': '#F3F4F6',
    				'200': '#E5E7EB',
    				'300': '#D1D5DB',
    				'400': '#9CA3AF',
    				'500': '#6B7280',
    				'600': '#4B5563',
    				'700': '#374151',
    				'800': '#1F2937',
    				'900': '#111827',
    				DEFAULT: '#111827',
    				foreground: '#FFFFFF'
    			},
    			accent: {
    				'50': '#F9FAFB',
    				DEFAULT: '#F3F4F6'
    			},
    			secondary: {
    				'100': '#F3F4F6',
    				'200': '#E5E7EB',
    				DEFAULT: '#F3F4F6',
    				foreground: '#111827'
    			},
    			destructive: {
    				DEFAULT: '#EF4444',
    				foreground: '#fff'
    			},
    			success: {
    				'50': '#ECFDF5',
    				'800': '#065F46',
    				DEFAULT: '#10B981'
    			},
    			warning: {
    				'50': '#FFFBEB',
    				'800': '#92400E',
    				DEFAULT: '#F59E0B'
    			},
    			info: {
    				'50': '#F9FAFB',
    				'800': '#1F2937',
    				DEFAULT: '#6B7280'
    			},
    			muted: {
    				DEFAULT: '#6B7280'
    			},
    			legal: {
    				blue: '#111827',
    				'blue-light': '#F3F4F6',
    				background: '#F9FAFB',
    				text: '#111827',
    				'text-light': '#6B7280'
    			},
    			card: {
    				DEFAULT: '#fff',
    				background: '#fff'
    			},
    			border: '#E5E7EB'
    		},
    		borderRadius: {
    			xl: '1rem',
    			'2xl': '1.5rem',
    			lg: '0.75rem',
    			md: '0.5rem',
    			sm: '0.375rem'
    		},
    		boxShadow: {
    			card: '0 4px 24px rgba(30, 58, 138, 0.05)',
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
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
    			},
    			'slide-in-bottom': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(100%)'
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
    			'fade-in': 'fade-in 0.3s ease-out',
    			'slide-in-bottom': 'slide-in-bottom 0.3s ease-out'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
