import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'lib/octomments.js',
  output: {
    format: 'umd',
    name: 'Octomments',
    file: 'octomments.js'
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      'babelrc': false,
      'presets': [
        '@babel/preset-env'
      ],
      'exclude': 'node_modules/**'
    }),
  ],
};