module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/main.ts',
      // the source template
      template: 'public/index.html',
      // when using title option,
      // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
      title: 'TerraCAD',
    },
    preferences: {
      // entry for the page
      entry: 'src/windows/preferences/main.ts',
      // the source template
      template: 'public/index.html',
      // when using title option,
      // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
      title: 'Preferences',
    },
  },
}
