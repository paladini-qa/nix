/**
 * NIX BRAND BOOK — Cozy Coffee Edition
 * =====================================
 *
 * Nix - Finanças inteligentes, com o aconchego de uma boa xícara.
 * Seu dinheiro, cuidado com carinho e clareza.
 *
 * Arquétipo: O Cuidador (The Caregiver) + O Criador (The Creator)
 * O Nix cuida das suas finanças como um barista cuida do café perfeito —
 * com atenção, carinho e o resultado sempre reconfortante nas suas mãos.
 */

// ============================================
// PALETA DE CORES COFFEE
// ============================================

/**
 * Cor Primária: Mocha Brown
 * O coração da marca. Um marrom aconchegante que remete ao café artesanal.
 * Uso: Logotipo, botões principais (CTAs), destaques, headers.
 */
export const COFFEE_BROWN = {
  mocha: "#7B4226",        // Mocha — light mode principal
  cappuccino: "#A0622A",   // Cappuccino — tom mais claro
  espresso: "#5A2D0C",     // Espresso — tom mais escuro
  cremeBrulee: "#D4A875",  // Crème brûlée — dark mode principal
  gradient: "linear-gradient(135deg, #A0622A 0%, #7B4226 100%)",
  gradientDark: "linear-gradient(135deg, #D4A875 0%, #C4885F 100%)",
  glow: "rgba(124, 66, 38, 0.45)",
} as const;

/**
 * Cor Secundária: Caramel & Latte
 * Representa leveza, suavidade e o calor do cotidiano.
 * Uso: Acentos, ícones secundários, detalhes de interação.
 */
export const CREAM_ACCENT = {
  latte: "#DDB899",        // Latte suave
  cappuccino: "#C4885F",   // Cappuccino
  caramel: "#C4883A",      // Caramelo
  steam: "#FDF8F0",        // Leite vaporizado — fundo light
  foam: "#FEF3E2",         // Espuma de latte — superfície light
  gradient: "linear-gradient(135deg, #DDA855 0%, #C4883A 100%)",
  glow: "rgba(196, 136, 60, 0.45)",
} as const;

/**
 * Cores Neutras (Fundos e Textos)
 */
export const COFFEE_NEUTRAL = {
  // Light Mode
  espressoText: "#2C1A11",   // Texto principal no light mode
  mochaText: "#7B5A3C",      // Texto secundário no light mode
  steamBg: "#FDF8F0",        // Fundo principal light
  foamBg: "#FEF3E2",         // Fundo de superfície light
  // Dark Mode
  creamText: "#F0D9C0",      // Texto principal no dark mode
  tanText: "#C4A882",        // Texto secundário no dark mode
  espressoBg: "#1C1008",     // Fundo principal dark
  darkRoastBg: "#2C1A10",    // Fundo de superfície dark
} as const;

/**
 * Cores Semânticas (UI)
 */
export const COFFEE_SEMANTIC = {
  success: "#5B8A5A",        // Sage green — metas atingidas, receitas
  successLight: "#8FBC8F",
  successDark: "#7AB87A",    // Sage mais vibrante para dark mode
  error: "#B85450",          // Dusty rose — gastos excessivos ou erros
  errorLight: "#D4817D",
  errorDark: "#E07870",      // Soft coral para dark mode
  warning: "#C4883A",        // Caramel — alertas
} as const;

// ============================================
// GRADIENTES STEAM (BACKGROUNDS)
// ============================================

export const COFFEE_STEAM = {
  light: `
    radial-gradient(ellipse 110% 85% at 5% 8%, rgba(196, 136, 95, 0.09) 0%, transparent 52%),
    radial-gradient(ellipse 80% 70% at 88% 6%, rgba(196, 168, 100, 0.06) 0%, transparent 46%),
    radial-gradient(ellipse 55% 75% at 95% 55%, rgba(91, 138, 90, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 65% 55% at 12% 88%, rgba(124, 66, 38, 0.05) 0%, transparent 50%)
  `,
  dark: `
    radial-gradient(ellipse 110% 85% at 5% 8%, rgba(212, 168, 117, 0.18) 0%, transparent 52%),
    radial-gradient(ellipse 80% 70% at 88% 6%, rgba(196, 136, 95, 0.12) 0%, transparent 46%),
    radial-gradient(ellipse 55% 75% at 95% 55%, rgba(122, 184, 122, 0.07) 0%, transparent 50%),
    radial-gradient(ellipse 65% 55% at 12% 88%, rgba(196, 136, 95, 0.09) 0%, transparent 50%)
  `,
} as const;

// Aliases para compatibilidade com código existente
export const NIX_AURORA = COFFEE_STEAM;

// ============================================
// TIPOGRAFIA — Playfair Display + Nunito
// ============================================

export const COFFEE_TYPOGRAPHY = {
  /** Fonte para títulos — elegante, artesanal, cozy */
  headingFont: '"Playfair Display", "Georgia", serif',
  /** Fonte para corpo — arredondada, amigável, aconchegante */
  bodyFont: '"Nunito", "Segoe UI", sans-serif',
  weights: {
    heading: { bold: 700, semibold: 600 },
    body: { regular: 400, medium: 500, semibold: 600 },
  },
} as const;

// Alias de compatibilidade
export const NIX_TYPOGRAPHY = COFFEE_TYPOGRAPHY;

// ============================================
// DESIGN TOKENS
// ============================================

