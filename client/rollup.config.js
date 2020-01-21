import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/octomments.js',
  output: {
    format: 'umd',
    name: 'Octomments',
    file: 'build/octomments.js',
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      babelrc: false,
      presets: ['@babel/preset-env'],
      exclude: 'node_modules/**',
    }),
    copy({
      targets: [{ src: 'build/octomments.js', dest: '../server/assets' }],
    }),
  ],
};
