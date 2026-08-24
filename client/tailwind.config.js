/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ms: {
          blue: "#0078D4",
          "blue-dark": "#005A9E",
          "blue-deeper": "#004578",
          "blue-light": "#50E6FF",
          "blue-subtle": "#EFF6FC",
          green: "#7FBA00",
          "green-dark": "#107C41",
          "green-subtle": "#DFF6DD",
          yellow: "#FFB900",
          "yellow-subtle": "#FFF4CE",
          red: "#F25022",
          "red-dark": "#C82613",
          "red-subtle": "#FDE7E9",
          gray: {
            10: "#FAF9F8",
            20: "#F3F2F1",
            30: "#EDEBE9",
            40: "#E1DFDD",
            50: "#C8C6C4",
            60: "#A19F9D",
            70: "#605E5C",
            80: "#323130",
            90: "#201F1E",
          }
        }
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        fluent: '0 1.6px 3.6px 0 rgba(0, 0, 0, 0.132), 0 0.3px 0.9px 0 rgba(0, 0, 0, 0.108)',
        'fluent-depth-8': '0 3.2px 7.2px 0 rgba(0, 0, 0, 0.132), 0 0.6px 1.8px 0 rgba(0, 0, 0, 0.108)',
        'fluent-depth-16': '0 6.4px 14.4px 0 rgba(0, 0, 0, 0.132), 0 1.2px 3.6px 0 rgba(0, 0, 0, 0.108)',
        'fluent-depth-64': '0 25.6px 57.6px 0 rgba(0, 0, 0, 0.22), 0 4.8px 10.8px 0 rgba(0, 0, 0, 0.18)',
      }
    },
  },
  plugins: [],
}
