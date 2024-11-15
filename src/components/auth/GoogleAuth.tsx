'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// Google OAuth client configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

export interface GoogleUser {
  email: string;
  name: string;
  imageUrl: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonConfig {
  type: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export function GoogleAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useTranslations('auth');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Failed to load Google Sign-In');
      setLoading(false);
    };

    script.onload = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin'
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Google Sign-In initialization error:', err);
        setError('Failed to initialize Google Sign-In');
        setLoading(false);
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response: GoogleCredentialResponse) => {
    try {
      const decoded = decodeJwtResponse(response.credential);
      setUser({
        email: decoded.email,
        name: decoded.name,
        imageUrl: decoded.picture
      });
      setError(null);
    } catch (err) {
      console.error('Failed to process login:', err);
      setError('登录处理失败');
    }
    setLoading(false);
  };

  const handleSignIn = () => {
    setError(null);
    window.google.accounts.id.prompt((notification: GoogleNotification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        console.error('Google Sign-In popup not displayed:', reason);
        
        switch (reason) {
          case 'unregistered_origin':
            setError('当前域名未在 Google Cloud Console 中注册');
            break;
          case 'browser_not_supported':
            setError('浏览器不支持此登录方式');
            break;
          case 'invalid_client':
            setError('客户端 ID 配置错误');
            break;
          default:
            setError('登录窗口无法显示');
        }
      }
    });
  };

  const signOut = () => {
    window.google.accounts.id.disableAutoSelect();
    setUser(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        <span className="text-gray-600">{auth('loading')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {user ? (
        <div className="flex items-center space-x-3">
          <img 
            src={user.imageUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-700">{user.name}</span>
          <button
            onClick={signOut}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {auth('signOut')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={handleSignIn}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            <img 
              src="/google-logo.svg" 
              alt="Google" 
              className="w-5 h-5"
            />
            <span className="text-gray-700">{auth('signIn')}</span>
          </button>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to decode JWT token
function decodeJwtResponse(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Add TypeScript types for Google OAuth
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          prompt: (callback: (notification: GoogleNotification) => void) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
} 