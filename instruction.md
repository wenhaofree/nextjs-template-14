# Next.js 14 模板项目文档

## 一、技术栈
- 框架: Next.js 14
- 语言: TypeScript
- 状态管理: Zustand
- CSS: Tailwind CSS
- 国际化: next-intl
- ORM: Prisma
- UI组件: shadcn/ui

## 二、数据库设计 (Neon PostgreSQL)

### 1. 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 工具表
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- 提交工具的用户
    title VARCHAR(255) NOT NULL,                         -- 工具标题
    url VARCHAR(2048) NOT NULL,                         -- 工具网址
    description TEXT,                                   -- 工具描述
    category_id UUID REFERENCES categories(id),         -- 工具分类
    status VARCHAR(50) DEFAULT 'pending',               -- 状态：pending/approved/rejected
    view_count INTEGER DEFAULT 0,                       -- 访问计数
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 工具收藏表
CREATE TABLE tool_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tool_id)  -- 防止重复收藏
);

-- 分类表
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
三、主要功能流程
1. 工具提交和管理
用户登录后可提交工具（标题、URL、描述）
管理员审核工具信息
用户可以收藏感兴趣的工具
记录工具访问统计
2. API接口设计# 工具相关接口
GET    /api/tools              # 获取工具列表
POST   /api/tools              # 提交新工具
GET    /api/tools/:id          # 获取工具详情
POST   /api/tools/:id/favorite # 收藏工具
DELETE /api/tools/:id/favorite # 取消收藏

# 用户相关接口
POST   /api/auth/login         # 用户登录
POST   /api/auth/register      # 用户注册
GET    /api/user/tools         # 获取用户提交的工具
GET    /api/user/favorites     # 获取用户收藏的工具
四、项目结构
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   ├── tools/
│   │   │   ├── [id]/
│   │   ├── submit/
│   │   ├── profile/
├── components/
│   ├── layout/
│   ├── tools/
│   ├── forms/
├── lib/
│   ├── db/
│   ├── auth/