/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#090908',       // near-black
          ink: '#121210',        // ink
          paper: '#FBFAF6',      // warm paper
          cream: '#F3F0E8',      // cream
          gold: '#B8892D',       // gold
          lightgold: '#E0BC68',  // light gold
          muted: '#777268',      // muted
          border: '#E3DFD5',     // subtle warm border
          surface: '#FFFFFF',    // bright surface
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
