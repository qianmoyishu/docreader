/**
 * 文件上传接口
 * 接收小程序上传的文档，保存到 Vercel Blob，返回公网可访问的 URL
 *
 * 请求：POST multipart/form-data
 *   - file: 文件（字段名必须为 file）
 *   - name: 文件名（可选）
 *
 * 响应：{ url, pathname, size, name, type }
 *
 * 注意：Vercel Functions 请求体上限约 4.5MB，适合大多数文档。
 *       超过 4MB 的文件建议使用客户端直传模式。
 */
import { put } from '@vercel/blob';

// 允许的文件类型（MIME type -> 扩展名）
const ALLOWED_TYPES = {
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv'
};

// 最大文件大小：4MB（Vercel Functions 请求体限制）
const MAX_SIZE = 4 * 1024 * 1024;

export default async function handler(req, res) {
  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, error: 'Method Not Allowed' });
  }

  try {
    // 解析 multipart form data
    const form = await req.formData();
    const file = form.get('file');
    const customName = form.get('name');

    // 校验文件是否存在
    if (!file || typeof file === 'string') {
      return res.status(400).json({ code: 400, error: '请选择要上传的文件' });
    }

    // 校验文件类型
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return res.status(415).json({
        code: 415,
        error: '不支持的文件类型，仅支持 Word/Excel/PPT/PDF/TXT/CSV'
      });
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return res.status(413).json({
        code: 413,
        error: '文件过大，最大支持 4MB（Vercel 免费版限制）'
      });
    }

    // 生成唯一文件名（避免冲突）
    const randomId = crypto.randomUUID();
    const pathname = `documents/${randomId}.${extension}`;

    // 上传到 Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // 返回文件信息
    return res.status(200).json({
      code: 0,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        name: customName || file.name || blob.pathname,
        type: extension
      }
    });
  } catch (err) {
    console.error('上传失败:', err);
    return res.status(500).json({ code: 500, error: '服务器内部错误' });
  }
}