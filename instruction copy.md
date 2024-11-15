AI导航网站详细功能实现方案
一、技术栈确认
plaintext

复制
- Framework: Next.js 14 (App Router)
- Styling: TailwindCSS
- Authentication: Clerk
- Database: Neon (PostgreSQL)
- Payment: Stripe
- i18n: next-intl
- ORM: Prisma
- UI Components: shadcn/ui
二、数据库模型 (Prisma Schema)
prisma

复制
model Tool {
  id          String      @id @default(cuid())
  name        String
  description String
  logo        String
  url         String
  category    Category    @relation(fields: [categoryId], references: [id])
  categoryId  String
  pricing     PricingType
  featured    Boolean     @default(false)
  views       Int         @default(0)
  likes       Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  reviews     Review[]
}

model Category {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  tools Tool[]
}

model Review {
  id        String   @id @default(cuid())
  content   String
  rating    Int
  toolId    String
  tool      Tool     @relation(fields: [toolId], references: [id])
  userId    String
  createdAt DateTime @default(now())
}

enum PricingType {
  FREE
  FREEMIUM
  PAID
}
三、目录结构
plaintext

复制
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx
│   │   ├── tools/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── cards/
│   │   ├── ToolCard.tsx
│   │   └── CategoryCard.tsx
│   └── ui/
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── locales/
│   ├── en.json
│   └── zh.json
└── types/
四、核心组件实现
1. Header组件
tsx

复制
// components/layout/Header.tsx
export default function Header() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6">
          <CategoryNav />
          <SearchBar />
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitch />
          {user ? (
            <UserDropdown />
          ) : (
            <SignInButton mode="modal" />
          )}
        </div>
      </div>
    </header>
  );
}
2. ToolCard组件
tsx

复制
// components/cards/ToolCard.tsx
interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="group relative rounded-lg border p-6 hover:shadow-lg transition">
      <div className="flex items-center gap-4">
        <Image
          src={tool.logo}
          alt={tool.name}
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h3 className="text-lg font-semibold">{tool.name}</h3>
          <p className="text-sm text-gray-500">{tool.category.name}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 line-clamp-2">
        {tool.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <PricingBadge type={tool.pricing} />
        <Link
          href={`/tools/${tool.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}
3. 工具详情页
tsx

复制
// app/[locale]/tools/[id]/page.tsx
export default async function ToolPage({ params }: { params: { id: string } }) {
  const tool = await prisma.tool.findUnique({
    where: { id: params.id },
    include: { category: true, reviews: true }
  });

  if (!tool) return notFound();

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ToolHeader tool={tool} />
          <ToolDescription tool={tool} />
          <ReviewSection reviews={tool.reviews} />
        </div>
        <div>
          <PricingCard tool={tool} />
          <RelatedTools categoryId={tool.categoryId} />
        </div>
      </div>
    </div>
  );
}
五、国际化配置
typescript

复制
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
json

复制
// locales/en.json
{
  "common": {
    "nav": {
      "home": "Home",
      "tools": "Tools",
      "categories": "Categories"
    },
    "pricing": {
      "free": "Free",
      "freemium": "Freemium",
      "paid": "Paid"
    }
  }
}
六、API路由示例
typescript

复制
// app/api/tools/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;

  const tools = await prisma.tool.findMany({
    where: category ? { categoryId: category } : undefined,
    include: { category: true },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(tools);
}
七、Stripe支持会员订阅
typescript

复制
// app/api/create-subscription/route.ts
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { priceId } = await req.json();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/canceled`,
      metadata: {
        userId,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }));
  } catch (error) {
    return new Response('Error creating subscription', { status: 500 });
  }
}
八、主页实现
tsx

复制
// app/[locale]/page.tsx
export default async function HomePage() {
  const featuredTools = await prisma.tool.findMany({
    where: { featured: true },
    include: { category: true },
    take: 6
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { tools: true } } }
  });

  return (
    <main>
      <HeroSection />
      
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Featured Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>
      
      <NewsletterSection />
    </main>
  );
}
需要我详细展开任何部分吗？比如：

具体的样式实现
更详细的API接口设计
状态管理方案
部署配置
SEO优化方案
给出更详细的API接口数据设计； 其中用户的订阅级别根据Clerk框架的meta存储； 整体只要一张工具表实现； 同时给出SEO优化方案； 输出完整的md文档内容


Claude-3.5-Sonnet

Poe

AI导航网站技术文档
一、数据库设计 (Prisma Schema)
prisma

复制
model Tool {
  id            String      @id @default(cuid())
  name          String      @db.VarChar(100)
  nameZh        String      @db.VarChar(100)    // 中文名称
  description   String      @db.Text
  descriptionZh String      @db.Text           // 中文描述
  logo          String      @db.VarChar(255)
  url           String      @db.VarChar(255)
  category      String      @db.VarChar(50)     // AI工具分类
  tags          String[]                        // 标签数组
  pricing       PricingType @default(FREE)
  featured      Boolean     @default(false)     // 是否精选
  popular       Boolean     @default(false)     // 是否热门
  verified      Boolean     @default(false)     // 是否官方验证
  views         Int         @default(0)         // 查看次数
  likes         Int         @default(0)         // 点赞数
  slug          String      @unique             // URL友好的标识符
  metaTitle     String?     @db.VarChar(160)    // SEO标题
  metaDesc      String?     @db.Text            // SEO描述
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([category])
  @@index([featured])
  @@index([popular])
  @@index([slug])
}

