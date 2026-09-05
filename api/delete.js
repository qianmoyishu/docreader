/**
 * 文件删除接口
 * 删除 Vercel Blob 中已上传的文档
 *
 * 请求：POST JSON { url: "https://..." }
 * 返回：{ code: 0 }
 */
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const { url } = body;

    if (!url) {
      return res.status(400).json({ code: 400, error: '缺少 url 参数' });
    }

    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    return res.status(200).json({ code: 0, data: { url } });
  } catch (err) {
    console.error('删除文件失败:', err);
    return res.status(500).json({ code: 500, error: '服务器内部错误' });
  }
}