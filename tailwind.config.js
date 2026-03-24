/** @type {import('tailwindcss').Config} */
import { tokens, typography } from "./theme.js";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      borderWidth: tokens.borderWidth,
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        ".type-title-hero": typography.titleHero,
        ".type-title-page": typography.titlePage,
        ".type-subtitle": typography.subtitle,
        ".type-heading": typography.heading,
        ".type-subheading": typography.subheading,
        ".type-body": typography.body,
        ".type-body-strong": typography.bodyStrong,
        ".type-body-small": typography.bodySmall,
        ".type-body-code": typography.bodyCode,
      });
    },
  ],
};
