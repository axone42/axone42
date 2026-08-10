/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // www → apex 통일 (중복 콘텐츠 방지, SEO 정규화)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.axone.ai.kr" }],
        destination: "https://axone.ai.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
