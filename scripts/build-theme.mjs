/**
 * Figma variable defs → theme.css (:root literals) + theme.js (var() refs only) + tailwind.config.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "figma-variable-defs.json"), "utf8")
);

function varNameFromKey(key) {
  const m = key.match(/^var\((--[^)]+)\)$/);
  return m ? m[1] : null;
}

function isColorValue(v) {
  return typeof v === "string" && v.startsWith("#");
}

function isNumberString(v) {
  return typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v);
}

function toCssValue(varName, value) {
  if (isColorValue(value)) return value;
  if (varName.includes("font-style"))
    return value === "Italic" ? "italic" : String(value);
  if (varName.includes("font-family") || varName.includes("family-mono")) {
    if (varName.includes("code"))
      return `"${value}", ui-monospace, monospace`;
    const stack = varName.includes("mono")
      ? `"${value}", ui-monospace, monospace`
      : `"${value}", ui-sans-serif, system-ui, sans-serif`;
    return stack;
  }
  if (!isNumberString(value)) return value;
  const n = value;
  if (
    varName.includes("font-weight") ||
    (varName.includes("weight") && !varName.includes("size"))
  )
    return n;
  return `${n}px`;
}

const entries = [];
for (const [key, val] of Object.entries(raw)) {
  const name = varNameFromKey(key);
  if (!name) continue;
  if (typeof val !== "string") continue;
  if (val.startsWith("Font(") || val.startsWith("Effect(")) continue;
  entries.push([name, toCssValue(name, val)]);
}

const cssBlock = entries
  .map(([n, v]) => `  ${n}: ${v};`)
  .join("\n");

const themeCss = `/**
 * Design tokens — literal values (hex / px / weights) live here only.
 * Consumed by Tailwind via var(--token) from theme.js
 */
@layer base {
  :root {
${cssBlock}
  }
}
`;

fs.writeFileSync(path.join(root, "theme.css"), themeCss, "utf8");

function tailwindKeyFromVar(name) {
  return name.replace(/^--/, "");
}

const colors = {};
const fontFamily = {};
const fontSize = {};
const fontWeight = {};
const spacing = {};
const borderRadius = {};
const borderWidth = {};

for (const [name] of entries) {
  const ref = `var(${name})`;
  const tw = tailwindKeyFromVar(name);
  if (name.includes("color")) {
    colors[tw] = ref;
  } else if (name.includes("font-family") || name.includes("family-mono")) {
    fontFamily[tw] = ref;
  } else if (
    name.includes("typography") &&
    (name.includes("size") || name.includes("scale"))
  ) {
    fontSize[tw] = ref;
  } else if (name.includes("font-weight") || name.includes("weight-bold") || name.includes("weight-regular")) {
    fontWeight[tw] = ref;
  } else if (
    name.includes("size-space") ||
    name.includes("padding") ||
    name.includes("size-depth") ||
    name.includes("size-icon")
  ) {
    spacing[tw] = ref;
  } else if (name.includes("radius")) {
    borderRadius[tw] = ref;
  } else if (name.includes("stroke-border")) {
    borderWidth[tw] = ref;
  }
}

const themeJs = `/**
 * Figma SDS tokens — use CSS variables only (no raw hex in app/Tailwind config).
 * Literal values are defined in theme.css (:root).
 * Regenerate: npm run tokens:build (source: scripts/figma-variable-defs.json)
 */

export const cssVar = (name) => \`var(\${name})\`;

/** Flat map: Tailwind key → var(--...) */
export const tokens = {
  colors: ${JSON.stringify(colors, null, 2)},
  fontFamily: ${JSON.stringify(fontFamily, null, 2)},
  fontSize: ${JSON.stringify(fontSize, null, 2)},
  fontWeight: ${JSON.stringify(fontWeight, null, 2)},
  spacing: ${JSON.stringify(spacing, null, 2)},
  borderRadius: ${JSON.stringify(borderRadius, null, 2)},
  borderWidth: ${JSON.stringify(borderWidth, null, 2)},
};

/** Typography presets referencing SDS variables */
export const typography = {
  titleHero: {
    fontFamily: "var(--sds-typography-title-hero-font-family)",
    fontSize: "var(--sds-typography-title-hero-size)",
    fontWeight: "var(--sds-typography-title-hero-font-weight)",
    lineHeight: "1.2",
    letterSpacing: "-0.03em",
  },
  titlePage: {
    fontFamily: "var(--sds-typography-title-page-font-family)",
    fontSize: "var(--sds-typography-title-page-size-base)",
    fontWeight: "var(--sds-typography-title-page-font-weight)",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontFamily: "var(--sds-typography-subtitle-font-family)",
    fontSize: "var(--sds-typography-subtitle-size-base)",
    fontWeight: "var(--sds-typography-subtitle-font-weight)",
    lineHeight: "1.2",
  },
  heading: {
    fontFamily: "var(--sds-typography-heading-font-family)",
    fontSize: "var(--sds-typography-heading-size-base)",
    fontWeight: "var(--sds-typography-heading-font-weight)",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontFamily: "var(--sds-typography-subheading-font-family)",
    fontSize: "var(--sds-typography-subheading-size-medium)",
    fontWeight: "var(--sds-typography-subheading-font-weight)",
    lineHeight: "1.2",
  },
  body: {
    fontFamily: "var(--sds-typography-body-font-family)",
    fontSize: "var(--sds-typography-body-size-medium)",
    fontWeight: "var(--sds-typography-body-font-weight-regular)",
    lineHeight: "1.4",
  },
  bodyStrong: {
    fontFamily: "var(--sds-typography-body-font-family)",
    fontSize: "var(--sds-typography-body-size-medium)",
    fontWeight: "var(--sds-typography-body-font-weight-strong)",
    lineHeight: "1.4",
  },
  bodySmall: {
    fontFamily: "var(--sds-typography-body-font-family)",
    fontSize: "var(--sds-typography-body-size-small)",
    fontWeight: "var(--sds-typography-body-font-weight-regular)",
    lineHeight: "1.4",
  },
  bodyCode: {
    fontFamily: "var(--sds-typography-code-font-family)",
    fontSize: "var(--sds-typography-code-size-base)",
    fontWeight: "var(--sds-typography-code-font-weight)",
    lineHeight: "1.3",
  },
};
`;

fs.writeFileSync(path.join(root, "theme.js"), themeJs, "utf8");

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
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
`;

fs.writeFileSync(path.join(root, "tailwind.config.js"), tailwindConfig, "utf8");

console.log("Wrote theme.css, theme.js, tailwind.config.js");
