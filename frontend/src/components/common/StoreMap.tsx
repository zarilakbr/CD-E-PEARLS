import React from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import { STORE_CONTACT } from '../../lib/seo';

export interface StoreMapProps {
  mapsUrl?: string;
  mapsEmbedQuery?: string;
  className?: string;
}

export const StoreMap: React.FC<StoreMapProps> = ({
  mapsUrl = STORE_CONTACT.mapsUrl,
  mapsEmbedQuery = STORE_CONTACT.mapsEmbedQuery,
  className = '',
}) => {
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapsEmbedQuery)}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsEmbedQuery)}`;

  return (
    <div className={`w-full max-w-full space-y-3 ${className}`} data-testid="store-map-container">
      <div className="w-full max-w-full overflow-hidden rounded-2xl border border-[var(--border)]">
        <iframe
          src={embedSrc}
          loading="lazy"
          title="Lokasi CD'E Pearls Lombok"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[280px] md:h-[380px] border-0 block"
          allowFullScreen
          data-testid="store-map-iframe"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] hover:bg-[var(--surface)] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
          data-testid="store-map-open-link"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-[#BD8F4B]" />
          <span>Buka di Google Maps</span>
        </a>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)] hover:bg-[var(--surface)] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
          data-testid="store-map-directions-link"
        >
          <Navigation className="w-4 h-4 shrink-0 text-[#BD8F4B]" />
          <span>Petunjuk Arah</span>
        </a>
      </div>
    </div>
  );
};

export default StoreMap;
