/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '/Users/stephenjanus/Desktop/project-manager/app/**/*.{js,ts,jsx,tsx,mdx}',
    '/Users/stephenjanus/Desktop/project-manager/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
