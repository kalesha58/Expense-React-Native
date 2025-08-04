This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.







# ✅ React Native Advanced Setup Guide

A comprehensive checklist to optimize and configure your React Native app with dynamic imports, fonts, patches, location permissions, and Google Maps.

---

## 📦 1. Enable Dynamic Imports

To use custom path aliases (like `@components/...` or `../../...`):

### Install Babel Plugin

```bash
npm i -D babel-plugin-module-resolver
```

### Configure `babel.config.js`

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
```

> 📝 Update aliases based on your folder structure.

### Update `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### Optional: Update `metro.config.js`

```js
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
})();
```

---

## 🎨 2. Link Custom Fonts

### Add to `package.json` Scripts

```json
"scripts": {
  "link:fonts": "npx react-native-asset"
}
```

### Run It

```bash
npm run link:fonts
```

---

## 🛠️ 3. Apply Patches Automatically

### Add to `package.json` Scripts

```json
"scripts": {
  "postinstall": "npx patch-package"
}
```

> This ensures patches from `patch-package` are automatically applied after installing dependencies.

---

## 🍎 4. Install iOS Pods (for New Architecture)

Add this script if you're using CocoaPods and new architecture:

```json
"scripts": {
  "pod-install": "RCT_NEW_ARCH_ENABLED=1 bundle exec pod install"
}
```

---

## 📍 5. Android Location & Internet Permissions

### In `android/app/src/main/AndroidManifest.xml` (inside `<manifest>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

### Inside `<application>`:

```xml
<application
    android:usesCleartextTraffic="true"
    android:hardwareAccelerated="true"
    ... >
    
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_GOOGLE_MAP_API_KEY" />
</application>
```

### Modify `<activity>` Tag:

```xml
<activity
    ...
    android:windowSoftInputMode="adjustNothing">
```

---

## 🗺️ 6. Google Maps API Integration

### Add to `<application>` (if not already):

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAP_API_KEY" />
```

> Replace `YOUR_GOOGLE_MAP_API_KEY` with your actual Google Maps key.

---

## 🔤 7. Vector Icons Optimization

### In `android/app/build.gradle`:

```gradle
project.ext.vectoricons = [
    iconFontNames: ['MaterialIcons.ttf','MaterialCommunityIcons.ttf','Ionicons.ttf']
]

apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

> Only the listed fonts will be copied into the APK, saving space.

---

## 🔐 8. Enable Proguard (for release builds)

In `android/app/build.gradle`:

```gradle
def enableProguardInReleaseBuilds = true
```