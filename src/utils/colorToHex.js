// Normalize + translate French color names to hex (or CSS keyword)
// Supports modifiers: "clair", "foncé", "très", "pâle", "vif"
// Handles NBSPs and accents.

export function frenchColorToHex(input) {
  if (!input) return null;

  const name = normalize(input);

  // Special multi-word colors first
  const specials = {
    "bleu marine": "#003366",
    "bleu roi": "#002FA7",
    "bleu ciel": "#87CEEB",
    "bleu turquoise": "#40E0D0",
    "vert menthe": "#98FF98",
    "vert sapin": "#0B5D1E",
    "vert olive": "#808000",
    "rouge bordeaux": "#7B1E22",
    "rouge carmin": "#960018",
    "rouge corail": "#FF7F50", // coral
    "rose fuchsia": "#FF00FF",
    "gris ardoise": "#708090",
    "gris anthracite": "#303030",
    "brun chocolat": "#3D1F00",
    "jaune moutarde": "#FFDB58",
    "orange brûlé": "#CC5500",
    "bleu indigo": "#4B0082",
    "bleu pervenche": "#CCCCFF",
    "violet lavande": "#E6E6FA",
    "violet lila": "#C8A2C8",
    "kaki": "#8B864E",
    "sarcelle": "#008080", // teal
  };

  // Base colors (single word) + common metals/materials
  const base = {
    "noir": "#000000",
    "blanc": "#FFFFFF",
    "gris": "#808080",
    "argent": "#C0C0C0",     // silver
    "or": "#D4AF37",         // gold
    "cuivre": "#B87333",
    "bronze": "#CD7F32",

    "rouge": "#FF0000",
    "bordeaux": "#7B1E22",
    "grenat": "#6D071A",

    "rose": "#FFC0CB",
    "magenta": "#FF00FF",
    "fuchsia": "#FF00FF",
    "saumon": "#FA8072",
    "pêche": "#FFDAB9",

    "orange": "#FFA500",
    "abricot": "#FBCEB1",
    "corail": "#FF7F50",

    "jaune": "#FFFF00",
    "oranger": "#FFA500", // sometimes used informally

    "vert": "#008000",
    "turquoise": "#40E0D0",
    "émeraude": "#50C878",
    "lime": "#00FF00",

    "bleu": "#0000FF",
    "ciel": "#87CEEB",
    "azur": "#007FFF",
    "cyan": "#00FFFF",
    "indigo": "#4B0082",

    "violet": "#8A2BE2",     // closer to FR "violet" than CSS 'violet'
    "pourpre": "#800080",
    "lilas": "#C8A2C8",
    "lavande": "#E6E6FA",

    "marron": "#8B4513",
    "brun": "#7B3F00",
    "beige": "#F5F5DC",
    "ivoire": "#FFFFF0",
    "ocre": "#CC7722",
    "taupe": "#483C32",
  };

  // Try exact special (multi-word) match
  const specialHit = findKey(name, specials);
  if (specialHit) return specials[specialHit];

  // Extract modifiers and a base token
  const { baseWord, intensity } = parseFrenchColor(name);

  // If the whole string is a known base (e.g., "violet", "argent")
  if (base[baseWord]) {
    return applyIntensity(base[baseWord], intensity);
  }

  // Otherwise, try to locate a known base word anywhere in the phrase
  for (const key of Object.keys(base)) {
    if (name.includes(key)) {
      return applyIntensity(base[key], intensity);
    }
  }

  // Fallback: try English CSS keywords if the string is already English-ish
  // (e.g., "violet", "teal", "gold", etc.)
  const cssKeywords = new Set([
    "black","white","gray","silver","gold","red","salmon","coral","orange","yellow",
    "lime","green","turquoise","cyan","aqua","teal","blue","navy","indigo","purple",
    "violet","magenta","fuchsia","brown","beige","ivory","tan","chocolate","olive","maroon"
  ]);
  const words = name.split(/\s+/);
  for (const w of words) if (cssKeywords.has(w)) return w; // let CSS handle keyword

  return null; // couldn't map
}

// --- Helpers ---

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/\u00A0/g, " ")                 // NBSP → space
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[()]/g, " ")                  // drop parentheses for simpler parsing
    .replace(/\s+/g, " ")
    .trim();
}

function findKey(str, dict) {
  // Look for the longest matching key inside the string
  let hit = null;
  let maxLen = 0;
  for (const k of Object.keys(dict)) {
    if (str.includes(k) && k.length > maxLen) {
      hit = k; maxLen = k.length;
    }
  }
  return hit;
}

function parseFrenchColor(str) {
  // Pull out intensity modifiers and a base-ish token
  // e.g., "bleu tres clair", "rouge pale", "vert vif", "gris anthracite"
  const intensity = { lighten: 0, darken: 0, saturate: 0, desaturate: 0 };

  // very simple heuristics:
  if (/\b(tres|très)\s+clair\b/.test(str)) intensity.lighten += 0.3;
  if (/\bclair\b/.test(str)) intensity.lighten += 0.2;

  if (/\b(tres|très)\s+fonce\b/.test(str)) intensity.darken += 0.3;
  if (/\bfonce\b/.test(str)) intensity.darken += 0.2;

  if (/\bpale\b/.test(str)) intensity.desaturate += 0.25;
  if (/\bvif|sature\b/.test(str)) intensity.saturate += 0.25;

  // Try to identify a base color word (last meaningful colory word)
  const tokens = str.split(/\s+/);
  let baseWord = tokens[tokens.length - 1];
  const stop = new Set(["tres","tres","clair","fonce","pale","vif","sature","desature"]);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!stop.has(tokens[i])) { baseWord = tokens[i]; break; }
  }
  return { baseWord, intensity };
}

function applyIntensity(hex, { lighten, darken, saturate, desaturate }) {
  let { r, g, b } = hexToRgb(hex);
  let { h, s, l } = rgbToHsl(r, g, b);

  if (lighten) l = clamp01(l + lighten);
  if (darken) l = clamp01(l - darken);
  if (saturate) s = clamp01(s + saturate);
  if (desaturate) s = clamp01(s - desaturate);

  const { r: rr, g: gg, b: bb } = hslToRgb(h, s, l);
  return rgbToHex(rr, gg, bb);
}

// --- tiny color utils (no deps) ---

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r:0,g:0,b:0 };
}
function rgbToHex(r, g, b) {
  const to = v => v.toString(16).padStart(2, "0");
  return `#${to((r|0)).toUpperCase()}${to((g|0)).toUpperCase()}${to((b|0)).toUpperCase()}`;
}
function rgbToHsl(r, g, b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h, s, l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min;
    s=l>0.5? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  if (s===0) {
    const v = (l*255);
    return { r:v, g:v, b:v };
  }
  const hue2rgb=(p,q,t)=>{
    if (t<0) t+=1;
    if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const q=l<0.5 ? l*(1+s) : l+s-l*s;
  const p=2*l-q;
  const r=hue2rgb(p,q,h+1/3), g=hue2rgb(p,q,h), b=hue2rgb(p,q,h-1/3);
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
}