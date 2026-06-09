import React from 'react';

interface Props {
  conId: string;
  size?: number;
  className?: string;
}

// Standard astrological glyph paths (simplified line art)
const paths: Record<string, string> = {
  // ♈ Aries — curved horns
  aries: 'M10 21 C6 16 4 12 5 8 C6 4 8 3 12 3 C16 3 18 4 19 8 C20 12 18 16 14 21',
  // ♉ Taurus — circle with horns
  taurus: 'M12 3 C7 3 4 7 4 12 C4 17 7 22 12 22 C17 22 20 17 20 12 C20 7 17 3 12 3 Z M8 3 C8 6 6 8 6 11',
  // ♊ Gemini — two pillars
  gemini: 'M7 3 L7 21 M17 3 L17 21 M7 8 L10 11 L7 14 M17 8 L14 11 L17 14',
  // ♌ Leo — circle with sweeping tail
  leo: 'M12 2 C8 2 5 5 5 9 C5 12 7 14 11 14 C8 14 5 16 5 20 C5 22 7 22 11 20 C15 22 17 22 17 20 C17 16 14 14 11 14 C15 14 17 12 17 9 C17 5 14 2 12 2 Z',
  // ♏ Scorpio — M with arrow
  scorpio: 'M12 3 L8 7 L12 11 L8 15 L12 19 L8 23 M12 3 L16 7 L12 11 L16 15 L12 19 L16 23 M12 11 L12 18',
  // ♓ Pisces — two fish tied
  pisces: 'M7 4 C5 8 5 10 7 13 M17 4 C19 8 19 10 17 13 M6 8 L18 8 M7 16 C5 20 5 22 7 24 M17 16 C19 20 19 22 17 24',
};

export const ZodiacSymbol: React.FC<Props> = ({ conId, size = 18, className = '' }) => {
  const d = paths[conId];
  if (!d) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }}
    >
      <path d={d} />
    </svg>
  );
};
