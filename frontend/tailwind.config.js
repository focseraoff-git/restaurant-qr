/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                display: ['"Outfit"', 'sans-serif'],
                serif: ['"Playfair Display"', 'serif'],
            },
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    500: '#f97316',
                    600: '#ea580c',
                    900: '#7c2d12',
                },
                dark: {
                    900: '#0f172a',
                    800: '#1e293b',
                    50: '#f8fafc',
                }
            },
            boxShadow: {
                'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                'premium-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [],
}
