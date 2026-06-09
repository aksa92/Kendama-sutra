import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
interface KendamaModelProps {
  woodColor: string;
  paintColor: string;
  stringColor: string;
  paintType: string;
  highlightCategory: string | null;
  engraving?: string;
}

export const KendamaModel: React.FC<KendamaModelProps> = ({
  woodColor,
  paintColor,
  stringColor,
  paintType,
  highlightCategory,
  engraving,
}) => {
  // Determine ball positioning based on which skill section is highlighted
  let ballX = 220;
  let ballY = 190;
  let stringPath = "M 150 145 Q 190 220, 220 190";

  if (highlightCategory === 'cup') {
    // Resting inside Big Cup (left side cup, center is approx 100, 130)
    ballX = 100;
    ballY = 100;
    stringPath = "M 150 145 Q 110 180, 100 115";
  } else if (highlightCategory === 'spike') {
    // Speared directly on the top spike (spike top is at 150, 60)
    ballX = 150;
    ballY = 52;
    stringPath = "M 150 145 C 130 110, 130 80, 150 67";
  } else if (highlightCategory === 'balance') {
    // Airplane or Lighthouse balancing (perched upside down on top of spike tip / handle)
    ballX = 150;
    ballY = 175; // Balanced on Base Cup or Spike corner
    stringPath = "M 150 145 C 130 160, 140 180, 150 175";
  }

  // Paint surface finishes overlays
  const renderPaintOverlay = () => {
    if (paintType === 'sticky') {
      // High glass mirror glare
      return (
        <>
          <circle cx={ballX} cy={ballY} r="20" fill="url(#glossyShield)" opacity="0.35" />
          <ellipse cx={ballX - 6} cy={ballY - 6} rx="4" ry="2" transform={`rotate(-30 ${ballX - 6} ${ballY - 6})`} fill="#FFFFFF" opacity="0.75" />
        </>
      );
    } else if (paintType === 'rubber') {
      // Soft satin matte halo
      return (
        <>
          <circle cx={ballX} cy={ballY} r="20" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle cx={ballX} cy={ballY} r="20" fill="url(#silkRadial)" opacity="0.45" />
        </>
      );
    } else {
      // Natural naked wood ring
      return (
        <circle cx={ballX} cy={ballY} r="15" stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none" />
      );
    }
  };

  return (
    <div className="relative w-full aspect-square flex items-center justify-center bg-zinc-950/40 rounded-3xl border border-white/5 backdrop-blur-xl p-4 overflow-hidden shadow-2xl">
      {/* Dynamic Cosmic Back-Star Rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
        <div className="absolute w-[80%] aspect-square rounded-full border border-dashed border-white/10 animate-slow-spin" />
        <div className="absolute w-[50%] aspect-square rounded-full border border-dotted border-white/10 animate-reverse-slow-spin" />
      </div>

      <svg
        viewBox="0 0 300 300"
        className="w-full h-full max-w-[280px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle wood natural texture representation */}
          <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={woodColor} />
            <stop offset="60%" stopColor={woodColor} />
            <stop offset="100%" stopColor={adjustHexColor(woodColor, -25)} />
          </linearGradient>

          <linearGradient id="shadingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </linearGradient>

          {/* Paint finishes */}
          <radialGradient id="paintGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={paintColor} />
            <stop offset="60%" stopColor={adjustHexColor(paintColor, -15)} />
            <stop offset="100%" stopColor={adjustHexColor(paintColor, -40)} />
          </radialGradient>

          <linearGradient id="glossyShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
          </linearGradient>

          <radialGradient id="silkRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </radialGradient>

          {/* Grain texture pattern */}
          <pattern id="grainPatch" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,10 Q20,8 40,10 M0,20 Q20,23 40,20 M0,30 Q20,28 40,30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* 1. KENDAMA STRING */}
        <motion.path
          d={stringPath}
          fill="none"
          stroke={stringColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4,2"
          animate={{ d: stringPath }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          className="opacity-70"
        />

        {/* 2. THE KEN BODY (SWORD) */}
        <g id="ken-body">
          {/* Spike Element */}
          <rect
            x="146"
            y="55"
            width="8"
            height="40"
            rx="2"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />
          {/* Spike Tip Glow if Category is Spike */}
          {highlightCategory === 'spike' && (
            <circle
              cx="150"
              cy="55"
              r="8"
              fill="#FFFFFF"
              className="opacity-25 blur-md"
            />
          )}

          {/* Main Handle shaft */}
          <path
            d="M 143 140 L 157 140 L 155 240 L 145 240 Z"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />

          {/* Shading Over Handle */}
          <path
            d="M 143 140 L 157 140 L 155 240 L 145 240 Z"
            fill="url(#shadingGrad)"
            className="mix-blend-multiply opacity-50"
          />

          {/* Grain pattern layer */}
          <path
            d="M 143 140 L 157 140 L 155 240 L 145 240 Z"
            fill="url(#grainPatch)"
          />

          {/* Ring Grip / Sub Cups Ridge */}
          <rect
            x="140"
            y="200"
            width="20"
            height="6"
            rx="1"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
          
          {/* Base Cup (Chuzara) at the bottom */}
          <path
            d="M 138 240 L 162 240 L 165 248 C 165 251, 135 251, 135 248 Z"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />
          
          {/* String Hole core */}
          <circle cx="150" cy="144" r="2" fill="#121212" />
        </g>

        {/* 3. THE SARADO (CROSSPIECE with Big and Small Cups) */}
        <g id="sarado">
          {/* Outer crossbar background */}
          <rect
            x="100"
            y="118"
            width="100"
            height="26"
            rx="4"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />
          <rect
            x="100"
            y="118"
            width="100"
            height="26"
            rx="4"
            fill="url(#shadingGrad)"
            className="mix-blend-multiply opacity-40"
          />
          <rect
            x="100"
            y="118"
            width="100"
            height="26"
            rx="4"
            fill="url(#grainPatch)"
          />

          {/* LEFT: BIG CUP (大皿) */}
          <path
            d="M 100 114 L 100 148 L 94 144 C 92 140, 92 122, 94 118 Z"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          <path
            d="M 94 118 C 92 122, 92 140, 94 144 Z"
            fill="none"
            stroke={highlightCategory === 'cup' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
            strokeWidth={highlightCategory === 'cup' ? '2.5' : '1'}
            className={highlightCategory === 'cup' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}
          />

          {/* RIGHT: SMALL CUP (小皿) */}
          <path
            d="M 200 116 L 200 146 L 205 142 C 207 138, 207 124, 205 120 Z"
            fill="url(#woodGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
          <path
            d="M 205 120 C 207 124, 207 138, 205 142 Z"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />

          {/* Engraving detail if supplied */}
          {engraving && (
            <text
              x="150"
              y="134"
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.4)"
              fontSize="4"
              fontFamily="var(--font-mono)"
              letterSpacing="0.1em"
            >
              {engraving.slice(0, 10).toUpperCase()}
            </text>
          )}

          {/* Category Highlight Auras */}
          {highlightCategory === 'cup' && (
            <circle cx="100" cy="130" r="16" fill="#FFFFFF" className="opacity-15 blur-md" />
          )}
        </g>

        {/* 4. TAMA (THE BALL) WITH MOTION SMOOTH TRANSITION */}
        <g id="tama-ball">
          {/* Glow backdrop behind matching color */}
          <motion.circle
            cx={ballX}
            cy={ballY}
            r="28"
            fill={paintColor}
            className="opacity-15 blur-xl pointer-events-none"
            animate={{ cx: ballX, cy: ballY }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />

          {/* Inner Natural Wood Core of Tama displayed under the hole */}
          <motion.circle
            cx={ballX}
            cy={ballY}
            r="19"
            fill={woodColor === '#64325c' ? 'url(#paintGrad)' : 'url(#woodGrad)'}
            animate={{ cx: ballX, cy: ballY }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />

          {/* Ball sphere */}
          <motion.circle
            cx={ballX}
            cy={ballY}
            r="20"
            fill="url(#paintGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
            animate={{ cx: ballX, cy: ballY }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />

          {/* Subtle woodgrain inside ball if RAW wood */}
          {paintType === 'raw' && (
            <motion.circle
              cx={ballX}
              cy={ballY}
              r="20"
              fill="url(#grainPatch)"
              opacity="0.6"
              animate={{ cx: ballX, cy: ballY }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />
          )}

          {/* Texture Overlay */}
          <motion.g
            animate={{ x: ballX - 220, y: ballY - 190 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          >
            {renderPaintOverlay()}
          </motion.g>

          {/* Cosmic Star Tracker Node inside Ball */}
          <motion.circle
            cx={ballX}
            cy={ballY}
            r="2"
            fill="#FFFFFF"
            className="animate-pulse"
            animate={{ cx: ballX, cy: ballY }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </g>
      </svg>

      {/* Floating Category Tag Overlay */}
      <AnimatePresence mode="wait">
        {highlightCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-slate-300 uppercase whitespace-nowrap"
          >
            Focus Zone: <span className="text-white font-bold">{highlightCategory}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper: darkening or lightening hex color safely
function adjustHexColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
