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
 *
 * 使用命名导出 POST（Web fetch 风格），以便使用 request.formData()。
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

// 扩展名 -> 正确的 MIME type（部分机型上传时 MIME 为 octet-stream，按文件名推断后补正）
const EXT_MIME = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv'
};

// 从文件名提取扩展名
function extFromName(name) {
  const m = (name || '').match(/\.([a-zA-Z0-9]+)$/);
  const ext = m ? m[1].toLowerCase() : '';
  return EXT_MIME[ext] ? ext : '';
}

// 最大文件大小：4MB（Vercel Functions 请求体限制）
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(request) {
  try {
    // 解析 multipart form data
    const form = await request.formData();
    const file = form.get('file');
    const customName = form.get('name');

    // 校验文件是否存在
    if (!file || typeof file === 'string') {
      return json({ code: 400, error: '请选择要上传的文件' }, 400);
    }

    // 校验文件类型：优先按客户端 MIME 判断；
    // 部分机型 wx.uploadFile 发送 application/octet-stream，此时按文件名兜底推断
    let extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      extension = extFromName(customName || file.name);
    }
    if (!extension) {
      return json({
        code: 415,
        error: '不支持的文件类型，仅支持 Word/Excel/PPT/PDF/TXT/CSV'
      }, 415);
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return json({
        code: 413,
        error: '文件过大，最大支持 4MB（Vercel 免费版限制）'
      }, 413);
    }

    // 生成唯一文件名（避免冲突）
    const randomId = crypto.randomUUID();
    const pathname = `documents/${randomId}.${extension}`;

    // 上传到 Vercel Blob（store 为 private，文件保持私有，不公开泄露）
    // 统一写入正确的 Content-Type，避免 octet-stream 影响预览渲染
    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: true,
      contentType: EXT_MIME[extension] || file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    // 返回文件信息（url 为签名 URL 用于立即预览，pathname 用于后续动态获取签名）
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
    return json({ code: 500, error: '服务器内部错误', detail: String(err && err.message || err) }, 500);
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