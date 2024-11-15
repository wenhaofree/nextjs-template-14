import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/settings';

export default createMiddleware({
  locales,
  defaultLocale,
  // Redirect to default locale for root path
  localePrefix: 'always'
});

export const config = {
  matcher: ['/', '/(zh|en)/:path*']
};
