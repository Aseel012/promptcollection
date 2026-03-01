/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#090909',
                foreground: '#FAFAFA',
                card: '#0D0D0D',
                cardHighlight: '#141414',
                muted: '#71717A',
                border: '#1F1F1F',
                accent: {
                    DEFAULT: '#FAFAFA',
                    glow: 'rgba(250, 250, 250, 0.05)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            animation: {
                'spotlight': 'spotlight 2s ease .75s 1 forwards',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
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
                }
            }
        },
    },
    plugins: [],
}
