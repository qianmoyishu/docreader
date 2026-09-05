/**
 * 文件列表接口
 * 获取已上传到 Vercel Blob 的文档列表
 *
 * 请求：GET /api/files
 * 响应：{ code: 0, data: [{ url, pathname, size, uploadedAt }] }
 */
import { list } from '@vercel/blob';

export default async function handler(req) {
  // 仅允许 GET
  if (req.method !== 'GET') {
    return json({ code: 405, error: 'Method Not Allowed' }, 405);
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

    return json({ code: 0, data: files });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    return json({ code: 500, error: '服务器内部错误' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}