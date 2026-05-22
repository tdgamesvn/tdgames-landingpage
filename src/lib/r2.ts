import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !accountId) {
    throw new Error("R2 env vars are required");
  }

  return { endpoint, bucket, accessKeyId, secretAccessKey, accountId };
}

function createR2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function r2PublicUrl(key: string) {
  const { accountId } = getR2Config();
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `https://pub-${accountId}.r2.dev/${cleanKey}`;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const { bucket } = getR2Config();
  const r2Client = createR2Client();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return {
    key: params.key,
    url: r2PublicUrl(params.key),
  };
}
