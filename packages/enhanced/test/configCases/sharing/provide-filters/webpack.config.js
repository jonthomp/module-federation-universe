const { ProvideSharedPlugin } = require('../../../../dist/src');

module.exports = {
  mode: 'development',
  devtool: false,
  plugins: [
    new ProvideSharedPlugin({
      provides: {
        // Version filtering tests
        './version-include': {
          shareKey: 'version-include',
          version: '1.2.0',
          include: {
            version: '^1.0.0',
          },
        },
        './version-exclude': {
          shareKey: 'version-exclude',
          version: '1.2.0',
          exclude: {
            version: '^2.0.0',
          },
        },
        './version-include-fail': {
          shareKey: 'version-include-fail',
          version: '1.2.0',
          include: {
            version: '^2.0.0',
          },
        },
        './version-exclude-fail': {
          shareKey: 'version-exclude-fail',
          version: '2.0.0',
          exclude: {
            version: '^2.0.0',
          },
        },
        // Singleton with filters
        './singleton-filter': {
          shareKey: 'singleton-filter',
          version: '1.0.0',
          singleton: true,
          include: {
            version: '^1.0.0',
          },
        },
      },
    }),
  ],
};
