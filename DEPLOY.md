# 🚀 Vercel 部署完整指南

本文档指导你如何将后端项目上传到 GitHub，并通过 Vercel 网页控制台完成部署。

---

## 📋 部署流程总览

```
1. 准备后端项目
   ↓
2. 推送到 GitHub
   ↓
3. 登录 Vercel 并创建 Blob Store
   ↓
4. 导入 GitHub 项目部署
   ↓
5. 配置环境变量
   ↓
6. 测试接口
   ↓
7. 小程序端对接
```

---

## 第 1 步：准备后端项目

后端项目位于 `vercel-backend/` 目录，结构如下：

```
vercel-backend/
├── api/
│   ├── upload.js    # 文件上传接口
│   ├── files.js     # 文件列表接口
│   └── delete.js    # 文件删除接口
├── package.json     # 依赖配置
├── vercel.json      # Vercel 配置
├── .env.example     # 环境变量示例
├── .gitignore       # Git 忽略文件
└── README.md        # 项目说明
```

> ✅ 项目已完整，无需修改，可直接推送。

---

## 第 2 步：推送到 GitHub

### 2.1 创建 GitHub 仓库

1. 打开 [github.com](https://github.com) 并登录
2. 点击右上角 **+** → **New repository**
3. 填写仓库名称，例如 `doc-viewer-backend`
4. 选择 **Public**（公开）或 **Private**（私有）
5. 点击 **Create repository**

### 2.2 推送代码

在本地打开终端，进入后端目录：

```bash
cd vercel-backend

# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "初始化文档查看后端"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/doc-viewer-backend.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

> 💡 如果使用 GitHub Desktop，可以直接把 `vercel-backend` 文件夹拖入，然后 Commit 并 Push。

---

## 第 3 步：登录 Vercel 并创建 Blob Store

### 3.1 登录 Vercel

1. 打开 [vercel.com](https://vercel.com)
2. 点击 **Sign Up** 或 **Log In**
3. 推荐使用 **GitHub 账号**登录（后续导入项目更方便）

### 3.2 创建 Blob Store（对象存储）

1. 登录后进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Storage**（存储）标签
3. 点击 **Create Database** → 选择 **Blob**
4. 填写存储名称（如 `doc-viewer-blob`）
5. 选择区域（建议选离你近的，如 `Singapore` 或 `Hong Kong`）
6. 点击 **Create**

> ⚠️ **重要**：创建 Blob Store 后，Vercel 会自动生成一个 `BLOB_READ_WRITE_TOKEN`。这个 token 稍后需要配置到环境变量中。

---

## 第 4 步：导入 GitHub 项目部署

1. 在 Vercel Dashboard 点击 **Add New** → **Project**
2. 在 **Import Git Repository** 列表中找到你刚推送的 `doc-viewer-backend` 仓库
3. 点击 **Import**
4. 配置项目：
   - **Framework Preset**：选择 **Other**（纯 Node.js 项目）
   - **Root Directory**：保持默认（`/`）
   - **Build Command**：留空（无需构建）
   - **Output Directory**：留空
5. 点击 **Deploy**

> ⏳ 部署大约需要 1-2 分钟，完成后会显示你的项目域名，如 `https://doc-viewer-backend.vercel.app`

---

## 第 5 步：配置环境变量

部署完成后，需要配置 `BLOB_READ_WRITE_TOKEN`：

1. 进入你的项目 → **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 填写：
   - **Key**：`BLOB_READ_WRITE_TOKEN`
   - **Value**：粘贴第 3 步获取的 token
4. 点击 **Save**
5. 回到 **Deployments**，点击最新部署右侧的 **...** → **Redeploy**（重新部署使环境变量生效）

> 💡 如果创建 Blob Store 时选择了关联到当前项目，Vercel 会自动注入该环境变量，可跳过此步。

---

## 第 6 步：测试接口

部署完成后，用浏览器或 Postman 测试：

### 测试上传接口

```bash
curl -X POST https://你的域名.vercel.app/api/upload \
  -F "file=@/path/to/test.docx"
```

**预期响应：**
```json
{
  "code": 0,
  "data": {
    "url": "https://xxx.public.blob.vercel-storage.com/documents/xxx.docx",
    "pathname": "documents/xxx.docx",
    "size": 12345,
    "name": "test.docx",
    "type": "docx"
  }
}
```

### 测试文件列表接口

```bash
curl https://你的域名.vercel.app/api/files
```

**预期响应：**
```json
{
  "code": 0,
  "data": [
    { "url": "...", "pathname": "...", "size": 12345, "uploadedAt": "..." }
  ]
}
```

---

## 第 7 步：小程序端对接

部署成功后，把域名填入小程序 `app.js`：

```javascript
globalData: {
  // 上传接口地址
  uploadUrl: 'https://你的域名.vercel.app/api/upload',
  // 删除接口地址
  deleteUrl: 'https://你的域名.vercel.app/api/delete',
  documents: []
}
```

### 配置小程序合法域名

在微信小程序后台（或开发者工具「详情 → 域名信息」）配置：

| 类型 | 域名 |
|------|------|
| **uploadFile 合法域名** | `https://你的域名.vercel.app` |
| **downloadFile 合法域名** | `https://你的域名.vercel.app` |
| **downloadFile 合法域名** | `https://*.public.blob.vercel-storage.com` |
| **web-view 业务域名** | `https://view.officeapps.live.com` |

> 💡 开发调试时，可在微信开发者工具中勾选「不校验合法域名」快速测试。

---

## ⚠️ 常见问题

### Q1：上传报 413 错误
**原因**：文件超过 4MB（Vercel Functions 请求体限制）。
**解决**：压缩文件，或改用客户端直传方案。

### Q2：上传报 415 错误
**原因**：文件类型不支持。
**解决**：仅支持 Word/Excel/PPT/PDF/TXT/CSV 格式。

### Q3：上传成功但无法在线预览
**原因**：web-view 业务域名未配置，或文档地址不可公网访问。
**解决**：确认已配置 `view.officeapps.live.com` 为 web-view 业务域名。

### Q4：环境变量不生效
**原因**：修改环境变量后未重新部署。
**解决**：修改后需 **Redeploy** 最新部署。

---

## 📌 接口汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件，返回公网 URL |
| GET | `/api/files` | 获取文件列表 |
| POST | `/api/delete` | 删除文件 |

---

## 🎉 完成

部署完成后，你的小程序就具备了完整的"上传 → 电脑版式在线预览"能力。如有问题，参考 [Vercel 官方文档](https://vercel.com/docs) 或联系我。