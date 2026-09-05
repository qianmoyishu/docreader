/**
 * 文件删除接口
 * 删除 Vercel Blob 中已上传的文档
 *
 * 请求：POST JSON { url: "https://..." }
 * 返回：{ code: 0 }
 */
import { del } from '@vercel/blob';

export default async function handler(req) {
  // 仅允许 POST
  if (req.method !== 'POST') {
    return json({ code: 405, error: 'Method Not Allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return json({ code: 400, error: '缺少 url 参数' }, 400);
    }

    await del(url);

    return json({ code: 0, data: { url } });
  } catch (err) {
    console.error('删除文件失败:', err);
    return json({ code: 500, error: '服务器内部错误' }, 500);
  }
}

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