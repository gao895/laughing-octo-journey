/**
 * Sample exhibition 「星空の記憶」 used for demos and development.
 * Artworks are generated SVGs so no binary image files are needed.
 */

export interface SampleArtwork {
  title: string;
  description: string;
  width: number;
  height: number;
  svg: string;
}

export const SAMPLE_GALLERY = {
  title: '星空の記憶',
  description: '夜空に浮かぶ星々をテーマにした、小さな個展です。ゆっくり歩いてお楽しみください。',
  authorName: 'moco',
  slug: 'hoshizora-no-kioku',
};

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function stars(seed: number, w: number, h: number, count: number, maxY = h): string {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (r() * w).toFixed(1);
    const y = (r() * maxY).toFixed(1);
    const size = (r() * 1.8 + 0.4).toFixed(2);
    const op = (r() * 0.6 + 0.4).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${size}" fill="#fff" opacity="${op}"/>`;
  }
  return out;
}

function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

export const SAMPLE_ARTWORKS: SampleArtwork[] = [
  {
    title: '星降る丘',
    description: '街の灯りが届かない丘の上。数えきれない星が、静かに降りそそいでいました。',
    width: 1200,
    height: 800,
    svg: svg(
      1200,
      800,
      `<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1033"/><stop offset=".7" stop-color="#2b3a7a"/><stop offset="1" stop-color="#5b4a8a"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#a)"/>${stars(1, 1200, 800, 260, 620)}
      <path d="M0 650 Q300 520 620 610 T1200 580 V800 H0Z" fill="#0a0c1c"/>
      <path d="M0 700 Q400 640 800 690 T1200 680 V800 H0Z" fill="#05060f"/>`,
    ),
  },
  {
    title: '月の舟',
    description: '三日月を舟に見立てて。夜の海をゆっくりと渡っていく、夢の中の風景です。',
    width: 800,
    height: 1000,
    svg: svg(
      800,
      1000,
      `<defs><radialGradient id="b" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#27306b"/><stop offset="1" stop-color="#070918"/></radialGradient></defs>
      <rect width="800" height="1000" fill="url(#b)"/>${stars(2, 800, 1000, 180, 700)}
      <circle cx="420" cy="360" r="170" fill="#f6e7b0"/><circle cx="480" cy="320" r="160" fill="#10153a"/>
      <rect y="720" width="800" height="280" fill="#0d1440"/>
      <path d="M0 760 Q200 740 400 760 T800 760" stroke="#f6e7b0" stroke-opacity=".35" stroke-width="3" fill="none"/>
      <path d="M0 820 Q200 800 400 820 T800 820" stroke="#f6e7b0" stroke-opacity=".2" stroke-width="3" fill="none"/>`,
    ),
  },
  {
    title: '夜明け前',
    description: '星が消えていく直前の、ほんの数分間だけの色。空がいちばん美しい時間。',
    width: 1200,
    height: 900,
    svg: svg(
      1200,
      900,
      `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101845"/><stop offset=".45" stop-color="#5a4c8f"/><stop offset=".75" stop-color="#e59a8c"/><stop offset="1" stop-color="#f6d19a"/></linearGradient></defs>
      <rect width="1200" height="900" fill="url(#c)"/>${stars(3, 1200, 900, 90, 300)}
      <path d="M0 760 L180 640 L320 720 L520 560 L720 700 L900 600 L1200 740 V900 H0Z" fill="#241a3a"/>`,
    ),
  },
  {
    title: '天の川',
    description: '夏の夜、空を横切る光の川。星のひとつひとつに物語がある気がします。',
    width: 1000,
    height: 1000,
    svg: svg(
      1000,
      1000,
      `<defs><linearGradient id="d" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1a1f4d" stop-opacity="0"/><stop offset=".5" stop-color="#b9a6ff" stop-opacity=".55"/><stop offset="1" stop-color="#1a1f4d" stop-opacity="0"/></linearGradient></defs>
      <rect width="1000" height="1000" fill="#070a1f"/>
      <rect x="-300" y="380" width="1600" height="240" fill="url(#d)" transform="rotate(-35 500 500)"/>
      ${stars(4, 1000, 1000, 420)}`,
    ),
  },
  {
    title: '流れ星の約束',
    description: '「また一緒に見よう」と約束した夜。流れ星はあっという間に消えてしまいました。',
    width: 1200,
    height: 800,
    svg: svg(
      1200,
      800,
      `<defs><linearGradient id="e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050716"/><stop offset="1" stop-color="#1c2c63"/></linearGradient>
      <linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#e)"/>${stars(5, 1200, 800, 220)}
      <line x1="300" y1="140" x2="760" y2="330" stroke="url(#f)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="760" cy="330" r="7" fill="#fff"/>
      <path d="M0 700 Q600 640 1200 700 V800 H0Z" fill="#03040c"/>`,
    ),
  },
];

export function svgToDataUrl(svgText: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}
