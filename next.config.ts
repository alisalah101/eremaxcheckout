const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ❗ Warning: hides real issues
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
