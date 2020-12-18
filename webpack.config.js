/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const path = require('path');

module.exports = [
    // UMD
    {
        mode: 'none',
        entry: './src/index.ts',
        resolve: {
            mainFields: ['module', 'main'],
            extensions: ['.ts', '.js'], // support ts-files and js-files
            fallback: {
                path: require.resolve('path-browserify')
            }
        },
        output: {
            libraryTarget: 'umd',
            globalObject: 'this',
            path: path.resolve(__dirname, 'lib', 'umd'),
            filename: 'index.js'
        },
        module: {
            rules: [{
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    // configure TypeScript loader:
                    // * enable sources maps for end-to-end source maps
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            'sourceMap': true,
                        }
                    }
                }]
            }]
        },
        devtool: 'source-map'
    },
    // ESM
    {
        mode: 'none',
        entry: './src/index.ts',
        resolve: {
            mainFields: ['module', 'main'],
            extensions: ['.ts', '.js'], // support ts-files and js-files
            fallback: {
                path: require.resolve('path-browserify')
            }
        },
        output: {
            library: 'LIB',
            libraryTarget: 'var',
            path: path.resolve(__dirname, 'lib', 'esm'),
            filename: 'index.js'
        },
        module: {
            rules: [{
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    // configure TypeScript loader:
                    // * enable sources maps for end-to-end source maps
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            sourceMap: true,
                            target: 'es5',
                            forceConsistentCasingInFileNames: true,
                            noImplicitAny: true,
                            module: 'es6',
                            lib: [
                                'es2015'
                            ]
                        }
                    }
                }]
            }]
        },
        devtool: 'source-map'
    }
]