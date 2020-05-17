import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import {terser} from 'rollup-plugin-terser';
import autoprefixer from 'autoprefixer';
import postcss from 'rollup-plugin-postcss';

export default [
	// CommonJS
	{
		inlineDynamicImports: true,
		input: './src/index.ts',
		output: [
			{
				file: pkg.main,
				format: 'umd',
				globals: { react: 'React' },
				name: 'BetterInputs'
			}
		],
		external: [
			...Object.keys(pkg.dependencies || {})
		],
		plugins: [
			babel({
				exclude: 'node_modules/**'
			}),
			typescript({
				typescript: require('typescript'), declaration: true
			}),
			postcss({
				plugins: [autoprefixer()],
				sourceMap: true,
				extract: true,
				minimize: true
			}),
			terser() // minifies generated bundles
		]
	}
];