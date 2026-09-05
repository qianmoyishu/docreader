/**
 * 文件列表接口
 * 获取已上传到 Vercel Blob 的文档列表
 *
 * 请求：GET /api/files
 * 响应：{ code: 0, data: [{ url, pathname, size, uploadedAt }] }
 */
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // 仅允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, error: 'Method Not Allowed' });
  }

  try {
    // 列出 documents 目录下的所有文件
    const { blobs } = await list({
      prefix: 'documents/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt
    }));

    return res.status(200).json({ code: 0, data: files });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    return res.status(500).json({ code: 500, error: '服务器内部错误' });
  }
}