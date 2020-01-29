import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/renderer.js',
  output: {
    format: 'umd',
    name: 'OctommentsRenderer',
    file: 'build/ocs-ui.js',
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      babelrc: false,
      presets: ['@babel/preset-env'],
      exclude: 'node_modules/**',
    }),
  ],
};
