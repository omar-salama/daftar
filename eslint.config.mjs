import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/features/*/ui/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*/repo/*", "@/features/*/model/*", "@/lib/*", "../repo/*", "../../lib/*", "../../../lib/*"],
            message: "UI layers may not import from repo/ or lib/.",
          }
        ]
      }]
    }
  },
  {
    files: ["src/features/*/hooks/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*/ui/*", "@/lib/*", "../ui/*", "../../lib/*", "../../../lib/*"],
            message: "Hooks may only import from their own repo/, model/, and kernel/.",
          }
        ]
      }]
    }
  },
  {
    files: ["src/features/*/repo/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*/ui/*", "@/features/*/hooks/*", "../ui/*", "../hooks/*"],
            message: "Repos may only import from lib/, kernel/, and their own model/.",
          }
        ]
      }]
    }
  },
  {
    files: ["src/kernel/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*", "@/lib/*", "@/app/*", "../features/*", "../../features/*", "../lib/*", "../../lib/*"],
            message: "Kernel is pure and may not import outside itself.",
          }
        ]
      }]
    }
  },
  {
    ignores: [
      "dist/**/*",
      ".expo/**/*",
      "node_modules/**/*",
      "ios/**/*",
      "android/**/*",
      "web-build/**/*",
      "*.config.js",
      "*.js"
    ]
  }
);
