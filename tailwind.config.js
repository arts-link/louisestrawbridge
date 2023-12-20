const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./hugo_stats.json", "./layouts/**/*.html"],
  darkMode: "class",
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    extend: {
      backgroundImage: {
        'paper-pattern': " url('/images/img_bg.jpg')",
        'dark-paper-pattern': " url('/images/img_dark_bg.png')",
        'louise-signature': " url('/images/img_banner_bg_signature.png')",
      },
      colors: {
        neutral: {
          // 850: "#1f1f1f",
          850: "#ff0000",
        },
      },
      fontFamily: {
        sans: ["InterVariable", ...defaultTheme.fontFamily.sans],
      },
      screens: {
        "3xl": "1792px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
