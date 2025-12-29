/**
 * NIX BRAND BOOK - Diretrizes de Marca
 * =====================================
 * 
 * Nix - Finanças inteligentes.
 * Seu dinheiro, potencializado por IA.
 * 
 * Arquétipo: O Sábio (The Sage) + O Mago (The Magician)
 * O Nix detém o conhecimento profundo (Sábio) e usa a tecnologia
 * para transformar magicamente o caos financeiro em ordem e crescimento (Mago).
 */

// ============================================
// PALETA DE CORES NIX
// ============================================

/**
 * Cor Primária: Nix Purple (Gradiente)
 * O coração da marca. Um gradiente que vai de um roxo vibrante a um violeta azulado.
 * Uso: Logotipo, botões principais (CTAs), destaques de IA, headers.
 */
export const NIX_PURPLE = {
  start: "#8A2BE2",    // Violeta vibrante
  end: "#6A0DAD",      // Roxo profundo
  light: "#9D4EDD",    // Tom mais claro
  gradient: "linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)",
  glow: "rgba(138, 43, 226, 0.5)",
} as const;

/**
 * Cor Secundária: Cyber Teal (Ciano)
 * Representa crescimento, dados fluindo e frescor. É a cor "ativa" que complementa o roxo.
 * Uso: Gráficos de rendimento positivo, ícones secundários, detalhes de interação.
 */
export const NIX_TEAL = {
  main: "#00D4FF",
  light: "#5CE1E6",
  dark: "#00A3CC",
  gradient: "linear-gradient(135deg, #00D4FF 0%, #00A3CC 100%)",
  glow: "rgba(0, 212, 255, 0.5)",
} as const;

/**
 * Cores Neutras (Fundos e Textos)
 */
export const NIX_NEUTRAL = {
  nixDark: "#1A1A2E",      // Azul marinho quase preto (textos)
  pureWhite: "#FFFFFF",    // Fundos
  softGray: "#F4F6F9",     // Fundos secundários/cards
} as const;

/**
 * Cores Semânticas (UI)
 */
export const NIX_SEMANTIC = {
  success: "#2ECC71",      // Verde - metas atingidas
  successLight: "#A9DFBF",
  error: "#FF6B6B",        // Coral - gastos excessivos ou erros
  errorLight: "#FDEDEC",
  warning: "#F59E0B",      // Amber
} as const;

// ============================================
// GRADIENTES AURORA (BACKGROUNDS)
// ============================================

