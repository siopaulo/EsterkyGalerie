import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "out/**",
      ".netlify/**",
      ".pnpm-store/**",
      "types/database.generated.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    files: ["components/admin/**/*.tsx", "app/studio/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
