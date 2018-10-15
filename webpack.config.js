const webpack = require('webpack')
const {
  createConfig,
  match,

  // Feature blocks
  babel,
  css,
  devServer,
  file,
  uglify,

  // Shorthand setters
  addPlugins,
  setEnv,
  entryPoint,
  env,
  setOutput,
  sourceMaps
} = require('webpack-blocks')
const autoprefixer = require('autoprefixer')
const path = require('path')

module.exports = createConfig([
  entryPoint('./test/index.js'),
  setOutput('./test/bundle.js'),
  babel(),
  match(['*.css', '!*node_modules*'], [
    css(),
  ]),
  match(['*.gif', '*.jpg', '*.jpeg', '*.png', '*.webp'], [
    file()
  ]),
  setEnv({
    NODE_ENV: process.env.NODE_ENV
  }),
  env('development', [
    devServer({
      contentBase: path.join(__dirname, 'test'),
      hot: true
    }),
    addPlugins([
      new webpack.HotModuleReplacementPlugin()
    ]),
    sourceMaps()
  ]),
  env('production', [
    uglify(),
    addPlugins([
      new webpack.LoaderOptionsPlugin({ minimize: true })
    ])
  ])
])
