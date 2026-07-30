import { ImageResponse } from 'next/og';

import { config } from '../lib/site';

export const alt = `${config.site.name} - ${config.site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0E7C66, #0A4D40)',
          color: '#ffffff',
          padding: '56px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>{config.site.name}</div>
        <div style={{ fontSize: 42, marginTop: 20 }}>{config.site.tagline}</div>
        <div style={{ fontSize: 28, marginTop: 28, opacity: 0.88 }}>
          Inflation-adjusted salary reality check
        </div>
      </div>
    ),
    size,
  );
}
