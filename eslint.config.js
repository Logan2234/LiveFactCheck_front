import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import path from "node:path";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  // Config/build files aren't part of the app tsconfig — keep them out of type-aware linting.
  { ignores: ["*.config.{js,ts}", "*.config.*.{js,ts}"] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      // Enable type-aware linting (required by no-floating-promises, no-misused-promises,
      // await-thenable). projectService auto-discovers the nearest tsconfig per file.
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      "no-undef": "off",
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error"
    }
  },
  {
    files: ["static/**/*.js"],
    languageOptions: {
      parserOptions: { projectService: false }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "off"
    }
  },
  {
    files: ["**/*.{js,ts,mjs,cjs}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" }
      ],
      "@stylistic/lines-between-class-members": [
        "warn",
        "always",
        { exceptAfterSingleLine: true }
      ],
      "@stylistic/spaced-comment": ["warn", "always", { markers: ["/"] }],
      "@stylistic/no-multiple-empty-lines": [
        "warn",
        { max: 1, maxEOF: 0, maxBOF: 0 }
      ],
      "@stylistic/padded-blocks": ["warn", "never"],
      "@stylistic/multiline-comment-style": ["warn", "separate-lines"]
    }
  }
);
