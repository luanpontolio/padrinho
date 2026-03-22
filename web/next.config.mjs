import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // MetaMask SDK pulls in a React-Native-only dep that doesn't exist in the browser.
    // Stub it out so the build doesn't fail.
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    return config;
  },
};

export default withSerwist(nextConfig);
