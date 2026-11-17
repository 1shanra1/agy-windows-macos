import React, { useId } from 'react';
import type { AppId, AvatarId, VFSNode } from '../core/types';

function useSafeId(prefix: string): string {
  const raw = useId();
  return `${prefix}_${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/* ============================================================================
 * 1. HalcyonMark (§7.1) — 4-petal smooth Bezier teardrops + StartPrismOrb alias
 * ========================================================================== */

export interface HalcyonMarkProps {
  size?: number;
  variant?: 'color' | 'mono';
  glowing?: boolean;
  className?: string;
}

export const HalcyonMark: React.FC<HalcyonMarkProps> = ({
  size = 24,
  variant = 'color',
  glowing = false,
  className = '',
}) => {
  const uid = useSafeId('hmark');

  // 4 smooth bezier teardrop petals arranged around (64, 64) in 128x128 master
  const pTL = 'M 60 60 C 57 34, 44 16, 18 20 C 12 44, 29 59, 60 60 Z';
  const pTR = 'M 68 60 C 71 34, 84 16, 110 20 C 116 44, 99 59, 68 60 Z';
  const pBL = 'M 60 68 C 57 94, 44 112, 18 108 C 12 84, 29 69, 60 68 Z';
  const pBR = 'M 68 68 C 71 94, 84 112, 110 108 C 116 84, 99 69, 68 68 Z';

  if (variant === 'mono') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        className={className}
        style={{ display: 'inline-block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d={`${pTL} ${pTR} ${pBL} ${pBR}`}
          fill="currentColor"
        />
        <circle cx="64" cy="64" r="9.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        filter: glowing
          ? 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))'
          : 'drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35))',
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}_tl`} x1="18%" y1="15%" x2="82%" y2="85%">
          <stop offset="0%" stopColor="#7CC8FF" />
          <stop offset="100%" stopColor="#1A6BE0" />
        </linearGradient>
        <linearGradient id={`${uid}_tr`} x1="18%" y1="15%" x2="82%" y2="85%">
          <stop offset="0%" stopColor="#8AE86B" />
          <stop offset="100%" stopColor="#218E31" />
        </linearGradient>
        <linearGradient id={`${uid}_bl`} x1="18%" y1="15%" x2="82%" y2="85%">
          <stop offset="0%" stopColor="#FF8A68" />
          <stop offset="100%" stopColor="#C83222" />
        </linearGradient>
        <linearGradient id={`${uid}_br`} x1="18%" y1="15%" x2="82%" y2="85%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#D97E12" />
        </linearGradient>
        <linearGradient id={`${uid}_spec`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}_core`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBE7FF" />
        </radialGradient>
      </defs>

      {/* Top-Left Cerulean */}
      <path d={pTL} fill={`url(#${uid}_tl)`} stroke="rgba(12, 48, 118, 0.30)" strokeWidth="1.2" />
      <path d="M 54 49 C 49 30, 38 23, 21 24 C 24 34, 37 42, 54 49 Z" fill={`url(#${uid}_spec)`} />

      {/* Top-Right Emerald */}
      <path d={pTR} fill={`url(#${uid}_tr)`} stroke="rgba(14, 72, 24, 0.30)" strokeWidth="1.2" />
      <path d="M 74 49 C 79 30, 90 23, 107 24 C 104 34, 91 42, 74 49 Z" fill={`url(#${uid}_spec)`} />

      {/* Bottom-Left Coral */}
      <path d={pBL} fill={`url(#${uid}_bl)`} stroke="rgba(110, 22, 14, 0.30)" strokeWidth="1.2" />
      <path d="M 54 74 C 42 71, 28 74, 21 86 C 28 80, 41 77, 54 74 Z" fill={`url(#${uid}_spec)`} />

      {/* Bottom-Right Amber */}
      <path d={pBR} fill={`url(#${uid}_br)`} stroke="rgba(120, 62, 6, 0.30)" strokeWidth="1.2" />
      <path d="M 74 74 C 86 71, 100 74, 107 86 C 100 80, 87 77, 74 74 Z" fill={`url(#${uid}_spec)`} />

      {/* Centre Crystal Node */}
      <circle cx="64" cy="64" r="9.5" fill={`url(#${uid}_core)`} stroke="rgba(26, 68, 128, 0.30)" strokeWidth="1.2" />
      <ellipse cx="61.5" cy="61" rx="3.4" ry="2.2" fill="#FFFFFF" opacity="0.88" />
    </svg>
  );
};

export interface StartPrismOrbProps {
  size?: number;
  glowing?: boolean;
  className?: string;
}

export const StartPrismOrb: React.FC<StartPrismOrbProps> = ({
  size = 24,
  glowing = false,
  className = '',
}) => <HalcyonMark size={size} variant="color" glowing={glowing} className={className} />;

/* ============================================================================
 * 2. AppIcon (§7.3) — Studio-Lit Free-Silhouette 3D Objects (NO squircle plate)
 * ========================================================================== */

