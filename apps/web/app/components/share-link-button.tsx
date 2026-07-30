'use client';

import { useState } from 'react';

type ShareLinkButtonProps = {
  title: string;
  text: string;
};

export function ShareLinkButton({ title, text }: ShareLinkButtonProps) {
  const [message, setMessage] = useState('');

  async function onShare(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const url = window.location.href;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title,
          text,
          url,
        });
        setMessage('Shared.');
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage('Link copied.');
    } catch {
      setMessage('Share canceled.');
    }
  }

  return (
    <div className="actions">
      <button type="button" onClick={() => void onShare()}>
        Share post
      </button>
      {message ? <span className="subtle">{message}</span> : null}
    </div>
  );
}