export const COFFEE_DESIGN = {
  borderRadius: {
    small: 10,
    large: 20,
    round: 24,
  },
  glass: {
    blur: "20px",
    bgLight: "rgba(253, 248, 240, 0.88)",
    bgDark: "rgba(44, 26, 16, 0.88)",
    borderLight: "rgba(44, 26, 17, 0.07)",
    borderDark: "rgba(240, 217, 192, 0.08)",
  },
  shadows: {
    subtle: "0 4px 12px -2px rgba(124, 66, 38, 0.10)",
    medium: "0 8px 24px -4px rgba(124, 66, 38, 0.15)",
    strong: "0 16px 48px -8px rgba(124, 66, 38, 0.20)",
  },
  transitions: {
    fast: "all 0.1s ease-in-out",
    normal: "all 0.2s ease-in-out",
    slow: "all 0.3s ease-in-out",
  },
} as const;

// Alias de compatibilidade
export const NIX_DESIGN = COFFEE_DESIGN;

// ============================================
// VOZ E TOM DA MARCA — Cozy & Caring
// ============================================

/**
 * A Voz do Nix
 *
 * O Nix é Acolhedor, Claro e Encorajador.
 * É aquele amigo que entende de finanças, mas te conta as coisas
 * tomando um café quentinho — sem pressa, sem julgamento.
 * Ele é gentil na análise, honesto nos alertas e sempre te faz sentir bem.
 */

export const COFFEE_VOICE = {
  positive: {
    examples: [
      "Que tal! ☕ Você gastou menos esse mês. O cofrinho está feliz!",
      "Parabéns! 🌿 Sua meta foi atingida. Você merece um café especial.",
      "Tudo certo por aqui! 💚 Suas finanças estão aquecidas e no ponto.",
    ],
  },
  alert: {
    examples: [
      "Ei, notei algo aqui ☕ — um gasto incomum de R$500. Se foi você, tudo certo!",
      "Hmm, os gastos com delivery subiram este mês. Quer dar uma olhada juntos?",
      "Você está chegando perto do limite de Lazer. Posso te ajudar a ajustar?",
    ],
  },
  educational: {
    examples: [
      "Analisei seus últimos 3 meses ☕ Parece que as sextas são mais agitadas. Que tal separar um valor para o fim de semana?",
      "CDB é como uma poupança caprichada — seu dinheiro descansa e rende mais.",
      "Inflação é quando tudo fica mais caro. Seu dinheiro parado perde força com o tempo.",
    ],
  },
  error: {
    examples: [
      "Ops, tive um probleminha aqui ☕ Pode tentar de novo?",
      "Não consegui processar isso. Me conta de outro jeito!",
      "Algo deu errado, mas não se preocupe — geralmente funciona na próxima.",
    ],
  },
} as const;

// Alias de compatibilidade
export const NIX_VOICE = COFFEE_VOICE;

// ============================================
// O QUE NÃO FAZER
// ============================================

export const COFFEE_DONT = [
  "Evitar jargões bancários sem explicação imediata",
  "Nunca usar tom de julgamento ('Você gastou demais de novo!')",
  "Evitar linguagem muito técnica ou fria — seja sempre acolhedor",
  "Não usar paleta azul fria ou preta intensa no light mode",
] as const;

export const NIX_DONT = COFFEE_DONT;

// ============================================
// SLOGANS E TAGLINES — Cozy Coffee Edition
// ============================================

export const COFFEE_SLOGANS = {
  principal: "Nix. Finanças com aconchego.",
  focoIA: "Seu dinheiro, cuidado com carinho e IA.",
  focoBeneficio: "Clareza financeira, do jeitinho que você merece.",
  appStore: "Gestão financeira aconchegante com IA.",
} as const;

export const NIX_SLOGANS = COFFEE_SLOGANS;

// ============================================
// CORES LEGADAS (para compatibilidade)
// ============================================

export const NIX_PURPLE = {
  start: COFFEE_BROWN.mocha,
  end: COFFEE_BROWN.espresso,
  light: COFFEE_BROWN.cappuccino,
  gradient: COFFEE_BROWN.gradient,
  glow: COFFEE_BROWN.glow,
} as const;

export const NIX_TEAL = {
  main: CREAM_ACCENT.caramel,
  light: CREAM_ACCENT.caramel,
  dark: "#9A6820",
  gradient: CREAM_ACCENT.gradient,
  glow: CREAM_ACCENT.glow,
} as const;

export const NIX_NEUTRAL = {
  nixDark: COFFEE_NEUTRAL.espressoText,
  pureWhite: COFFEE_NEUTRAL.steamBg,
  softGray: COFFEE_NEUTRAL.foamBg,
} as const;

export const NIX_SEMANTIC = {
  success: COFFEE_SEMANTIC.success,
  successLight: COFFEE_SEMANTIC.successLight,
  error: COFFEE_SEMANTIC.error,
  errorLight: COFFEE_SEMANTIC.errorLight,
  warning: COFFEE_SEMANTIC.warning,
} as const;

// ============================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================

export const COFFEE_BRAND = {
  colors: {
    brown: COFFEE_BROWN,
    cream: CREAM_ACCENT,
    neutral: COFFEE_NEUTRAL,
    semantic: COFFEE_SEMANTIC,
  },
  steam: COFFEE_STEAM,
  typography: COFFEE_TYPOGRAPHY,
  design: COFFEE_DESIGN,
  voice: COFFEE_VOICE,
  slogans: COFFEE_SLOGANS,
} as const;

// Alias principal
export const NIX_BRAND = {
  colors: {
    purple: NIX_PURPLE,
    teal: NIX_TEAL,
    neutral: NIX_NEUTRAL,
    semantic: NIX_SEMANTIC,
  },
  aurora: NIX_AURORA,
  typography: NIX_TYPOGRAPHY,
  design: NIX_DESIGN,
  voice: NIX_VOICE,
  slogans: NIX_SLOGANS,
} as const;

export default COFFEE_BRAND;
