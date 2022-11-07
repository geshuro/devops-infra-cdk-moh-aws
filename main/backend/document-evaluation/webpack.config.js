// const CopyPlugin = require('copy-webpack-plugin'); // see https://github.com/boazdejong/webpack-plugin-copy
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const isLocal = false; // TODO: settings
// const plugins = [
//   new CopyPlugin({
//     patterns: [],
//   }),
// ];

/**
 * @type {webpack.Configuration}
 */
const config = {
  mode: "production",
  target: "node",
  entry: "./lib/index.ts",
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  devtool: "source-map",
  externals: [/^aws-sdk/, isLocal && nodeExternals()].filter(Boolean),
  // plugins,
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      // 'fs': false,
      // 'os': false,
      // 'tls': false,
      // 'net': false,
      // 'path': false,
      // 'zlib': false,
      // 'http': false,
      // 'https': false,
      // 'crypto': false,
      // 'path-browserify': false,
      "@nestjs/microservices": false,
      "@nestjs/websockets": false,
      "class-transformer/storage": false,
      // 'stream': require.resolve('stream-browserify'),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configOverwrite: {
          exclude: ["**/*.spec.ts"],
        },
      },
    }),
  ],
  output: {
    filename: "index.js",
    libraryTarget: "commonjs2",
  },
};

module.exports = config;
