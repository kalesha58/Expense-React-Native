module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@assets': './src/assets',
          '@components': './src/components',
          '@constants': './src/constants',
          '@context': './src/context',
          '@hooks': './src/hooks',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@service': './src/service',
          '@types': './src/types',
          '@utils': './src/utils',
          '@api': './src/api',
          '@services': './src/services',
          '@styles': './src/styles',
          '@config': './src/config',
        },
      },
    ],
  ],
};
