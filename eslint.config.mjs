import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Temporary, per-file: pre-existing violations in files being rewritten or
  // removed in parallel work. Delete each entry once its file is clean or gone.
  {
    files: [
      "src/app/privacy/page.tsx",
      "src/components/SimplePWA.tsx",
      "src/components/ai/AICoachComingSoon.tsx",
      "src/components/coaching/CoachingModal.tsx",
      "src/components/education/MythBusters.tsx",
      "src/components/layout/InfoSidebar.tsx",
      "src/components/tracking/ProgressTracker.tsx",
    ],
    rules: { "react/no-unescaped-entities": "off" },
  },
  {
    files: ["src/components/SimplePWA.tsx", "src/components/tracking/ProgressTracker.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
];

export default eslintConfig;
