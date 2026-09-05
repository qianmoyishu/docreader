/**
 * 测试接口 - 不调用任何外部服务，用于诊断部署是否正常
 * 请求：GET /api/test
 */
export default async function handler(req) {
  return new Response(
    JSON.stringify({ code: 0, message: 'test ok', env: {
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      hasStoreId: !!process.env.BLOB_STORE_ID,
      hasOidc: !!process.env.VERCEL_OIDC_TOKEN
    } }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }
  );
}