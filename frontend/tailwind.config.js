/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0A0A0B',
                foreground: '#F5F5F0',
                muted: '#8C8C82',
                border: '#1A1A1C',
                accent: {
                    DEFAULT: '#C5A059',
                    dark: '#8C6C2D',
                },
                studio: '#1B2A22',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                brand: ['Space Grotesk', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            letterSpacing: {
                'extra-tight': '-0.05em',
                'super-wide': '0.5em',
            },
        },
    },
    plugins: [],
}
