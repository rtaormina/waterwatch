module.exports = {
    purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            colors: {
                'light': '#D7E9F4',
                'main': '#00A6D6',
            }
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
