module.exports = {
  purge: {
    enabled: true, // Enable purging in production
    content: [
      './*.html', // Root-level HTML files
      './**/*.html', // All HTML files in subdirectories
      './assets/js/**/*.js', // Include JavaScript files if Tailwind classes are used dynamically
    ],
  },
  theme: {
    extend: {},
  },
  plugins: [],
};