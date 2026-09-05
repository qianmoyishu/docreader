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

export default async function handler(request) {
  // 仅允许 POST
  if (request.method !== 'POST') {
    return json({ code: 405, error: 'Method Not Allowed' }, 405);
  }

  try {
    // 解析 multipart form data
    const form = await request.formData();
    const file = form.get('file');
    const customName = form.get('name');

    // 校验文件是否存在
    if (!file || typeof file === 'string') {
      return json({ code: 400, error: '请选择要上传的文件' }, 400);
    }

    // 校验文件类型
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return json(
        { code: 415, error: '不支持的文件类型，仅支持 Word/Excel/PPT/PDF/TXT/CSV' },
        415
      );
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return json(
        { code: 413, error: '文件过大，最大支持 4MB（Vercel 免费版限制）' },
        413
      );
    }

    // 生成唯一文件名（避免冲突）
    const randomId = crypto.randomUUID();
    const pathname = `documents/${randomId}.${extension}`;

    // 上传到 Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type
    });

    // 返回文件信息
    return json({
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
    return json({ code: 500, error: '服务器内部错误' }, 500);
  }
}

// 统一 JSON 响应
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}