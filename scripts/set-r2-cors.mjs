/**
 * set-r2-cors.mjs
 * Đặt CORS policy cho R2 bucket — cho phép tdgamestudio.com fetch mọi file
 *
 * Usage: node --env-file=.env.local scripts/set-r2-cors.mjs
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        "https://tdgamestudio.com",
        "https://www.tdgamestudio.com",
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["Content-Length", "Content-Type", "ETag"],
      MaxAgeSeconds: 86400,
    },
  ],
};

console.log("Setting CORS on bucket:", BUCKET);
console.log("Config:", JSON.stringify(corsConfig, null, 2));

try {
  await client.send(new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: corsConfig,
  }));
  console.log("\n✅ CORS policy applied successfully!");

  // Verify
  const result = await client.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
  console.log("\nVerified CORS rules:", JSON.stringify(result.CORSRules, null, 2));
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
