const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer Firebase's React Native auth build (exports getReactNativePersistence)
// over the browser bundle, which only supports memory persistence.
config.resolver.unstable_conditionNames = [
  "react-native",
  "browser",
  "require",
  "import",
];

module.exports = config;
