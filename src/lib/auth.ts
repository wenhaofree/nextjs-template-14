import { useEffect, useState } from 'react';

// Google OAuth client configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

export interface GoogleUser {
  email: string;
  name: string;
  imageUrl: string;
}

// Hook for managing Google auth state
export function useGoogleAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Google OAuth
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      
      // Check if user is already signed in
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          setLoading(false);
        }
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    // Decode the JWT token
    const decoded = decodeJwtResponse(response.credential);
    setUser({
      email: decoded.email,
      name: decoded.name,
      imageUrl: decoded.picture
    });
    setLoading(false);
  };

  const signOut = () => {
    window.google.accounts.id.disableAutoSelect();
    setUser(null);
  };

  return { user, loading, signOut };
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
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
} 