/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'labubu-fur': '#8B5E3C',
                'labubu-cream': '#FAF3E0',
                'labubu-pink': '#E989A0',
                'labubu-olive': '#6B8E23',
            },
        },
    },
    plugins: [],
}