enum PricingType {
  FREE
  FREEMIUM
  PAID
  ENTERPRISE
}
二、API接口设计
1. 工具相关接口
获取工具列表
typescript

复制
// GET /api/tools
interface QueryParams {
  page?: number;           // 页码，默认1
  limit?: number;          // 每页数量，默认12
  category?: string;       // 分类筛选
  tags?: string[];        // 标签筛选
  pricing?: PricingType;  // 价格类型筛选
  search?: string;        // 搜索关键词
  sort?: 'popular' | 'newest' | 'views'; // 排序方式
  locale?: 'en' | 'zh';   // 语言
}

interface Response {
  tools: Tool[];
  total: number;
  hasMore: boolean;
}
获取工具详情
typescript

复制
// GET /api/tools/[slug]
interface Response {
  tool: Tool;
  related: Tool[];  // 相关工具推荐
}
更新工具统计
typescript

复制
// POST /api/tools/[id]/stats
interface RequestBody {
  action: 'view' | 'like';
}

interface Response {
  success: boolean;
  views?: number;
  likes?: number;
}
2. 用户相关接口
获取用户收藏
typescript

复制
// GET /api/user/favorites
interface Response {
  favorites: Tool[];
}
更新收藏状态
typescript

复制
// POST /api/user/favorites
interface RequestBody {
  toolId: string;
  action: 'add' | 'remove';
}
3. 管理员接口
创建/更新工具
typescript

复制
// POST /api/admin/tools
interface RequestBody {
  id?: string;            // 更新时需提供
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  logo: string;
  url: string;
  category: string;
  tags: string[];
  pricing: PricingType;
  featured?: boolean;
  popular?: boolean;
  verified?: boolean;
  metaTitle?: string;
  metaDesc?: string;
}
三、SEO优化方案
1. 技术实现
Metadata配置
typescript

复制
// app/[locale]/tools/[slug]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const tool = await prisma.tool.findUnique({
    where: { slug: params.slug }
  });

  if (!tool) return {};

  return {
    title: tool.metaTitle || `${tool.name} - AI工具导航`,
    description: tool.metaDesc || tool.description,
    openGraph: {
      title: tool.metaTitle || tool.name,
      description: tool.metaDesc || tool.description,
      images: [tool.logo],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.metaTitle || tool.name,
      description: tool.metaDesc || tool.description,
      images: [tool.logo],
    },
  };
}
动态站点地图
typescript

复制
// app/sitemap.ts
export default async function sitemap() {
  const tools = await prisma.tool.findMany({
    select: { slug: true, updatedAt: true }
  });

  return [
    {
      url: 'https://yoursite.com',
      lastModified: new Date(),
    },
    ...tools.map((tool) => ({
      url: `https://yoursite.com/tools/${tool.slug}`,
      lastModified: tool.updatedAt,
    })),
  ];
}
robots.txt
typescript

复制
// app/robots.ts
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://yoursite.com/sitemap.xml',
  };
}
2. 页面优化
JSON-LD结构化数据
typescript

复制
// components/ToolJsonLd.tsx
export function ToolJsonLd({ tool }: { tool: Tool }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    image: tool.logo,
    url: tool.url,
    applicationCategory: 'AITool',
    offers: {
      '@type': 'Offer',
      price: tool.pricing === 'FREE' ? '0' : undefined,
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
3. 性能优化
图片优化
typescript

复制
// next.config.js
module.exports = {
  images: {
    domains: ['your-image-host.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
缓存策略
typescript

复制
// lib/cache.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedData(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached as string) : null;
}

export async function setCachedData(key: string, data: any, expireIn = 3600) {
  await redis.setex(key, expireIn, JSON.stringify(data));
}
四、国际化实现
1. 路由配置
typescript

复制
// middleware.ts
import { createMiddleware } from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
2. 多语言内容处理
typescript

复制
// app/[locale]/tools/[slug]/page.tsx
export default async function ToolPage({ 
  params: { slug, locale } 
}: { 
  params: { slug: string, locale: string } 
}) {
  const tool = await prisma.tool.findUnique({
    where: { slug }
  });

  const name = locale === 'zh' ? tool.nameZh : tool.name;
  const description = locale === 'zh' ? tool.descriptionZh : tool.description;

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
五、用户订阅级别管理
1. Clerk元数据配置
typescript

复制
// types/clerk.ts
interface UserMetadata {
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionEndDate?: string;
  features?: string[];
}
2. 订阅更新处理
typescript

复制
// app/api/webhook/stripe/route.ts
import { clerkClient } from '@clerk/nextjs';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.userId;

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        subscriptionTier: subscription.status === 'active' ? 'pro' : 'free',
        subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
      },
    });
  }

  return new Response(null, { status: 200 });
}
