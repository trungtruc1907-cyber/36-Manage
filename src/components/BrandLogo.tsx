import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  className?: string;
  showText?: boolean;
  customLogoUrl?: string | null;
  brandName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'icon',
  className = '',
  showText = false,
  customLogoUrl = null,
  brandName = 'TRUONG SON COMPANY',
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-[9px]', full: 'w-16' },
    sm: { icon: 'w-8 h-8', text: 'text-[10px]', full: 'w-20' },
    md: { icon: 'w-10 h-10', text: 'text-xs', full: 'w-28' },
    lg: { icon: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-sm', full: 'w-36' },
    xl: { icon: 'w-32 h-32 sm:w-36 sm:h-36', text: 'text-base', full: 'w-44' },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Globe Badge or Custom Uploaded Logo */}
      <div
        className={`relative rounded-full bg-white flex items-center justify-center shadow-md border border-slate-100 overflow-hidden ${selectedSize.icon} transition-transform`}
      >
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt={brandName || 'Logo Doanh nghiệp'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full p-0.5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="ts-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.9" />
              </filter>
              <filter id="ts-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* White background circle */}
            <circle cx="100" cy="95" r="78" fill="#ffffff" />

            {/* Globe Outer Rim */}
            <circle
              cx="100"
              cy="95"
              r="75"
              stroke="#006ebc"
              strokeWidth="3.5"
              fill="none"
            />

            {/* Globe Latitude / Equator */}
            <line
              x1="25"
              y1="95"
              x2="175"
              y2="95"
              stroke="#006ebc"
              strokeWidth="3.5"
            />

            {/* Upper Latitude */}
            <path
              d="M 33 65 C 65 79, 135 79, 167 65"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Lower Latitude */}
            <path
              d="M 33 125 C 65 111, 135 111, 167 125"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Globe Longitude lines */}
            <line
              x1="100"
              y1="20"
              x2="100"
              y2="170"
              stroke="#006ebc"
              strokeWidth="3.5"
            />

            {/* Inner Left Meridian */}
            <path
              d="M 100 20 C 65 20, 65 170, 100 170"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Inner Right Meridian */}
            <path
              d="M 100 20 C 135 20, 135 170, 100 170"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Outer Left Meridian */}
            <path
              d="M 100 20 C 35 20, 35 170, 100 170"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Outer Right Meridian */}
            <path
              d="M 100 20 C 165 20, 165 170, 100 170"
              stroke="#006ebc"
              strokeWidth="3"
              fill="none"
            />

            {/* Map of Vietnam Silhouette (Blue) */}
            <g fill="#0277bd" opacity="0.95">
              <path d="M 85 32 C 92 24, 108 24, 114 30 C 118 36, 112 44, 107 48 C 103 52, 98 56, 95 62 C 92 68, 93 72, 95 78 C 96 82, 93 84, 88 80 C 85 75, 87 68, 88 62 C 86 55, 80 48, 78 40 C 77 34, 80 34, 85 32 Z" />
              <path d="M 95 78 C 99 85, 104 92, 107 100 C 110 108, 112 116, 110 124 C 108 130, 102 136, 98 142 C 94 148, 93 154, 91 160 C 88 163, 85 160, 87 154 C 89 146, 94 138, 98 130 C 102 122, 103 114, 101 106 C 99 98, 94 90, 92 84 C 91 80, 94 77, 95 78 Z" />
              <path d="M 98 142 C 105 142, 112 146, 114 152 C 115 158, 108 164, 101 166 C 94 168, 88 166, 85 160 C 83 154, 88 148, 93 145 C 96 143, 98 142, 98 142 Z" />
              <circle cx="126" cy="96" r="2.5" />
              <circle cx="122" cy="128" r="2" />
              <circle cx="128" cy="135" r="2.2" />
              <circle cx="78" cy="158" r="2" />
            </g>

            {/* Red Star at Hanoi location */}
            <polygon
              points="98,38 100,43 105,43 101,46 102,51 98,48 94,51 95,46 91,43 96,43"
              fill="#e52421"
            />

            {/* TS Monogram in Bright Red with White Stroke for contrast */}
            <g filter="url(#ts-shadow)">
              <text
                x="68"
                y="114"
                fontFamily="'Times New Roman', Georgia, serif"
                fontSize="68"
                fontWeight="900"
                fill="#e31e24"
                stroke="#ffffff"
                strokeWidth="4"
                paintOrder="stroke fill"
                textAnchor="middle"
              >
                T
              </text>
              <text
                x="126"
                y="118"
                fontFamily="'Times New Roman', Georgia, serif"
                fontSize="68"
                fontWeight="900"
                fill="#e31e24"
                stroke="#ffffff"
                strokeWidth="4"
                paintOrder="stroke fill"
                textAnchor="middle"
              >
                S
              </text>
            </g>
          </svg>
        )}
      </div>

      {/* Optional Brand Name Text Below */}
      {(showText || variant === 'full') && (
        <span
          className={`font-black text-[#0060aa] uppercase tracking-wider text-center mt-1.5 font-['Plus_Jakarta_Sans',sans-serif] ${selectedSize.text}`}
          style={{
            letterSpacing: '0.04em',
            textShadow: '0 0.5px 1px rgba(0,0,0,0.1)',
          }}
        >
          {brandName}
        </span>
      )}
    </div>
  );
};
