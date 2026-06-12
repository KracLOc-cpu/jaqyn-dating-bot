/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Бренд Jaqyn
        cream: {
          DEFAULT: "#F5EEE2", // основной фон
          card: "#FBF6EC", // светлые карточки
        },
        burgundy: {
          DEFAULT: "#6E1F2A", // primary (кнопки, логотип, акценты)
          dark: "#571520",
          50: "#F3E7E9",
        },
        ink: "#241A17", // тёмный текст / заголовки
        muted: "#8B7D70", // вторичный текст
        line: "#E6DCCB", // тонкие границы
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(46, 26, 22, 0.10)",
        btn: "0 6px 16px rgba(110, 31, 42, 0.28)",
        hero: "0 12px 34px rgba(91, 58, 38, 0.13)",
      },
    },
  },
  plugins: [],
};