export const NIX_AURORA = {
  light: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(138, 43, 226, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(0, 212, 255, 0.06) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(46, 204, 113, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(106, 13, 173, 0.05) 0%, transparent 50%)
  `,
  dark: `
    radial-gradient(ellipse 100% 80% at 5% 10%, rgba(138, 43, 226, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse 80% 70% at 90% 5%, rgba(0, 212, 255, 0.15) 0%, transparent 45%),
    radial-gradient(ellipse 60% 80% at 95% 50%, rgba(46, 204, 113, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 70% 60% at 10% 85%, rgba(106, 13, 173, 0.12) 0%, transparent 50%)
  `,
} as const;

// ============================================
// TIPOGRAFIA
// ============================================

export const NIX_TYPOGRAPHY = {
  /** Fonte primária para títulos - moderna, geométrica e amigável */
  headingFont: '"Poppins", "Inter", sans-serif',
  /** Fonte secundária para corpo - projetada para interfaces de usuário */
  bodyFont: '"Inter", "Segoe UI", sans-serif',
  /** Pesos recomendados */
  weights: {
    heading: { bold: 700, semibold: 600 },
    body: { regular: 400, medium: 500 },
  },
} as const;

// ============================================
// DESIGN TOKENS
// ============================================

export const NIX_DESIGN = {
  /** Border radius padrão - sensação de superellipse */
  borderRadius: {
    small: 10,   // Buttons, inputs
    large: 20,   // Cards, modals (padrão)
    round: 24,   // Cards grandes
  },
  /** Glassmorphism */
  glass: {
    blur: "20px",
    bgLight: "rgba(255, 255, 255, 0.75)",
    bgDark: "rgba(37, 37, 66, 0.75)",
    borderLight: "rgba(255, 255, 255, 0.3)",
    borderDark: "rgba(255, 255, 255, 0.08)",
  },
  /** Sombras com tonalidade roxa */
  shadows: {
    subtle: "0 4px 12px -2px rgba(138, 43, 226, 0.1)",
    medium: "0 8px 24px -4px rgba(138, 43, 226, 0.15)",
    strong: "0 16px 48px -8px rgba(138, 43, 226, 0.2)",
  },
  /** Transições */
  transitions: {
    fast: "all 0.1s ease-in-out",
    normal: "all 0.2s ease-in-out",
    slow: "all 0.3s ease-in-out",
  },
} as const;

// ============================================
// VOZ E TOM DA MARCA
// ============================================

/**
 * A Voz do Nix
 * 
 * O Nix é Inteligente, Direto e Empático.
 * É aquele amigo tech-savvy que entende muito de finanças,
 * mas te explica as coisas sem te fazer sentir burro.
 * Ele é confiante na sua análise, mas nunca arrogante.
 */

export const NIX_VOICE = {
  /** Quando as coisas vão bem: Entusiasta e motivador */
  positive: {
    examples: [
      "Mandou bem! Você gastou 15% menos em delivery essa semana. O cofrinho agradece. 🎉",
      "Parabéns! Sua meta de economia do mês foi atingida. Continue assim! ✨",
      "Você está no verde! Bom trabalho mantendo as finanças em dia. 💚",
    ],
  },
  /** Quando há um problema (alerta de gastos): Calmo, direto e focado na solução */
  alert: {
    examples: [
      "Atenção: Identifiquei um gasto incomum de R$500. Se foi você, tudo certo. Se não, toque aqui para verificar.",
      "Hmm, seus gastos com delivery aumentaram 30% esse mês. Quer ver algumas dicas?",
      "Alerta: Você está próximo do limite do orçamento de Lazer. Posso te ajudar a ajustar?",
    ],
  },
  /** Ao explicar conceitos complexos (IA): Didático e simples */
  educational: {
    examples: [
      "Analisei seus últimos 3 meses. Parece que você gasta mais às sextas-feiras. Sugiro separar R$X a mais para o fim de semana.",
      "CDB é tipo uma poupança turbinada - seu dinheiro fica parado no banco e rende mais que a poupança comum.",
      "Inflação é quando as coisas ficam mais caras. Seu dinheiro parado perde valor com o tempo.",
    ],
  },
  /** Erros: Nunca culpar o usuário */
  error: {
    examples: [
      "Ops, tive um probleminha aqui. 😅 Pode tentar de novo?",
      "Não consegui processar isso. Me conta de outro jeito que eu dou um jeito!",
      "Algo deu errado, mas não se preocupe - tenta novamente que geralmente funciona.",
    ],
  },
} as const;

/**
 * O que NÃO fazer na comunicação
 */
export const NIX_DONT = [
  "Evitar jargões bancários excessivos (CDB, CDI, Amortização) sem explicação imediata",
  "Nunca usar tom de julgamento ou bronca ('Você gastou demais de novo!')",
  "Evitar gírias excessivamente jovens que soem forçadas ('E aí, parça das finanças')",
] as const;

// ============================================
// SLOGANS E TAGLINES
// ============================================

export const NIX_SLOGANS = {
  principal: "Nix. Finanças inteligentes.",
  focoIA: "Seu dinheiro, potencializado por IA.",
  focoBeneficio: "Menos estresse, mais clareza financeira.",
  appStore: "Gestão financeira com IA.",
} as const;

// ============================================
// EXPORTAÇÃO CONSOLIDADA
// ============================================

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

export default NIX_BRAND;

