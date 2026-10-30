/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/studnet/attendence',
        destination: '/student/attendance',
        permanent: false,
      },
      {
        source: '/studnet/attendance',
        destination: '/student/attendance',
        permanent: false,
      },
      {
        source: '/student/attendence',
        destination: '/student/attendance',
        permanent: false,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable filesystem disk caching to prevent ENOSPC on low disk space environments
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
