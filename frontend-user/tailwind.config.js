/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // We add the specific colors requested in your SDS for the calendar
          'calendar-meeting': '#3b82f6', // Blue
          'calendar-sunday': '#ef4444',  // Red
          'calendar-empty': '#f3f4f6',   // Light Gray
        }
      },
    },
    plugins: [],
  }