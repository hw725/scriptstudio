import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist", ".history"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      // 프로젝트 전반에서 PropTypes를 사용하지 않으므로 경고 비활성화
      "react/prop-types": "off",
      // React 17+의 새로운 JSX 변환으로 React 기본 import가 불필요하여 경고 완화
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^React$",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // Node 환경 파일에 대한 예외 처리 (require, module, __dirname 등 허용)
  {
    files: [
      "**/*.config.js",
      "vite.config.js",
      "tailwind.config.js",
      "postcss.config.js",
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