export interface AppIconProps {
  appId: AppId;
  size?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  size = 48,
  className = '',
}) => {
  const uid = useSafeId(`obj_${appId}`);
  const lowDetail = size <= 24;

  const renderObject = () => {
    switch (appId) {
      /* ------------------------------------------------------------------
       * MY COMPUTER: 3/4 Aluminium Cinema Display + Bliss Hill + 3D Glass Globe
       * ---------------------------------------------------------------- */
      case 'navigator':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_alu`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="22%" stopColor="#C3C7CC" />
                <stop offset="48%" stopColor="#E5E7EA" />
                <stop offset="76%" stopColor="#9EA3AA" />
                <stop offset="100%" stopColor="#C8CCD1" />
              </linearGradient>
              <linearGradient id={`${uid}_foot`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E5E7EA" />
                <stop offset="45%" stopColor="#B8BDC4" />
                <stop offset="100%" stopColor="#858A92" />
              </linearGradient>
              <linearGradient id={`${uid}_sky`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1B64D8" />
                <stop offset="65%" stopColor="#58AEF7" />
                <stop offset="100%" stopColor="#C2E7FF" />
              </linearGradient>
              <linearGradient id={`${uid}_hill`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9BD65A" />
                <stop offset="55%" stopColor="#4BA334" />
                <stop offset="100%" stopColor="#266A1F" />
              </linearGradient>
              <linearGradient id={`${uid}_gl`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              <radialGradient id={`${uid}_orb`} cx="35%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#A6F2FF" />
                <stop offset="50%" stopColor="#2285E6" />
                <stop offset="100%" stopColor="#0E3E96" />
              </radialGradient>
            </defs>

            {/* Ground shadow */}
            <ellipse cx="66" cy="112" rx="46" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Aluminium stand neck & foot */}
            <path d="M 46 84 L 68 84 L 72 104 L 42 104 Z" fill={`url(#${uid}_foot)`} stroke="#6B7078" strokeWidth="1.2" />
            <path d="M 32 103 L 82 103 L 86 108 L 28 108 Z" fill={`url(#${uid}_alu)`} stroke="#6B7078" strokeWidth="1.2" />

            {/* Cinema Display 3/4 outer aluminium frame */}
            <path
              d="M 14 22 L 96 16 C 100 16 102 19 102 23 L 100 84 C 100 88 97 90 93 90 L 17 86 C 13 86 11 83 11 79 L 11 26 C 11 23 12 22 14 22 Z"
              fill={`url(#${uid}_alu)`}
              stroke="#6B7078"
              strokeWidth="1.4"
            />
            {/* 2px black glass bezel */}
            <path
              d="M 16 26 L 94 21 L 92 82 L 17 79 Z"
              fill="#1C2026"
            />
            {/* Bliss screen inside */}
            <path d="M 19 28.5 L 91 24 L 89.5 79 L 19.5 76 Z" fill={`url(#${uid}_sky)`} />
            <path
              d="M 19.5 60 C 38 48, 62 56, 90 50 L 89.5 79 L 19.5 76 Z"
              fill={`url(#${uid}_hill)`}
            />
            {/* Screen glass crescent */}
            <path d="M 19 28.5 L 91 24 L 90.4 48 C 66 52 40 48 19.2 54 Z" fill={`url(#${uid}_gl)`} />

            {/* 3D Glass Globe front-right of foot */}
            <g transform="translate(88, 86)">
              <circle cx="0" cy="0" r="22" fill={`url(#${uid}_orb)`} stroke="#103A80" strokeWidth="1.4" />
              <path
                d="M -11 -6 C -6 -12, 4 -10, 8 -4 C 11 2, 5 12, -4 11 C -10 10, -14 1, -11 -6 Z"
                fill="#4CC458"
                opacity="0.9"
              />
              <path d="M 6 -12 C 13 -10, 17 -2, 13 5 C 8 6, 4 -5, 6 -12 Z" fill="#4CC458" opacity="0.85" />
              {/* Lens crescent */}
              <ellipse cx="-3" cy="-9" rx="13" ry="7.5" fill={`url(#${uid}_gl)`} />
              <circle cx="0" cy="0" r="20.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="none" />
            </g>
          </>
        );

      /* ------------------------------------------------------------------
       * SAFARI EXPLORER: Brushed-Steel Compass w/ Degree Ticks + Golden IE Orbital Ring
       * ---------------------------------------------------------------- */
      case 'browser':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_bezel`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="20%" stopColor="#C3C7CC" />
                <stop offset="45%" stopColor="#E8EAED" />
                <stop offset="75%" stopColor="#9EA3AA" />
                <stop offset="100%" stopColor="#D6D9DE" />
              </linearGradient>
              <radialGradient id={`${uid}_dial`} cx="45%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#EEF2F7" />
                <stop offset="100%" stopColor="#CFD8E6" />
              </radialGradient>
              <radialGradient id={`${uid}_co`} cx="42%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#65B8FF" />
                <stop offset="60%" stopColor="#1D6EE0" />
                <stop offset="100%" stopColor="#0E3E98" />
              </radialGradient>
              <linearGradient id={`${uid}_ring`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF4A8" />
                <stop offset="45%" stopColor="#F6B92B" />
                <stop offset="100%" stopColor="#B86B0A" />
              </linearGradient>
              <linearGradient id={`${uid}_gl`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="114" rx="44" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Back half of Golden IE Orbital Ring */}
            <path
              d="M 14 78 C 6 58, 36 30, 74 22 C 102 16, 120 26, 114 44"
              stroke={`url(#${uid}_ring)`}
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Machined Steel Compass Body */}
            <g transform="translate(64, 62)">
              <circle cx="0" cy="0" r="44" fill={`url(#${uid}_bezel)`} stroke="#6B7078" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="37" fill={`url(#${uid}_dial)`} stroke="#9EA5B0" strokeWidth="1" />
              <circle cx="0" cy="0" r="31" fill={`url(#${uid}_co)`} stroke="#0F429C" strokeWidth="1.2" />

              {/* Degree Ticks (10° + 30° major) */}
              {!lowDetail &&
                Array.from({ length: 36 }, (_, idx) => {
                  const deg = idx * 10;
                  const major = idx % 3 === 0;
                  return (
                    <line
                      key={deg}
                      x1="0"
                      y1={major ? -36.2 : -36.2}
                      x2="0"
                      y2={major ? -31.2 : -33.2}
                      stroke="#FFFFFF"
                      strokeOpacity={major ? 0.92 : 0.65}
                      strokeWidth={major ? 1.2 : 0.65}
                      transform={`rotate(${deg})`}
                    />
                  );
                })}

              {/* Bevelled Compass Needle (pointed NE) */}
              <g transform="rotate(42)">
                <polygon points="0,-29 6.5,0 0,0" fill="#FF665E" />
                <polygon points="0,-29 -6.5,0 0,0" fill="#D12D26" />
                <polygon points="0,29 6.5,0 0,0" fill="#FFFFFF" />
                <polygon points="0,29 -6.5,0 0,0" fill="#CED6E2" />
                <circle cx="0" cy="0" r="4" fill="#F4F5F6" stroke="#6B7078" strokeWidth="1" />
              </g>

              {/* Convex glass dome crescent */}
              <ellipse cx="0" cy="-14" rx="28" ry="15" fill={`url(#${uid}_gl)`} />
            </g>

            {/* Front half of Golden IE Orbital Ring */}
            <path
              d="M 114 44 C 119 61, 90 86, 54 94 C 28 100, 17 91, 14 78"
              stroke={`url(#${uid}_ring)`}
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 111 47 C 115 61, 88 84, 54 91.5 C 31 96.5, 20 89, 17 78"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      /* ------------------------------------------------------------------
       * WORDLEAF: Tilted Rag-Paper Pad + Black-Lacquer Gold-Nib Fountain Pen
       * ---------------------------------------------------------------- */
      case 'wordleaf':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_pad`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#FBF8EE" />
                <stop offset="100%" stopColor="#EAE5D3" />
              </linearGradient>
              <linearGradient id={`${uid}_lacq`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B404A" />
                <stop offset="35%" stopColor="#6F7888" />
                <stop offset="60%" stopColor="#1B1E24" />
                <stop offset="100%" stopColor="#0D0F13" />
              </linearGradient>
              <linearGradient id={`${uid}_gold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF4AE" />
                <stop offset="45%" stopColor="#F2B830" />
                <stop offset="100%" stopColor="#9C6108" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="112" rx="44" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Stacked bottom pad sheet */}
            <polygon
              points="24,26 88,18 100,98 34,108"
              fill="#DFDAC8"
              stroke="#9C9684"
              strokeWidth="1"
            />
            {/* Main tilted rag-paper pad */}
            <path
              d="M 20 22 L 85 15 L 97 83 L 82 99 L 30 105 Z"
              fill={`url(#${uid}_pad)`}
              stroke="rgba(120, 114, 96, 0.55)"
              strokeWidth="1.2"
            />
            {/* Curled corner */}
            <path d="M 82 99 L 80 85 L 97 83 Z" fill="#DCD6C2" stroke="rgba(120,114,96,0.45)" strokeWidth="0.9" />

            {/* Margin line & faint blue rules */}
            {!lowDetail && (
              <>
                <line x1="34" y1="21" x2="43" y2="103" stroke="rgba(220, 92, 92, 0.45)" strokeWidth="1" />
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const yL = 33 + i * 10;
                  const yR = 27 + i * 10;
                  return (
                    <line
                      key={i}
                      x1={24 + i * 1.1}
                      y1={yL}
                      x2={83 + i * 1.1}
                      y2={yR}
                      stroke="rgba(72, 130, 210, 0.25)"
                      strokeWidth="1"
                    />
                  );
                })}
              </>
            )}

            {/* Black-lacquer Fountain Pen lying diagonally */}
            <g transform="translate(72, 58) rotate(-36)">
              {/* Drop shadow on pad */}
              <rect x="-5" y="-42" width="13" height="72" rx="5" fill="rgba(0,0,0,0.16)" transform="translate(3, 4)" />
              {/* Barrel */}
              <rect x="-6.5" y="-44" width="13" height="58" rx="5.5" fill={`url(#${uid}_lacq)`} stroke="#101216" strokeWidth="1" />
              {/* Specular streak */}
              <rect x="-3" y="-40" width="2.2" height="50" rx="1" fill="rgba(255,255,255,0.45)" />
              {/* Gold Band */}
              <rect x="-6.8" y="10" width="13.6" height="5.5" rx="1" fill={`url(#${uid}_gold)`} stroke="#7A4C05" strokeWidth="0.7" />
              {/* Gold Clip + Tiny Embossed Leaf */}
              <rect x="4.5" y="-36" width="2.6" height="24" rx="1.2" fill={`url(#${uid}_gold)`} />
              <path d="M -3.5 -22 C -3.5 -27, 2.5 -29, 3.5 -24 C 2.5 -19, -2.5 -19, -3.5 -22 Z" fill="#4DB848" />
              {/* Gold Nib with slit & breather hole */}
              <path d="M -5 15.5 L 5 15.5 L 0 34 Z" fill={`url(#${uid}_gold)`} stroke="#7A4C05" strokeWidth="0.9" />
              <line x1="0" y1="21" x2="0" y2="33" stroke="#3D2402" strokeWidth="1" />
              <circle cx="0" cy="21" r="1.4" fill="#3D2402" />
            </g>
          </>
        );

      /* ------------------------------------------------------------------
       * PRISM MEDIA PLAYER: 3/4 Iridescent Optical CD + Cobalt-Glass Eighth Note
       * ---------------------------------------------------------------- */
      case 'media-player': {
        const wedges: Array<[string, string, number, number]> = [
          ['#6FE8FF', '#45B8FF', 0, 30],
          ['#45B8FF', '#6F6FFF', 30, 60],
          ['#6F6FFF', '#C95EFF', 60, 90],
          ['#C95EFF', '#FF6BA8', 90, 120],
          ['#FF6BA8', '#FFAE52', 120, 150],
          ['#FFAE52', '#C5F266', 150, 180],
          ['#C5F266', '#56E5B2', 180, 210],
          ['#56E5B2', '#6FE8FF', 210, 240],
          ['#6FE8FF', '#7B7CFF', 240, 270],
          ['#7B7CFF', '#F272CF', 270, 300],
          ['#F272CF', '#FFD466', 300, 330],
          ['#FFD466', '#6FE8FF', 330, 360],
        ];
        const polar = (r: number, deg: number) => {
          const rad = (deg * Math.PI) / 180;
          return [Math.cos(rad) * r, Math.sin(rad) * r];
        };

        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_cdbase`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5F7FA" />
                <stop offset="50%" stopColor="#C9D0DA" />
                <stop offset="100%" stopColor="#E6EAF0" />
              </linearGradient>
              <linearGradient id={`${uid}_note`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94D2FF" />
                <stop offset="45%" stopColor="#2A7BE8" />
                <stop offset="100%" stopColor="#0E3B94" />
              </linearGradient>
              <linearGradient id={`${uid}_gl`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="113" rx="44" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* 3/4 Optical CD Disc */}
            <g transform="translate(56, 62) scale(1, 0.92)">
              <circle cx="0" cy="0" r="44" fill={`url(#${uid}_cdbase)`} stroke="#7A828E" strokeWidth="1.4" />
              {/* 12 iridescent conic wedges */}
              <g opacity="0.48">
                {wedges.map(([c1, , a0, a1], idx) => {
                  const [x0, y0] = polar(43, a0);
                  const [x1, y1] = polar(43, a1);
                  return (
                    <path
                      key={idx}
                      d={`M 0 0 L ${x0.toFixed(1)} ${y0.toFixed(1)} A 43 43 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`}
                      fill={c1}
                    />
                  );
                })}
              </g>
              {/* Clear acrylic centre hub */}
              <circle cx="0" cy="0" r="14" fill="rgba(240,244,250,0.65)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="7" fill="rgba(255,255,255,0.35)" stroke="#8892A0" strokeWidth="1.2" />
              <ellipse cx="0" cy="-16" rx="30" ry="15" fill={`url(#${uid}_gl)`} />
            </g>

            {/* Sculpted Cobalt-Glass Eighth Note standing front-right */}
            <g>
              <path
                d="M 80 89 L 80 34 L 109 28 L 109 42 L 88 47 L 88 89 C 88 97, 81 103, 72 103 C 64 103, 59 98, 60 91 C 61 84, 68 80, 76 82 C 78 82.5, 79 83, 80 84 Z"
                fill={`url(#${uid}_note)`}
                stroke="#0B337E"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <ellipse cx="73" cy="89" rx="7" ry="4" fill={`url(#${uid}_gl)`} transform="rotate(-15 73 89)" />
              <path d="M 82 36 L 107 30 L 107 35 L 82 41 Z" fill="rgba(255,255,255,0.45)" />
            </g>
          </>
        );
      }

      /* ------------------------------------------------------------------
       * LUNAPAINT: Birchwood Palette + 5 Glossy Paint Blobs + Glass Jar w/ 2 Brushes
       * ---------------------------------------------------------------- */
      case 'paint':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_wood`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2D9AE" />
                <stop offset="55%" stopColor="#DCB378" />
                <stop offset="100%" stopColor="#B88346" />
              </linearGradient>
              <linearGradient id={`${uid}_jar`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(220,242,255,0.82)" />
                <stop offset="50%" stopColor="rgba(182,222,252,0.52)" />
                <stop offset="100%" stopColor="rgba(145,196,240,0.78)" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="113" rx="46" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Glass jar & 2 brushes behind palette */}
            <g>
              {/* Brush 1 (Cobalt tip) */}
              <g transform="translate(86, 46) rotate(14)">
                <rect x="-3" y="-34" width="6" height="52" rx="2" fill="#C98A48" stroke="#7A4C1E" strokeWidth="0.9" />
                <rect x="-3.4" y="-34" width="6.8" height="10" fill="#D4D9E0" stroke="#6E7580" strokeWidth="0.8" />
                <path d="M -3.4 -34 Q 0 -46 3.4 -34 Z" fill="#2A7CE6" />
              </g>
              {/* Brush 2 (Crimson tip) */}
              <g transform="translate(97, 48) rotate(24)">
                <rect x="-2.8" y="-30" width="5.6" height="48" rx="2" fill="#9E5E28" stroke="#603612" strokeWidth="0.9" />
                <rect x="-3.2" y="-30" width="6.4" height="9" fill="#D4D9E0" stroke="#6E7580" strokeWidth="0.8" />
                <path d="M -3.2 -30 Q 0 -42 3.2 -30 Z" fill="#DE3C32" />
              </g>
              {/* Glass jar */}
              <path
                d="M 73 42 L 109 42 L 106 88 C 106 92 76 92 76 88 Z"
                fill={`url(#${uid}_jar)`}
                stroke="rgba(95, 140, 185, 0.7)"
                strokeWidth="1.2"
              />
              <ellipse cx="91" cy="42" rx="18" ry="4.5" fill="rgba(255,255,255,0.65)" stroke="rgba(95,140,185,0.75)" strokeWidth="1.1" />
            </g>

            {/* Birchwood Palette in 3/4 view */}
            <path
              d="M 54 44 C 78 42, 96 56, 94 76 C 92 94, 76 105, 60 100 C 52 97, 50 90, 44 92 C 37 94, 38 106, 26 104 C 13 101, 10 82, 14 67 C 19 50, 35 45, 54 44 Z"
              fill={`url(#${uid}_wood)`}
              stroke="#8A5E2C"
              strokeWidth="1.4"
            />
            {/* Wood grain */}
            {!lowDetail && (
              <g stroke="rgba(122, 74, 24, 0.14)" strokeWidth="1.2" fill="none">
                <path d="M 18 68 Q 52 55 86 64" />
                <path d="M 16 80 Q 52 68 88 76" />
                <path d="M 22 92 Q 52 82 78 88" />
              </g>
            )}
            {/* Thumb hole */}
            <ellipse cx="29" cy="87" rx="7" ry="5.5" fill="rgba(255,255,255,0.55)" stroke="#8A5E2C" strokeWidth="1.2" />

            {/* 5 Glossy Paint Blobs */}
            {[
              { cx: 30, cy: 65, c: '#E6382E' },
              { cx: 47, cy: 55, c: '#2662D9' },
              { cx: 66, cy: 55, c: '#F5C428' },
              { cx: 79, cy: 68, c: '#34AE42' },
              { cx: 68, cy: 84, c: '#FFFFFF' },
            ].map((b, idx) => (
              <g key={idx}>
                <ellipse cx={b.cx} cy={b.cy} rx="7.2" ry="5.8" fill={b.c} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
                <circle cx={b.cx - 2} cy={b.cy - 1.8} r="1.8" fill="rgba(255,255,255,0.75)" />
              </g>
            ))}
          </>
        );

      /* ------------------------------------------------------------------
       * STICKIES: Tilted Yellow Legal Pad + Burgundy Binding + Lifted Corner
       * ---------------------------------------------------------------- */
      case 'sticky-notes':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_pad`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF592" />
                <stop offset="65%" stopColor="#F7DF4A" />
                <stop offset="100%" stopColor="#DFBA24" />
              </linearGradient>
              <linearGradient id={`${uid}_burg`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9E2A3B" />
                <stop offset="100%" stopColor="#5C131E" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="112" rx="42" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Lower pad stack */}
            <polygon points="24,28 96,20 104,102 32,110" fill="#D9B624" stroke="#997D10" strokeWidth="1" />
            {/* Top tilted sheet with lifted bottom-right corner */}
            <path
              d="M 21 24 L 94 16 L 101 82 L 80 102 L 29 106 Z"
              fill={`url(#${uid}_pad)`}
              stroke="#A38818"
              strokeWidth="1.2"
            />
            {/* Burgundy top binding strip */}
            <path d="M 21 24 L 94 16 L 95.5 29 L 22.5 37 Z" fill={`url(#${uid}_burg)`} stroke="#450D16" strokeWidth="1" />
            <line x1="23" y1="25" x2="93" y2="17.5" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />

            {/* 3 handwritten grey paths */}
            {!lowDetail && (
              <g stroke="rgba(60, 52, 18, 0.55)" strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path d="M 33 50 Q 52 46 76 44" />
                <path d="M 35 64 Q 56 61 81 57" />
                <path d="M 37 78 Q 50 75 66 74" />
              </g>
            )}

            {/* Lifted curled corner */}
            <path d="M 80 102 L 79 84 L 101 82 Z" fill="#E6C532" stroke="#9E8316" strokeWidth="1" />
          </>
        );

      /* ------------------------------------------------------------------
       * CONTROL PANEL: Brushed-Metal Tray + 2 Meshed Gears + Knurled Dial
       * ---------------------------------------------------------------- */
      case 'control-panel':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_st`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="22%" stopColor="#C3C7CC" />
                <stop offset="48%" stopColor="#E5E7EA" />
                <stop offset="76%" stopColor="#9EA3AA" />
                <stop offset="100%" stopColor="#C8CCD1" />
              </linearGradient>
              <linearGradient id={`${uid}_dk`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#848B96" />
                <stop offset="100%" stopColor="#4A5059" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="112" rx="46" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Short brushed-metal tray */}
            <path
              d="M 12 84 L 116 84 L 110 104 L 18 104 Z"
              fill={`url(#${uid}_st)`}
              stroke="#6B7078"
              strokeWidth="1.3"
            />

            {/* Large 12-tooth steel gear */}
            <g transform="translate(46, 54)">
              <path
                d="M -6 -32 L 6 -32 L 8 -24 L 15 -26 L 23 -18 L 19 -11 L 28 -8 L 32 0 L 28 8 L 19 11 L 23 18 L 15 26 L 8 24 L 6 32 L -6 32 L -8 24 L -15 26 L -23 18 L -19 11 L -28 8 L -32 0 L -28 -8 L -19 -11 L -23 -18 L -15 -26 L -8 -24 Z"
                fill={`url(#${uid}_st)`}
                stroke="#6B7078"
                strokeWidth="1.4"
              />
              <circle cx="0" cy="0" r="15" fill={`url(#${uid}_dk)`} stroke="#4C525B" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="7" fill="#E5E7EA" stroke="#6B7078" strokeWidth="1" />
            </g>

            {/* Smaller interlocking gear */}
            <g transform="translate(88, 38)">
              <path
                d="M -4 -20 L 4 -20 L 6 -15 L 12 -16 L 17 -10 L 14 -5 L 20 -3 L 20 4 L 14 6 L 16 12 L 10 17 L 5 14 L 3 20 L -4 20 L -6 14 L -12 16 L -17 10 L -14 5 L -20 3 L -20 -4 L -14 -6 L -16 -12 L -10 -17 L -5 -14 Z"
                fill={`url(#${uid}_st)`}
                stroke="#6B7078"
                strokeWidth="1.3"
              />
              <circle cx="0" cy="0" r="6.5" fill="#2A75E8" stroke="#FFFFFF" strokeWidth="1.3" />
            </g>

            {/* Knurled dial knob with orange indicator */}
            <g transform="translate(90, 78)">
              <circle cx="0" cy="0" r="18" fill={`url(#${uid}_dk)`} stroke="#444A52" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="13.5" fill={`url(#${uid}_st)`} stroke="#6B7078" strokeWidth="1" />
              <line x1="0" y1="0" x2="7" y2="-8" stroke="#E8621C" strokeWidth="2.6" strokeLinecap="round" />
            </g>
          </>
        );

      /* ------------------------------------------------------------------
       * ABOUT HALCYON: Free-standing Glass Halcyon Prism
       * ---------------------------------------------------------------- */
      case 'about':
        return (
          <>
            <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.26)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <ellipse cx="64" cy="113" rx="38" ry="6.5" fill={`url(#${uid}_gsh)`} />
            <g transform="translate(10, 8) scale(0.84)">
              <HalcyonMark size={128} variant="color" glowing />
            </g>
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {renderObject()}
    </svg>
  );
};

