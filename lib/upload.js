import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFileSync } from "fs";
import { extname } from "path";
import { randomUUID } from "crypto";

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

export async function uploadFile(filePath) {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PREFIX = "",
    R2_URL_EXPIRY = "604800",
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error(
      "Missing R2 credentials. Run: npx github:dwiblr/r2-sharebox setup"
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const ext = extname(filePath).toLowerCase();
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const key = R2_PREFIX
    ? `${R2_PREFIX.replace(/\/$/, "")}/${filename}`
    : filename;

  const body = readFileSync(filePath);
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    { expiresIn: parseInt(R2_URL_EXPIRY, 10) }
  );

  return { url, key, bucket: R2_BUCKET_NAME };
}
