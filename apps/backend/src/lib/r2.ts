import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.warn('⚠️ Cloudflare R2 credentials missing in .env');
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export const r2Service = {
  async getUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(r2, command, { expiresIn: 3600 });
  },

  async getDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(r2, command, { expiresIn: 3600 });
  },

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    return await r2.send(command);
  },

  async getBucketStats() {
    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      const allObjects: any[] = [];

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput = await r2.send(command);
        const objects = response.Contents || [];
        allObjects.push(...objects);

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }
      
      const totalSizeBytes = allObjects.reduce((acc, obj) => acc + (obj.Size || 0), 0);
      
      return {
        totalSizeBytes,
        objectCount: allObjects.length,
        objects: allObjects.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        }))
      };
    } catch (error) {
      console.error('❌ Error fetching R2 bucket stats:', error);
      return { totalSizeBytes: 0, objectCount: 0, objects: [] };
    }
  },

  getPublicUrl(key: string) {
    const publicUrl = process.env.VITE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
    if (!publicUrl) return null;
    return `${publicUrl}/${key}`;
  }
};
