/**
 * 签名 URL 接口
 * 根据 pathname 动态生成限时有效的签名下载 URL（私有 store 必须签名才能访问）
 *
 * 请求：GET /api/sign?pathname=documents/xxx.docx
 * 响应：{ code: 0, data: { url } }
 */
import { issueSignedToken, presignUrl } from '@vercel/blob';

export default async function handler(req, res) {
  // 仅允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 405, error: 'Method Not Allowed' });
  }

  const pathname = req.query.pathname;
  if (!pathname) {
    return res.status(400).json({ code: 400, error: '缺少 pathname 参数' });
  }

  try {
    // 签发签名令牌（限定 get 操作，有效期 1 小时）
    const token = await issueSignedToken({
      pathname,
      operations: ['get'],
      validUntil: Date.now() + 60 * 60 * 1000
    });

    // 生成签名 URL
    const { presignedUrl } = await presignUrl(token, {
      operation: 'get',
      pathname,
      access: 'private',
      validUntil: Date.now() + 60 * 60 * 1000
    });

    return res.status(200).json({ code: 0, data: { url: presignedUrl } });
  } catch (err) {
    console.error('生成签名 URL 失败:', err);
    return res.status(500).json({ code: 500, error: '服务器内部错误' });
  }
}