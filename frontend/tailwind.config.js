/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#000000',
                foreground: '#ffffff',
                card: '#09090b',
                cardHighlight: '#18181b',
                muted: '#a1a1aa',
                border: '#27272a',
                accent: {
                    DEFAULT: '#ffffff',
                    glow: 'rgba(255, 255, 255, 0.1)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
                brand: ['Inter', 'sans-serif'],
            },
            animation: {
                'spotlight': 'spotlight 2s ease .75s 1 forwards',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                spotlight: {
                    '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
                    '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
