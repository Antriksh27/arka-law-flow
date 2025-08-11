import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base64UrlToUuid, expandCompactUuid } from '@/lib/shortlink';

export const BookRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { code, compact } = useParams<{ code?: string; compact?: string }>();

  useEffect(() => {
    let targetUuid: string | null = null;
    try {
      if (code) {
        targetUuid = base64UrlToUuid(code);
      } else if (compact) {
        targetUuid = expandCompactUuid(compact);
      }
    } catch (e) {
      console.error('Invalid short code for booking:', e);
    }

    if (targetUuid) {
      navigate(`/book/${targetUuid}`, { replace: true });
    }
  }, [code, compact, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500">Redirecting to booking…</p>
      </div>
    </div>
  );
};
