// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignorar artefactos y el propio config
  {
    ignores: ['eslint.config.mjs', 'dist', 'node_modules', 'coverage'],
  },

  // Base JS recomendada
  eslint.configs.recommended,

  // Reglas TS con type-checking (preset recomendado)
  ...tseslint.configs.recommendedTypeChecked,

  // Prettier recomendado (apaga reglas en conflicto y ejecuta Prettier como regla)
  eslintPluginPrettierRecommended,

  // Opciones de lenguaje / parser / globals
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Flexibilidad pragmática
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-namespace': 'off',

      // Promesas
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Estilo
      'lines-between-class-members': ['error', 'always'],
      'padded-blocks': ['error', 'never'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'max-len': ['error', { code: 150, comments: 200 }],
      'comma-dangle': ['error', 'always-multiline'],

      // Orden de miembros en clases
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'signature',
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'public-abstract-field',
            'protected-abstract-field',
            'private-abstract-field',
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
            'public-abstract-method',
            'protected-abstract-method',
            'private-abstract-method',
          ],
        },
      ],
    },
  },

  // Overrides suaves para tests (menos ruido en .spec/.test)
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
