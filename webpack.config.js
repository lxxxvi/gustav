const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    main: './src/javascript/main.js',
    styles: './src/css/styles.css'
  },
  mode: "production",
  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/
        ],
        use: [
          { loader: "babel-loader" }
        ]
      },
      {
        test: /\.css$/,
        exclude: [
          /node_modules/
        ],
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin(),
  ],

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },
};
