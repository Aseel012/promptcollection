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
                foreground: '#FFFFFF',
                card: '#0A0A0A',
                cardHighlight: '#111111',
                muted: '#A3A3A3',
                border: '#1A1A1A',
                accent: {
                    DEFAULT: '#22C55E',
                    glow: 'rgba(34, 197, 94, 0.15)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            transitionTimingFunction: {
                'silent': 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            animation: {
                'spotlight': 'spotlight 2s ease .75s 1 forwards',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                'marquee': 'marquee 30s linear infinite',
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
                    '0%': { opacity: '0', transform: 'translateY(15px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            }
        },
    },
    plugins: [],
}
