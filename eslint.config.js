import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist/", "node_modules/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" }],
      // Resets intencionales de estado en effects (reset de ancho/imgErr al
      // cambiar de módulo). Comportamiento correcto; lo dejamos como aviso de
      // deuda técnica en vez de error bloqueante.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // <model-viewer> es un custom element global, no una variable indefinida.
    files: ["src/**/*.{js,jsx}"],
    languageOptions: { globals: { "model-viewer": "readonly" } },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["vite.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
