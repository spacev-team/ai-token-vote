/* ============================================================
   캐릭터 SVG — 로봇과 토큰
   ------------------------------------------------------------
   두 함수를 제공합니다.
     robotSVG({ hue, full, className })  → 로봇 마크업 문자열
     tokenSVG({ className })             → 토큰(젤리 코인) 마크업 문자열

   로봇 표정은 SVG 루트 클래스로 바꿉니다. 애니메이션은 style.css 담당.
     (기본)     : 가만히 눈 깜빡임
     .is-open   : 입을 크게 벌림
     .is-chomp  : 냠 (입을 닫음)
     .is-happy  : 눈이 ^^ 로 바뀌고 볼이 발그레, 반짝임
     .is-full   : 배부른 표정 (만족한 미소)
   ============================================================ */

const Characters = (() => {
  let uid = 0;

  function robotSVG({ hue = 258, full = false, className = '' } = {}) {
    const n = ++uid;
    const gBody = `rb-body-${n}`;
    const gLimb = `rb-limb-${n}`;
    const gBulb = `rb-bulb-${n}`;

    const light = `hsl(${hue} 78% 76%)`;
    const mid = `hsl(${hue} 62% 63%)`;
    const deep = `hsl(${hue} 52% 52%)`;
    const glow = `hsl(${hue} 96% 86%)`;
    const bulb = `hsl(${hue} 100% 72%)`;

    const viewBox = full ? '0 0 120 138' : '2 0 116 108';

    return `
<svg class="robot ${className}" viewBox="${viewBox}" role="img" aria-label="AI 로봇 캐릭터"
     style="--glow:${glow}; --bulb:${bulb}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gBody}" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="${gLimb}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mid}"/>
      <stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <radialGradient id="${gBulb}">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.55" stop-color="${bulb}"/>
      <stop offset="1" stop-color="${deep}"/>
    </radialGradient>
  </defs>

  <g class="rb-bob">
    ${full ? `
    <!-- 몸통 · 팔 (머리보다 먼저 그려서 뒤에 깔립니다) -->
    <rect class="rb-arm rb-arm-l" x="18" y="102" width="13" height="24" rx="6.5" fill="url(#${gLimb})"/>
    <rect class="rb-arm rb-arm-r" x="89" y="102" width="13" height="24" rx="6.5" fill="url(#${gLimb})"/>
    <rect x="52" y="92" width="16" height="10" rx="5" fill="${deep}"/>
    <rect x="31" y="97" width="58" height="32" rx="16" fill="url(#${gBody})"/>
    <circle class="rb-chest" cx="60" cy="113" r="6.5" fill="${glow}"/>
    ` : ''}

    <!-- 안테나 -->
    <rect x="58.4" y="13" width="3.2" height="13" rx="1.6" fill="${deep}"/>
    <circle class="rb-bulb" cx="60" cy="9.5" r="6.5" fill="url(#${gBulb})"/>

    <!-- 귀 -->
    <rect x="7"   y="50" width="9.5" height="23" rx="4.75" fill="url(#${gLimb})"/>
    <rect x="103" y="50" width="9.5" height="23" rx="4.75" fill="url(#${gLimb})"/>

    <!-- 머리 -->
    <rect x="16" y="24" width="88" height="76" rx="27" fill="url(#${gBody})"/>

    <!-- 볼 (기뻐할 때만) -->
    <g class="rb-cheeks">
      <ellipse cx="22.5" cy="76" rx="4.6" ry="3.4" fill="#FF8FA3"/>
      <ellipse cx="97.5" cy="76" rx="4.6" ry="3.4" fill="#FF8FA3"/>
    </g>

    <!-- 얼굴 스크린 -->
    <rect x="27" y="38" width="66" height="48" rx="22" fill="#231E36"/>
    <rect x="27" y="38" width="66" height="48" rx="22" fill="url(#${gBody})" opacity="0.08"/>

    <!-- 눈: 평소 -->
    <g class="rb-eyes-idle">
      <rect x="43.5" y="52" width="11" height="14" rx="5.5" fill="${glow}"/>
      <rect x="65.5" y="52" width="11" height="14" rx="5.5" fill="${glow}"/>
    </g>

    <!-- 눈: 기쁨 (^ ^) -->
    <g class="rb-eyes-happy">
      <path d="M42.5 62 q6.5 -10 13 0" stroke="${glow}" stroke-width="4.2" stroke-linecap="round" fill="none"/>
      <path d="M64.5 62 q6.5 -10 13 0" stroke="${glow}" stroke-width="4.2" stroke-linecap="round" fill="none"/>
    </g>

    <!-- 입: 평소 -->
    <rect class="rb-mouth-idle" x="53" y="73" width="14" height="4.2" rx="2.1" fill="${glow}" opacity="0.85"/>
    <!-- 입: 벌림 (어두운 얼굴 화면 위에서도 보이게 밝은 색) -->
    <ellipse class="rb-mouth-open" cx="60" cy="75" rx="11" ry="9.5" fill="${glow}"/>
    <ellipse class="rb-mouth-open-inner" cx="60" cy="77" rx="7" ry="5.5" fill="#FF7B92"/>
    <!-- 입: 미소 -->
    <path class="rb-mouth-smile" d="M51 71 q9 10 18 0" stroke="${glow}" stroke-width="4"
          stroke-linecap="round" fill="none"/>

    <!-- 반짝임 -->
    <g class="rb-sparks">
      <path class="rb-spark rb-spark-1" d="M31 34 l1.9 4.6 4.6 1.9 -4.6 1.9 -1.9 4.6 -1.9 -4.6 -4.6 -1.9 4.6 -1.9z" fill="#FFD98A"/>
      <path class="rb-spark rb-spark-2" d="M92 44 l1.5 3.6 3.6 1.5 -3.6 1.5 -1.5 3.6 -1.5 -3.6 -3.6 -1.5 3.6 -1.5z" fill="#FFF0B8"/>
      <path class="rb-spark rb-spark-3" d="M86 27 l1.2 2.9 2.9 1.2 -2.9 1.2 -1.2 2.9 -1.2 -2.9 -2.9 -1.2 2.9 -1.2z" fill="#FFD98A"/>
    </g>
  </g>
</svg>`;
  }

  /* 왕관은 따로 떨어뜨려야 해서 별도 SVG 로 둡니다. */
  function crownSVG({ className = '' } = {}) {
    return `
<svg class="crown ${className}" viewBox="0 0 120 74" role="img" aria-label="왕관" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="crown-g" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#FFE9A3"/>
      <stop offset="0.5" stop-color="#FFC94D"/>
      <stop offset="1" stop-color="#F0A020"/>
    </linearGradient>
  </defs>
  <path d="M14 62 L8 20 l28 18 L60 6 l24 32 28 -18 -6 42 z" fill="url(#crown-g)"
        stroke="#E08E12" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="12" y="58" width="96" height="12" rx="6" fill="url(#crown-g)" stroke="#E08E12" stroke-width="2.5"/>
  <circle cx="60" cy="30" r="5" fill="#FF8FA3"/>
  <circle cx="8"  cy="18" r="4.5" fill="#FFF3C9"/>
  <circle cx="112" cy="18" r="4.5" fill="#FFF3C9"/>
</svg>`;
  }

  /* 토큰 = 반짝반짝 빛나는 밥 한 공기 */
  function tokenSVG({ className = '' } = {}) {
    const n = ++uid;
    return `
<svg class="token ${className}" viewBox="0 0 72 72" role="img" aria-label="반짝이는 밥 토큰" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tk-rice-${n}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F1EBDD"/>
    </linearGradient>
    <linearGradient id="tk-bowl-${n}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#FFC94D"/>
      <stop offset="1" stop-color="#F09A2A"/>
    </linearGradient>
  </defs>
  <g class="tk-squish">
  <g transform="translate(36 36) scale(1.24) translate(-36 -36)">
    <!-- 밥: 뭉게뭉게 쌓인 흰 밥 -->
    <path d="M13 40 Q11 27 22 24 Q23 15 33 15 Q36 10 42 12 Q50 12 52 20 Q61 24 59 40 Z"
          fill="url(#tk-rice-${n})" stroke="#E5DCC8" stroke-width="1.4"/>
    <!-- 밥알 느낌 -->
    <ellipse cx="27" cy="26" rx="3" ry="1.8" fill="#fff"/>
    <ellipse cx="40" cy="21" rx="3" ry="1.8" fill="#fff" transform="rotate(18 40 21)"/>
    <ellipse cx="46" cy="30" rx="2.6" ry="1.6" fill="#fff" transform="rotate(-14 46 30)"/>
    <ellipse cx="33" cy="33" rx="2.6" ry="1.6" fill="#EFE8D7" transform="rotate(10 33 33)"/>
    <!-- 그릇 -->
    <path d="M11 40 H61 Q61 55 47 59 H25 Q11 55 11 40 Z" fill="url(#tk-bowl-${n})"/>
    <path d="M11 40 H61 Q60.6 44 59 46.5 L13 46.5 Q11.4 44 11 40 Z" fill="#fff" opacity="0.22"/>
    <!-- 그릇의 작은 별 -->
    <path d="M36 47.5 l1.7 3.4 3.4 1.7 -3.4 1.7 -1.7 3.4 -1.7 -3.4 -3.4 -1.7 3.4 -1.7 z" fill="#C97C12"/>
    <!-- 반짝임 -->
    <path class="tk-sparkle tk-sparkle-1" d="M14 14 l1.7 4 4 1.7 -4 1.7 -1.7 4 -1.7 -4 -4 -1.7 4 -1.7 z" fill="#FFD98A"/>
    <path class="tk-sparkle tk-sparkle-2" d="M58 8 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z" fill="#FFE9B3"/>
    <path class="tk-sparkle tk-sparkle-3" d="M63 30 l1.1 2.7 2.7 1.1 -2.7 1.1 -1.1 2.7 -1.1 -2.7 -2.7 -1.1 2.7 -1.1 z" fill="#FFD98A"/>
  </g>
  </g>
</svg>`;
  }

  return { robotSVG, crownSVG, tokenSVG };
})();
