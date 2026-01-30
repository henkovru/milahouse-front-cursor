const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * Генерирует плагины HtmlWebpackPlugin для всех HTML файлов в указанной директории
 * @param {Object} options - Опции генерации
 * @param {string} options.templateDir - Директория с шаблонами
 * @param {'body' | 'head' | boolean} options.script - Куда вставлять скрипты
 * @param {string} options.src - Префикс для выходного пути
 * @returns {Array<HtmlWebpackPlugin>} Массив плагинов
 */
const generatePlugins = ({ templateDir, script, src }) => {
  const templatePath = path.resolve(__dirname, templateDir);
  
  if (!fs.existsSync(templatePath)) {
    return [];
  }

  const templateFiles = fs.readdirSync(templatePath);

  return templateFiles
    .map((templateFile) => {
      const parts = templateFile.split('.');
      const name = parts[0];
      const extension = parts[1];

      if (extension === 'html') {
        return new HtmlWebpackPlugin({
          inject: script,
          scriptLoading: 'blocking',
          filename: `${src}${name}.html`,
          template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
          minify: {
            collapseWhitespace: false,
          },
        });
      }
    })
    .filter((plugin) => plugin !== undefined);
};

module.exports = {
  entry: './src/webpack.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true,
    assetModuleFilename: 'assets/[name][ext]'
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@src': path.resolve(__dirname, 'src/'),
      'src': path.resolve(__dirname, 'src/'),
    },
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        include: [path.resolve(__dirname, 'src/includes'), path.resolve(__dirname, 'src/components')],
        use: ['raw-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
      },
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: {
                filter: (url, resourcePath) => {
                  // Разрешаем все URL через webpack resolve
                  return true;
                }
              },
              import: {
                filter: (url, media, resourcePath) => {
                  return true;
                }
              }
            }
          },
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'src')]
              }
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    // Генерируем плагины для основных HTML файлов
    ...generatePlugins({ templateDir: 'src', script: 'head', src: '' }),
    // Генерируем плагины для диалогов (без инжекта скриптов)
    ...generatePlugins({ templateDir: 'src/dialogs', script: false, src: 'dialogs/' }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/img'),
          to: path.resolve(__dirname, 'dist/img'),
          noErrorOnMissing: true
        },
        {
          from: path.resolve(__dirname, 'src/fonts'),
          to: path.resolve(__dirname, 'dist/fonts'),
          noErrorOnMissing: true
        }
      ]
    })
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist')
      },
      {
        directory: path.join(__dirname, 'src/img'),
        publicPath: '/img'
      },
      {
        directory: path.join(__dirname, 'dist/dialogs'),
        publicPath: '/dialogs'
      },
      {
        directory: path.join(__dirname, 'src/fonts'),
        publicPath: '/fonts'
      }
    ],
    compress: true,
    port: 3003,
    host: 'localhost',
    allowedHosts: 'all',
    open: true,
    hot: true,
    historyApiFallback: true,
    watchFiles: ['src/**/*'],
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
};
