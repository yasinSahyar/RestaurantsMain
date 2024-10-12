import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve'; // Resolve node modules
import commonjs from '@rollup/plugin-commonjs'; // Convert CommonJS modules to ES6
import { watch } from 'rollup';

export default {
  input: './src/main.ts',
  output: {
    file: './build/main.js',
    format: 'iife', // Use 'iife' for browser compatibility
    name: 'MyApp', // Name of your global variable
  },
  plugins: [
    resolve(), // Helps Rollup find external modules
    commonjs(), // Convert CommonJS to ES6
    typescript(), // Compile TypeScript
  ],
  watch: {
    clearScreen: false,
    include: 'src/**',
    exclude: 'node_modules/**',
  },
};
