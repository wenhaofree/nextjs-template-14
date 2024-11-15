import {createSharedPathnamesNavigation} from 'next-intl/navigation';

export const locales = ['en', 'zh'] as const;
export const localePrefix = 'always'; // Default

// Create and export navigation utilities
export const {Link, redirect, usePathname, useRouter} = createSharedPathnamesNavigation({
  locales,
  localePrefix
}); 