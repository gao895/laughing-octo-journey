import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Three Fiber uses intrinsic elements with props (e.g. <mesh position>) that
      // this rule misreports as unknown DOM properties.
      'react/no-unknown-property': 'off',
    },
  },
  {
    // Three.js objects (camera, materials) are imperative and mutated every frame by design.
    files: ['components/gallery/GalleryCamera.tsx', 'components/gallery/GalleryControls.tsx'],
    rules: { 'react-hooks/immutability': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'test-results/**']),
]);

export default eslintConfig;
