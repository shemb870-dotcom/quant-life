# QuantLog 部署指南

## 项目结构
```
韭菜/
├── public/          # 前端静态文件
├── server.js        # 后端服务器
├── package.json     # 依赖配置
└── supabase-init.sql # 数据库初始化脚本
```

## 本地运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 Supabase

1. 访问 [supabase.com](https://supabase.com) 注册并创建新项目
2. 在 Project Settings → API 中获取：
   - Project URL
   - anon public key

3. 创建存储桶：
   - 进入 Storage 页面
   - 创建名为 `uploads` 的存储桶
   - 设置为 Public 公开访问

4. 执行数据库初始化：
   - 进入 SQL Editor
   - 复制并运行 `supabase-init.sql` 中的 SQL 语句

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 启动服务器
```bash
npm start
```

访问：
- 主页: http://localhost:3000
- 后台: http://localhost:3000/admin.html (密码: tjx20070827)

## 部署到免费平台

### 方案：Vercel + Supabase

#### 步骤 1: 部署后端到 Vercel

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project" 导入你的仓库
4. 配置环境变量（在 Vercel 项目设置中）：
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   ```
5. 点击 Deploy

#### 步骤 2: 配置 Vercel

创建 `vercel.json` 配置文件（已包含）：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

#### 部署完成后

Vercel 会提供一个 URL，例如：`https://quantlog.vercel.app`

- 主页: `https://quantlog.vercel.app`
- 后台: `https://quantlog.vercel.app/admin.html`

## 功能说明

### 后台管理 (admin.html)
- 输入标题和内容发布动态
- 支持添加代码片段（Python/LaTeX）
- 支持上传图片、PDF、CSV 等文件

### 主页展示 (index.html)
- 自动从数据库获取并显示所有动态
- 按时间倒序排列
- 支持代码高亮显示

## 安全建议

1. **修改密码**: 在 `server.js` 中修改 `verifyPassword` 函数的密码验证逻辑
2. **环境变量**: 永远不要将 `.env` 文件提交到 Git
3. **数据库**: 生产环境建议启用 Row Level Security

## 免费额度

| 服务 | 免费额度 |
|------|----------|
| Vercel | 100GB 带宽/月，无限项目 |
| Supabase | 500MB 数据库，1GB 存储，2GB 带宽/月 |

个人使用完全足够。