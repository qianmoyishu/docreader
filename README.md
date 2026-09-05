# 文档查看小程序 - 后端服务

为「文档查看微信小程序」提供文件上传与存储服务，部署在 **Vercel**，使用 **Vercel Blob** 存储文件。

## ✨ 功能

- **文件上传**：接收小程序上传的文档，保存到 Vercel Blob，返回公网可访问的 URL
- **文件列表**：获取已上传的文档列表
- **文件删除**：删除已上传的文档

## 📁 项目结构

```
vercel-backend/
├── api/
│   ├── upload.js    # 文件上传接口
│   ├── files.js     # 文件列表接口
│   └── delete.js    # 文件删除接口
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

## 🚀 部署到 Vercel

### 方式一：Vercel 网页控制台（推荐）

1. 将 `vercel-backend` 目录推送到 GitHub 仓库
2. 打开 [Vercel](https://vercel.com) → **Add New** → **Project**
3. 导入你的 GitHub 仓库
4. 框架选择 **Other**（纯 Node.js Serverless）
5. 部署完成后，在项目 **Settings → Environment Variables** 添加：
   - `BLOB_READ_WRITE_TOKEN`：Vercel Blob 的读写令牌

### 方式二：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入后端目录
cd vercel-backend

# 安装依赖
npm install

# 本地开发
vercel dev

# 部署到生产
vercel --prod
```

### 创建 Vercel Blob Store

1. 在 Vercel 控制台进入你的项目
2. 点击 **Storage** → **Create Database** → **Blob**
3. 创建后，Vercel 会自动生成 `BLOB_READ_WRITE_TOKEN` 并注入环境变量
4. 若未自动注入，手动复制 token 到环境变量

## 📡 接口说明

### 1. 上传文件

```
POST /api/upload
Content-Type: multipart/form-data
```

| 字段 | 类型 | 说明 |
|------|------|------|
| file | File | 文件内容（必填） |
| name | string | 文件名（可选） |

**成功响应：**
```json
{
  "code": 0,
  "data": {
    "url": "https://xxx.public.blob.vercel-storage.com/documents/xxx.docx",
    "pathname": "documents/xxx.docx",
    "size": 12345,
    "name": "产品需求文档.docx",
    "type": "docx"
  }
}
```

### 2. 文件列表

```
GET /api/files
```

**成功响应：**
```json
{
  "code": 0,
  "data": [
    { "url": "...", "pathname": "...", "size": 12345, "uploadedAt": "..." }
  ]
}
```

### 3. 删除文件

```
POST /api/delete
Content-Type: application/json
```

```json
{ "url": "https://xxx.public.blob.vercel-storage.com/documents/xxx.docx" }
```

## ⚠️ 注意事项

1. **文件大小限制**：Vercel Functions 请求体上限约 **4.5MB**，本接口限制为 **4MB**
2. **支持格式**：Word（doc/docx）、Excel（xls/xlsx）、PPT（ppt/pptx）、PDF、TXT、CSV
3. **公网访问**：上传后返回的 `url` 是公网可访问地址，可直接用于小程序 web-view 在线预览
4. **大文件**：超过 4MB 的文件需改用客户端直传方案（`@vercel/blob/client` 的 `upload()` 方法）

## 🔗 与小程序对接

部署完成后，将你的 Vercel 域名填入小程序 `app.js`：

```javascript
globalData: {
  uploadUrl: 'https://your-project.vercel.app/api/upload',
  documents: []
}
```

同时在小程序后台配置：
- **uploadFile 合法域名**：`https://your-project.vercel.app`
- **downloadFile 合法域名**：`https://your-project.vercel.app` 和 `*.public.blob.vercel-storage.com`
- **web-view 业务域名**：`view.officeapps.live.com`