/* ============================================================================
 * 3. FileTypeIcon (§7.3) — Wire-Mesh Recycle Bin, 3D Folders, Flat Documents
 * ========================================================================== */

export interface FileTypeIconProps {
  ext?: VFSNode['ext'];
  isFolder?: boolean;
  folderId?: string;
  isTrashEmpty?: boolean;
  size?: number;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  ext,
  isFolder = false,
  folderId,
  isTrashEmpty = true,
  size = 48,
  className = '',
}) => {
  const uid = useSafeId('ft');
  const lowDetail = size <= 24;

  // 1. Recycle Bin — Tapered cylinder of woven wire mesh over translucent blue-grey glass
  if (folderId === 'trash') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        className={className}
        style={{ display: 'inline-block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`${uid}_glass`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CFE0F2" stopOpacity="0.82" />
            <stop offset="45%" stopColor="#A6C0DC" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#6D8EB4" stopOpacity="0.80" />
          </linearGradient>
          <linearGradient id={`${uid}_rim`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F4F5F6" />
            <stop offset="35%" stopColor="#C3C7CC" />
            <stop offset="65%" stopColor="#E5E7EA" />
            <stop offset="100%" stopColor="#8F96A0" />
          </linearGradient>
          <clipPath id={`${uid}_bodyclip`}>
            <path d="M 26 30 L 38 106 C 39 112 89 112 90 106 L 102 30 Z" />
          </clipPath>
        </defs>

        <ellipse cx="66" cy="114" rx="36" ry="6.5" fill={`url(#${uid}_gsh)`} />

        {/* Back rim interior */}
        <ellipse cx="64" cy="30" rx="38" ry="10.5" fill="#7D96B2" stroke="#6B7078" strokeWidth="1.4" />

        {/* Crumpled papers when !isTrashEmpty */}
        {!isTrashEmpty && (
          <g>
            <path d="M 39 29 L 47 16 L 61 21 L 56 32 Z" fill="#FFFFFF" stroke="#8C97A6" strokeWidth="1" />
            <path d="M 59 31 L 68 15 L 82 22 L 77 32 Z" fill="#FAF8EE" stroke="#8C97A6" strokeWidth="1" />
            <path d="M 48 31 L 58 20 L 68 28 L 57 34 Z" fill="#F2F4F8" stroke="#99A4B2" strokeWidth="0.9" />
          </g>
        )}

        {/* Glass body */}
        <path
          d="M 26 30 L 38 106 C 39 112 89 112 90 106 L 102 30 Z"
          fill={`url(#${uid}_glass)`}
          stroke="#6A7F99"
          strokeWidth="1.3"
        />

        {/* Woven Wire Mesh diagonal crosshatch */}
        {!lowDetail && (
          <g clipPath={`url(#${uid}_bodyclip)`} stroke="rgba(60, 78, 102, 0.34)" strokeWidth="0.7">
            {[-40, -24, -8, 8, 24, 40, 56, 72, 88].map((x) => (
              <React.Fragment key={x}>
                <line x1={x} y1="28" x2={x + 48} y2="114" />
                <line x1={x + 48} y1="28" x2={x} y2="114" />
              </React.Fragment>
            ))}
          </g>
        )}

        {/* Brushed metal front rim & bottom rim */}
        <path
          d="M 26 30 C 26 39, 102 39, 102 30"
          stroke={`url(#${uid}_rim)`}
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M 38 105 C 38 112, 90 112, 90 105"
          stroke={`url(#${uid}_rim)`}
          strokeWidth="3.2"
          fill="none"
        />

        {/* Green XP Recycle Arrows on front */}
        <g stroke="#299A3B" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 55 58 L 64 46 L 73 58" />
          <path d="M 75 66 L 79 79 L 64 79" />
          <path d="M 50 79 L 48 67 L 56 62" />
        </g>
      </svg>
    );
  }

  // 2. Angled 3D Folders (Golden-Amber XP user folders vs Aqua Blue Glass system folders)
  if (isFolder || (folderId && !ext)) {
    const isSystem = folderId === 'system';
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        className={className}
        style={{ display: 'inline-block', flexShrink: 0 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.26)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`${uid}_back`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isSystem ? '#99D2FF' : '#FFE484'} />
            <stop offset="60%" stopColor={isSystem ? '#489DF2' : '#EFA824'} />
            <stop offset="100%" stopColor={isSystem ? '#1E64C4' : '#B8720C'} />
          </linearGradient>
          <linearGradient id={`${uid}_flap`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isSystem ? '#B8E4FF' : '#FFF1AA'} />
            <stop offset="48%" stopColor={isSystem ? '#5EB2FA' : '#F6C03C'} />
            <stop offset="100%" stopColor={isSystem ? '#277AD8' : '#CA8214'} />
          </linearGradient>
        </defs>

        <ellipse cx="66" cy="111" rx="46" ry="6.5" fill={`url(#${uid}_gsh)`} />

        {/* Back Tab */}
        <path
          d="M 14 32 C 14 27 17 24 22 24 L 48 24 C 53 24 56 32 61 32 L 106 32 C 111 32 114 35 114 40 L 110 98 C 110 102 107 105 103 105 L 22 105 C 18 105 15 102 15 98 Z"
          fill={`url(#${uid}_back)`}
          stroke={isSystem ? '#1A52A6' : '#965D0A'}
          strokeWidth="1.3"
        />

        {/* Peeking Crisp Paper Sheet */}
        <path d="M 24 38 L 104 38 L 102 58 L 22 58 Z" fill="#FFFFFF" stroke="rgba(0,0,0,0.16)" strokeWidth="0.9" />

        {/* Front Flap slightly open in 3/4 view */}
        <path
          d="M 10 50 C 10 46 13 44 17 44 L 111 44 C 115 44 118 46 117 50 L 110 100 C 109 104 106 106 102 106 L 20 106 C 16 106 13 104 13 100 Z"
          fill={`url(#${uid}_flap)`}
          stroke={isSystem ? '#1C5BB8' : '#9A600B'}
          strokeWidth="1.3"
        />
        <line x1="16" y1="46.5" x2="112" y2="46.5" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" strokeLinecap="round" />

        {/* Embossed Emblem */}
        {folderId === 'music' && (
          <g fill={isSystem ? '#FFFFFF' : '#8C5408'} opacity="0.72">
            <path d="M 60 88 L 60 61 L 78 57 L 78 83 L 73 83 L 73 64 L 64 66 L 64 88 Z" />
            <ellipse cx="57" cy="88" rx="5.5" ry="4" />
            <ellipse cx="75" cy="83" rx="5.5" ry="4" />
          </g>
        )}
        {folderId === 'pictures' && (
          <g opacity="0.75">
            <rect x="44" y="60" width="40" height="30" rx="2" fill="none" stroke="#8C5408" strokeWidth="2.4" />
            <circle cx="55" cy="70" r="3.5" fill="#8C5408" />
            <path d="M 46 88 L 58 75 L 66 82 L 73 74 L 82 88 Z" fill="#8C5408" />
          </g>
        )}
        {folderId === 'documents' && (
          <g stroke="#8C5408" strokeWidth="2.5" strokeLinecap="round" opacity="0.65">
            <line x1="48" y1="64" x2="80" y2="64" />
            <line x1="48" y1="73" x2="80" y2="73" />
            <line x1="48" y1="82" x2="68" y2="82" />
          </g>
        )}
        {folderId === 'system' && (
          <g transform="translate(64, 75)" opacity="0.8">
            <circle cx="0" cy="0" r="13" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
            <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
          </g>
        )}
      </svg>
    );
  }

  // 3. Flat-on Document Page + Dog-ear + Embossed Lower-Left Emblem (NO PILLS!)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.24)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id={`${uid}_pg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F1EC" />
        </linearGradient>
        <linearGradient id={`${uid}_dog`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C8CBD4" />
        </linearGradient>
      </defs>

      <ellipse cx="66" cy="116" rx="36" ry="5.5" fill={`url(#${uid}_gsh)`} />

      {/* Page Body */}
      <path
        d="M 26 14 L 82 14 L 104 36 L 104 112 L 26 112 Z"
        fill={`url(#${uid}_pg)`}
        stroke="rgba(0, 0, 0, 0.25)"
        strokeWidth="1.2"
      />
      {/* Dog-ear shadow & fold */}
      <path d="M 82 14 L 82 36 L 104 36 Z" fill={`url(#${uid}_dog)`} stroke="rgba(0,0,0,0.22)" strokeWidth="1" />

      {/* Content hint lines */}
      {!lowDetail && (
        <g stroke="rgba(0, 0, 0, 0.14)" strokeWidth="2.4" strokeLinecap="round">
          <line x1="38" y1="36" x2="72" y2="36" />
          <line x1="38" y1="48" x2="90" y2="48" />
          <line x1="38" y1="59" x2="88" y2="59" />
          <line x1="38" y1="70" x2="78" y2="70" />
        </g>
      )}

      {/* Lower-Left Small Embossed Emblem (never a pill/tag) */}
      {ext === 'url' ? (
        <g transform="translate(46, 90)">
          <circle cx="0" cy="0" r="13" fill="#2A84E8" stroke="#1550B8" strokeWidth="1.2" />
          <ellipse cx="0" cy="0" rx="6" ry="12" stroke="rgba(255,255,255,0.72)" strokeWidth="1.1" fill="none" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="rgba(255,255,255,0.72)" strokeWidth="1.1" />
        </g>
      ) : ext === 'png' || ext === 'svg' ? (
        <g transform="translate(34, 77)">
          <rect x="0" y="0" width="28" height="22" rx="2" fill="#E6F2FF" stroke="#4D78B8" strokeWidth="1.2" />
          <circle cx="8" cy="7" r="2.6" fill="#F2B830" />
          <path d="M 2 20 L 11 11 L 17 16 L 21 12 L 26 20 Z" fill="#3E9E44" />
        </g>
      ) : ext === 'sys' ? (
        <g transform="translate(47, 90)">
          <circle cx="0" cy="0" r="11" fill="#8E96A0" stroke="#4D545E" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
        </g>
      ) : (
        /* .md / .txt — blue "W" leaf emblem */
        <g transform="translate(35, 78)">
          <path
            d="M 2 18 C 2 8, 12 2, 22 4 C 21 15, 13 21, 2 18 Z"
            fill={ext === 'md' ? '#2B7BE8' : '#5882B8'}
            stroke="#194B9E"
            strokeWidth="1.1"
          />
          <path d="M 6 9 L 9.5 16 L 12.5 10.5 L 15.5 16 L 18.5 9" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}
    </svg>
  );
};

/* ============================================================================
 * 4. AvatarIcon (§7.3) — 6 Framed Square Portrait Scene Tiles (128 master)
 * ========================================================================== */

export interface AvatarIconProps {
  avatarId: AvatarId;
  size?: number;
  className?: string;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatarId,
  size = 56,
  className = '',
}) => {
  const uid = useSafeId(`av_${avatarId}`);

  const renderScene = () => {
    switch (avatarId) {
      case 'butterfly':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_sky`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8FD7FF" />
                <stop offset="100%" stopColor="#2B74D8" />
              </linearGradient>
              <linearGradient id={`${uid}_w`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD24C" />
                <stop offset="55%" stopColor="#F56E1E" />
                <stop offset="100%" stopColor="#A62208" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_sky)`} />
            <path d="M 10 106 Q 58 66 118 86 Q 76 122 10 106 Z" fill="#3FA945" stroke="#1E6826" strokeWidth="1.6" />
            <path d="M 64 60 C 48 24, 18 26, 26 54 C 30 68, 48 70, 64 64 Z" fill={`url(#${uid}_w)`} stroke="#1F120A" strokeWidth="2.2" />
            <path d="M 64 60 C 80 24, 110 26, 102 54 C 98 68, 80 70, 64 64 Z" fill={`url(#${uid}_w)`} stroke="#1F120A" strokeWidth="2.2" />
            <path d="M 63 64 C 42 68, 30 86, 42 94 C 52 99, 61 84, 63 64 Z" fill="#F88E26" stroke="#1F120A" strokeWidth="2" />
            <path d="M 65 64 C 86 68, 98 86, 86 94 C 76 99, 67 84, 65 64 Z" fill="#F88E26" stroke="#1F120A" strokeWidth="2" />
            <ellipse cx="64" cy="68" rx="3.5" ry="17" fill="#1F1512" />
            <circle cx="36" cy="40" r="2.8" fill="#FFF7D8" />
            <circle cx="92" cy="40" r="2.8" fill="#FFF7D8" />
          </>
        );

      case 'chess':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6D472B" />
                <stop offset="100%" stopColor="#2B1A0E" />
              </linearGradient>
              <linearGradient id={`${uid}_mb`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#DDE2EC" />
                <stop offset="100%" stopColor="#8E98AC" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_bg)`} />
            <rect x="0" y="94" width="128" height="34" fill="#3A2516" />
            <path
              d="M 40 104 L 88 104 L 84 92 C 78 83, 86 58, 81 39 C 78 26, 64 19, 55 21 L 51 14 L 44 23 C 33 32, 28 45, 30 57 L 42 59 C 48 54, 55 52, 60 55 C 54 65, 44 74, 44 92 Z"
              fill={`url(#${uid}_mb)`}
              stroke="#3E4758"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="47" cy="37" r="2.8" fill="#2E3848" />
          </>
        );

      case 'guitar':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B255E" />
                <stop offset="55%" stopColor="#7A3C58" />
                <stop offset="100%" stopColor="#C9733C" />
              </linearGradient>
              <radialGradient id={`${uid}_sb`} cx="45%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFD26A" />
                <stop offset="65%" stopColor="#D66B1E" />
                <stop offset="100%" stopColor="#6E260A" />
              </radialGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_bg)`} />
            <g transform="translate(64, 68) rotate(34)">
              <path
                d="M 0 -14 C 16 -14, 20 3, 15 14 C 25 22, 26 46, 0 46 C -26 46, -25 22, -15 14 C -20 3, -16 -14, 0 -14 Z"
                fill={`url(#${uid}_sb)`}
                stroke="#FFE3A8"
                strokeWidth="1.6"
              />
              <rect x="-4" y="-56" width="8" height="44" fill="#3B1D0E" />
              <rect x="-6.5" y="-64" width="13" height="10" rx="2" fill="#542712" />
              <circle cx="0" cy="10" r="7" fill="#2A1208" stroke="#FFE09E" strokeWidth="1.4" />
              <line x1="-2" y1="-54" x2="-2" y2="28" stroke="rgba(255,255,255,0.65)" strokeWidth="0.9" />
              <line x1="2" y1="-54" x2="2" y2="28" stroke="rgba(255,255,255,0.65)" strokeWidth="0.9" />
            </g>
          </>
        );

      case 'astronaut':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_sp`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#081230" />
                <stop offset="60%" stopColor="#173878" />
                <stop offset="100%" stopColor="#2B64C8" />
              </linearGradient>
              <linearGradient id={`${uid}_vs`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF0A8" />
                <stop offset="50%" stopColor="#F5A623" />
                <stop offset="100%" stopColor="#9E4B0C" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_sp)`} />
            <circle cx="24" cy="28" r="2" fill="#FFFFFF" />
            <circle cx="102" cy="22" r="2.5" fill="#BCE3FF" />
            <circle cx="106" cy="58" r="1.8" fill="#FFFFFF" />
            <path d="M 22 128 C 28 98, 100 98, 106 128 Z" fill="#EDF3FC" stroke="#7A92B4" strokeWidth="2" />
            <circle cx="64" cy="60" r="36" fill="#F4F8FF" stroke="#859BB8" strokeWidth="2.2" />
            <ellipse cx="64" cy="61" rx="26" ry="20" fill={`url(#${uid}_vs)`} stroke="#5F728E" strokeWidth="2" />
            <path d="M 44 52 C 52 46, 67 46, 78 51" stroke="rgba(255,255,255,0.78)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        );

      case 'blossom':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_bg`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE6F0" />
                <stop offset="100%" stopColor="#B6DCFB" />
              </linearGradient>
              <radialGradient id={`${uid}_pt`} cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="65%" stopColor="#FF9EC2" />
                <stop offset="100%" stopColor="#E6578E" />
              </radialGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_bg)`} />
            <g transform="translate(64, 64)">
              {[0, 72, 144, 216, 288].map((deg) => (
                <path
                  key={deg}
                  transform={`rotate(${deg})`}
                  d="M 0 -5 C -18 -20, -19 -44, 0 -46 C 19 -44, 18 -20, 0 -5 Z"
                  fill={`url(#${uid}_pt)`}
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                />
              ))}
              <circle cx="0" cy="0" r="10" fill="#FFD24A" stroke="#D97E1A" strokeWidth="1.8" />
            </g>
          </>
        );

      case 'prism':
        return (
          <>
            <defs>
              <linearGradient id={`${uid}_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0E265E" />
                <stop offset="55%" stopColor="#174EA6" />
                <stop offset="100%" stopColor="#2894DC" />
              </linearGradient>
              <linearGradient id={`${uid}_c1`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D6FAFF" />
                <stop offset="100%" stopColor="#42A6FF" />
              </linearGradient>
              <linearGradient id={`${uid}_c2`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A6FFD2" />
                <stop offset="100%" stopColor="#26BA68" />
              </linearGradient>
            </defs>
            <rect width="128" height="128" fill={`url(#${uid}_bg)`} />
            <polygon points="10,98 64,64 118,98 94,118 34,118" fill="rgba(128, 232, 255, 0.24)" />
            <polygon points="64,20 96,62 64,106 32,62" fill={`url(#${uid}_c1)`} stroke="#FFFFFF" strokeWidth="2" />
            <polygon points="64,20 96,62 64,64" fill="#FFFFFF" opacity="0.65" />
            <polygon points="64,64 96,62 64,106" fill={`url(#${uid}_c2)`} opacity="0.88" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {renderScene()}
    </svg>
  );
};

/* ============================================================================
 * 5. PrefIcon (§7.3) — Dedicated Control Panel Preference Icons
 * ========================================================================== */

export type PrefIconId =
  | 'pref-appearance'
  | 'pref-desktop'
  | 'pref-sound'
  | 'pref-accounts';

export interface PrefIconProps {
  id: PrefIconId;
  size?: number;
  className?: string;
}

export const PrefIcon: React.FC<PrefIconProps> = ({
  id,
  size = 32,
  className = '',
}) => {
  const uid = useSafeId(`pref_${id}`);

  const renderPref = () => {
    switch (id) {
      case 'pref-appearance':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_crown`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6AAAF7" />
                <stop offset="48%" stopColor="#2A75E8" />
                <stop offset="52%" stopColor="#1D66DB" />
                <stop offset="100%" stopColor="#1556C8" />
              </linearGradient>
              <linearGradient id={`${uid}_face`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8F7F3" />
                <stop offset="100%" stopColor="#E3E0D6" />
              </linearGradient>
              <linearGradient id={`${uid}_sw1`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7DBBFF" />
                <stop offset="100%" stopColor="#1556C8" />
              </linearGradient>
              <linearGradient id={`${uid}_sw2`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ECEEF1" />
                <stop offset="100%" stopColor="#8E96A2" />
              </linearGradient>
              <linearGradient id={`${uid}_sw3`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8AD96E" />
                <stop offset="100%" stopColor="#24721F" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="112" rx="46" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Small 3/4 Window with Luna Crown */}
            <g transform="translate(10, 14)">
              <rect
                x="0"
                y="0"
                width="88"
                height="72"
                rx="8"
                fill={`url(#${uid}_face)`}
                stroke="#6C7A92"
                strokeWidth="1.4"
              />
              <path
                d="M 0 8 C 0 3.6 3.6 0 8 0 L 80 0 C 84.4 0 88 3.6 88 8 L 88 20 L 0 20 Z"
                fill={`url(#${uid}_crown)`}
              />
              <line x1="2" y1="1.2" x2="86" y2="1.2" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
              {/* Traffic lights */}
              <circle cx="11" cy="10" r="3.4" fill="#FF5F57" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
              <circle cx="21" cy="10" r="3.4" fill="#FEBC2E" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
              <circle cx="31" cy="10" r="3.4" fill="#28C840" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
              {/* Window content hint */}
              <rect x="10" y="30" width="68" height="10" rx="2" fill="#FFFFFF" stroke="#C4C2B8" strokeWidth="1" />
              <rect x="10" y="47" width="38" height="14" rx="3" fill="#D9D7D0" stroke="#9B9990" strokeWidth="1" />
            </g>

            {/* 3 Fanned Glossy Enamel Swatches front-right */}
            <g transform="translate(86, 86) rotate(-14)">
              <rect x="-12" y="-18" width="24" height="32" rx="4" fill={`url(#${uid}_sw3)`} stroke="#1B5618" strokeWidth="1.2" />
              <line x1="-10" y1="-16.5" x2="10" y2="-16.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            </g>
            <g transform="translate(95, 89) rotate(2)">
              <rect x="-12" y="-18" width="24" height="32" rx="4" fill={`url(#${uid}_sw2)`} stroke="#636A75" strokeWidth="1.2" />
              <line x1="-10" y1="-16.5" x2="10" y2="-16.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
            </g>
            <g transform="translate(103, 92) rotate(18)">
              <rect x="-12" y="-18" width="24" height="32" rx="4" fill={`url(#${uid}_sw1)`} stroke="#12449E" strokeWidth="1.2" />
              <line x1="-10" y1="-16.5" x2="10" y2="-16.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
            </g>
          </>
        );

      case 'pref-desktop':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_wood`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E9C99A" />
                <stop offset="55%" stopColor="#C99A62" />
                <stop offset="100%" stopColor="#8C5B28" />
              </linearGradient>
              <linearGradient id={`${uid}_frm`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="45%" stopColor="#C3C7CC" />
                <stop offset="100%" stopColor="#8F959E" />
              </linearGradient>
              <linearGradient id={`${uid}_sky`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1C5FD0" />
                <stop offset="65%" stopColor="#5AAEEB" />
                <stop offset="100%" stopColor="#CFE3F5" />
              </linearGradient>
              <linearGradient id={`${uid}_hill`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9BD65A" />
                <stop offset="55%" stopColor="#4FA836" />
                <stop offset="100%" stopColor="#2E7D24" />
              </linearGradient>
              <linearGradient id={`${uid}_gl`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            <ellipse cx="64" cy="114" rx="42" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Wooden Easel Legs & Tray */}
            <path d="M 60 12 L 68 12 L 68 24 L 60 24 Z" fill={`url(#${uid}_wood)`} stroke="#6E4419" strokeWidth="1.2" />
            <path d="M 42 78 L 28 112 L 35 112 L 49 78 Z" fill={`url(#${uid}_wood)`} stroke="#6E4419" strokeWidth="1.2" />
            <path d="M 86 78 L 100 112 L 93 112 L 79 78 Z" fill={`url(#${uid}_wood)`} stroke="#6E4419" strokeWidth="1.2" />
            <path d="M 61 78 L 61 106 L 67 106 L 67 78 Z" fill="#8C5B28" stroke="#5A3512" strokeWidth="1.1" />
            <rect x="14" y="81" width="100" height="7" rx="2" fill={`url(#${uid}_wood)`} stroke="#6E4419" strokeWidth="1.2" />

            {/* Framed Landscape Photo */}
            <rect x="16" y="20" width="96" height="62" rx="4" fill={`url(#${uid}_frm)`} stroke="#666C75" strokeWidth="1.4" />
            <rect x="22" y="26" width="84" height="50" fill={`url(#${uid}_sky)`} stroke="#4C5562" strokeWidth="1" />
            <path d="M 22 57 C 44 45, 72 53, 106 49 L 106 76 L 22 76 Z" fill={`url(#${uid}_hill)`} />
            {/* Cloud wisps */}
            <ellipse cx="44" cy="39" rx="14" ry="4.5" fill="rgba(255,255,255,0.78)" />
            <ellipse cx="78" cy="35" rx="16" ry="5" fill="rgba(255,255,255,0.72)" />
            {/* Glass crescent */}
            <path d="M 22 26 L 106 26 L 106 44 C 78 49, 48 45, 22 51 Z" fill={`url(#${uid}_gl)`} />
          </>
        );

      case 'pref-sound':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_alu`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="28%" stopColor="#C3C7CC" />
                <stop offset="56%" stopColor="#E5E7EA" />
                <stop offset="84%" stopColor="#9EA3AA" />
                <stop offset="100%" stopColor="#CFD3D8" />
              </linearGradient>
              <radialGradient id={`${uid}_cone`} cx="45%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#5D646E" />
                <stop offset="58%" stopColor="#2B3038" />
                <stop offset="100%" stopColor="#14171C" />
              </radialGradient>
              <radialGradient id={`${uid}_cap`} cx="38%" cy="32%" r="65%">
                <stop offset="0%" stopColor="#F4F5F6" />
                <stop offset="55%" stopColor="#9DA3AC" />
                <stop offset="100%" stopColor="#4F555E" />
              </radialGradient>
            </defs>

            <ellipse cx="64" cy="113" rx="38" ry="6.5" fill={`url(#${uid}_gsh)`} />

            {/* Speaker Stand Foot */}
            <path d="M 38 98 L 90 98 L 94 108 L 34 108 Z" fill="#4E545E" stroke="#2D3138" strokeWidth="1.2" />

            {/* Brushed-Aluminium Speaker Cabinet (3/4 view) */}
            <path
              d="M 28 18 L 96 14 C 101 14 104 17 104 22 L 100 96 C 100 100 97 102 93 102 L 32 100 C 28 100 25 97 25 93 L 24 23 C 24 20 25 18 28 18 Z"
              fill={`url(#${uid}_alu)`}
              stroke="#6B7078"
              strokeWidth="1.4"
            />
            <line x1="28" y1="20" x2="98" y2="16" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />

            {/* Top Tweeter */}
            <circle cx="64" cy="34" r="9.5" fill="#2A2F36" stroke="#7A808A" strokeWidth="1.6" />
            <circle cx="64" cy="34" r="4.2" fill={`url(#${uid}_cap)`} />

            {/* Main Woofer Cone */}
            <circle cx="64" cy="70" r="25" fill="#464C54" stroke="#858C96" strokeWidth="2.2" />
            <circle cx="64" cy="70" r="21" fill={`url(#${uid}_cone)`} stroke="#1B1E24" strokeWidth="1" />
            <circle cx="64" cy="70" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* Metallic Dust Cap */}
            <circle cx="64" cy="70" r="8.2" fill={`url(#${uid}_cap)`} stroke="#383E47" strokeWidth="1" />
          </>
        );

      case 'pref-accounts':
        return (
          <>
            <defs>
              <radialGradient id={`${uid}_gsh`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <linearGradient id={`${uid}_bk`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ECEFF4" />
                <stop offset="55%" stopColor="#B8C0CC" />
                <stop offset="100%" stopColor="#7C8594" />
              </linearGradient>
              <linearGradient id={`${uid}_bl`} x1="15%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#94D6FF" />
                <stop offset="50%" stopColor="#2A7AE8" />
                <stop offset="100%" stopColor="#0E44A6" />
              </linearGradient>
              <linearGradient id={`${uid}_gl`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            <ellipse cx="66" cy="112" rx="44" ry="7" fill={`url(#${uid}_gsh)`} />

            {/* Back Silhouette Bust (Brushed Silver) */}
            <g transform="translate(82, 56)">
              <circle cx="0" cy="-24" r="14" fill={`url(#${uid}_bk)`} stroke="#636B78" strokeWidth="1.3" />
              <path
                d="M -26 36 C -26 8, -14 -4, 0 -4 C 14 -4, 26 8, 26 36 Z"
                fill={`url(#${uid}_bk)`}
                stroke="#636B78"
                strokeWidth="1.3"
              />
            </g>

            {/* Front Silhouette Bust (Aqua Blue Glass) */}
            <g transform="translate(50, 66)">
              <circle cx="0" cy="-26" r="17" fill={`url(#${uid}_bl)`} stroke="#103D8C" strokeWidth="1.4" />
              <ellipse cx="-2" cy="-32" rx="9" ry="5" fill={`url(#${uid}_gl)`} />
              <path
                d="M -32 42 C -32 10, -17 -3, 0 -3 C 17 -3, 32 10, 32 42 Z"
                fill={`url(#${uid}_bl)`}
                stroke="#103D8C"
                strokeWidth="1.4"
              />
              <path
                d="M -22 14 C -14 3, 14 3, 22 14"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1.4"
                fill="none"
              />
            </g>
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {renderPref()}
    </svg>
  );
};
