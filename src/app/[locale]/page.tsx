import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { GoogleAuth } from '@/components/auth/GoogleAuth';

export default function Home() {
  const t = useTranslations('index');
  const nav = useTranslations('nav');
  
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link href="/" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                {nav('home')}
              </Link>
              <Link href="/tools" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                {nav('tools')}
              </Link>
              <Link href="/submit" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                {nav('submit')}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <GoogleAuth />
              <Link href="/en" locale="en" className="text-gray-700 hover:text-gray-900">
                English
              </Link>
              <Link href="/zh" locale="zh" className="text-gray-700 hover:text-gray-900">
                中文
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('description')}
          </p>
        </div>
      </main>
    </div>
  );
}
