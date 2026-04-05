# Design System - Nix Finance

**Última atualização**: Abril 2026  
**Versão**: 2.2

---

## Visão Geral

O Design System do Nix Finance segue a filosofia **"Human & Organic"** - interfaces que parecem feitas à mão, acolhedoras e sofisticadas. O objetivo é evitar completamente a estética genérica de templates/AI.

**Stack de UI**: O app utiliza **Radix UI** (Themes e primitives) como base de componentes, com customizações Nix (cores, glassmorphism, sombras coloridas). MUI permanece para layout (Box, Grid, Drawer), DatePicker e alguns componentes legados em migração.

---

## 🎨 Radix UI Components

### Importações

```typescript
import { Theme, Button, Card, Dialog, Select, Text, Heading, IconButton, Avatar } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./radix-theme.css"; // Overrides Nix (purple accent, radius 20px, shadows)
```

### Componentes Base Nix

Todos os componentes reutilizáveis estão em `components/radix/`:

- **NixButton** – Botões com tamanhos canônicos `sm` (32px), `md` (40px), `lg/fab` (48px). Aliases legados `small/medium/large` aceitos. Prop `loading` desabilita + `cursor: wait`. Hover: lift; active: sink; disabled: opacidade 0.45. Variants: `solid`, `soft`, `ghost`, `outline`, `surface`. Cores: `purple`, `gray`, `red`, `green`, `cyan`.
- **NixCard** – Card com padding responsivo (24px desktop, 16px mobile), border-radius 20px, opção de glassmorphism e hover lift.
- **NixInput** – Wrapper de `TextField.Root` com radius large (20px), suporte a `startAdornment`/`endAdornment` (via `TextField.Slot`) e `errorMessage` exibida inline abaixo do campo com cor de erro.
- **Dialog** – Re-export de Radix Dialog; use `NixDialogContent` para fullscreen em mobile e padding 24px.
- **Select** – Re-export de Radix Select; use `NixSelectTrigger` / `NixSelectContent` para radius 20px.
- **EmptyState** – Componente unificado com ilustrações por tipo, animação flutuante e botão de ação consistente (size medium).

### Usando NixInput com Adornamentos

```tsx
import NixInput from "@/components/radix/Input";
import { Search as SearchIcon, Visibility as EyeIcon } from "@mui/icons-material";

// Input com ícone de busca
<NixInput
  placeholder="Pesquisar..."
  startAdornment={<SearchIcon fontSize="small" />}
/>

// Input com validação
<NixInput
  type="email"
  placeholder="seu@email.com"
  errorMessage="E-mail inválido"
  endAdornment={<EyeIcon fontSize="small" />}
/>
```

### Usando NixButton com Loading

```tsx
import NixButton from "@/components/radix/Button";

<NixButton size="md" loading={isSubmitting} onClick={handleSave}>
  Salvar
</NixButton>

// Tamanhos canônicos
<NixButton size="sm">Pequeno</NixButton>
<NixButton size="md">Médio</NixButton>
<NixButton size="lg">Grande</NixButton>
```

### Tamanhos de Botões (padrão em todas as telas)

| Contexto | Tamanho | Altura | Uso |
|----------|---------|--------|-----|
| FAB (Adicionar) | `fab` | 64px | Adicionar principal em mobile |
| Ação primária (footer de modal) | `md` | 40px | Salvar, Confirmar |
| Ação secundária (modal) | `md` + variant `soft` | 40px | Cancelar, Voltar |
| Ação em card | `sm` | 32px | Editar, Excluir em cards |
| Ação grande/CTA | `lg` | 48px | CTA de destaque |
| Icon button | Radix `IconButton` size="3" | 48px | Touch-friendly em header/nav |

> **Nota**: os aliases `small/medium/large` também são aceitos para retrocompatibilidade.

### Tema Radix (Nix)

- **Arquivo**: `radix-theme.css` – sobrescreve `--accent-9` (purple Nix), `--radius-5`/`--radius-6` (20px), sombras coloridas e classe `.nix-glass-panel`.
- **App.tsx**: `<Theme appearance={darkMode ? "dark" : "light"} accentColor="purple" radius="large" />`.

---

## 🎨 Tokens CSS (index.css)

Todos os tokens ficam em `:root` no `index.css` e estão disponíveis via `var()` em qualquer contexto (MUI `sx`, Radix, CSS puro):

### Tokens de Raio

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-card` | `20px` | Cards, Paper, modais |
| `--radius-input` | `20px` | Inputs, Selects |
| `--radius-button-sm` | `10px` | Botões pequenos |
| `--radius-button-md` | `12px` | Botões médios |
| `--radius-button-lg` | `14px` | Botões grandes |

### Tokens de Sombra

| Token | Uso |
|-------|-----|
| `--shadow-soft` | Sombra padrão de card (roxa suave) |
| `--shadow-card` | Sombra de card em repouso |
| `--shadow-elevated` | Sombra de elemento elevado (modal, dropdown) |
| `--shadow-teal-soft` | Sombra teal para elementos de receita/sucesso |

```tsx
// Usando no sx do MUI
<Paper sx={{ boxShadow: "var(--shadow-soft)", borderRadius: "var(--radius-card)" }}>

// Usando em CSS
.meu-card { box-shadow: var(--shadow-card); border-radius: var(--radius-card); }
```

---

## 🎨 Filosofia de Design

### Princípio Central: "Human & Organic"

Construir interfaces que parecem artesanais, acolhedoras e sofisticadas. Combater ativamente a estética genérica de templates.

### 🚫 Anti-Patterns (NUNCA FAZER)

- ❌ **NUNCA** usar sombras pretas. Use sombras coloridas (roxa Nix) definidas em `radix-theme.css` ou `theme.ts`.
- ❌ **NUNCA** usar cores de alta saturação (como `#0000FF` ou `#FF0000` puros).
- ❌ **NUNCA** usar animações rígidas ou transições instantâneas.
- ❌ **NUNCA** deixar empty states apenas com texto. Use ícones, ilustrações ou copy amigável.
- ❌ **NUNCA** usar "Lorem Ipsum" padrão. Use dados financeiros realistas para placeholders.

### ✅ Regras de Design (SEMPRE FAZER)

#### 1. Hierarquia Visual & Profundidade (Glassmorphism & Sombras Suaves)

- Em vez de sombras pretas, use **sombras coloridas** derivadas do conteúdo do elemento.
  - ❌ **Ruim**: `box-shadow: 0 4px 6px rgba(0,0,0,0.5)`
  - ✅ **Bom**: `box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.15)` (tintado de Indigo)

- Use **Glassmorphism** para cards e overlays:
  ```typescript
  backdropFilter: "blur(12px)"
  background: "rgba(255, 255, 255, 0.7)" // light mode
  border: "1px solid rgba(255, 255, 255, 0.3)"
  ```

#### 2. Tipografia & Copywriting

- Use uma sans-serif geométrica moderna (assuma "Plus Jakarta Sans" ou "Inter").
- **UX Writing**: Seja amigável e conversacional.
  - ❌ **Em vez de**: "Transaction Error"
  - ✅ **Diga**: "Oops, we couldn't save that transaction."
- Use pesos de fonte distintos: 600/700 para títulos, 400/500 para corpo. Evite genérico `fontWeight="bold"`.

#### 3. Espaçamento & Raio (Sensação Orgânica)

- Use padding generoso. Permita que a UI respire.
- **Border Radius:**
  - Elementos pequenos (botões/inputs): `8px` ou `10px` (0.5 ou 1 no sistema MUI)
  - Elementos grandes (cards/modais): `20px` ou `24px` (2.5 ou 3 no sistema MUI) - sensação Superellipse
- Evite cantos de 90 graus a menos que seja estritamente necessário.

#### 4. Paleta de Cores (Sofisticada)

- **Primary**: Use um Indigo/Violet ligeiramente dessaturado (ex: `#6366F1` → `#5B5FC7`) ou um Emerald profundo.
- **Backgrounds**: Nunca branco puro (`#FFFFFF`) ou preto puro (`#000000`).
  - Light: `#F8FAFC` (Slate-50) ou `#F9FAFB` (Gray-50)
  - Dark: `#0F172A` (Slate-900)

**Cores do Tema MUI:**
- Primary: Indigo (#6366f1)
- Secondary: Pink (#ec4899)
- Success: Emerald (#10b981)
- Error: Red (#ef4444)
- Warning: Amber (#f59e0b)

#### 5. Micro-Interações

- Todos os elementos interativos DEVEM ter estados hover e active.
- Adicione `transition: all 0.2s ease-in-out` a botões e cards.
- No hover, levante elementos ligeiramente: `transform: translateY(-2px)`.

---

## 📏 Sistema de Espaçamento

### Visão Geral

O sistema de espaçamento do Nix utiliza múltiplos de 8px (sistema MUI padrão) para criar uma hierarquia visual consistente.

### Escala de Espaçamento

```typescript
// Unidade base: 8px (theme.spacing(1))
XS:  0.5 =  4px  // Gaps mínimos entre elementos muito próximos
SM:  1   =  8px  // Elementos compactos, separação intra-componente
MD:  2   = 16px  // **PADRÃO** - Padding interno de componentes
LG:  3   = 24px  // **PADRÃO** - Espaçamento entre seções/cards
XL:  4   = 32px  // Separação de módulos principais
```

### Aplicação por Contexto

#### 1. Cards e Containers

{% raw %}
```typescript
// Padding interno
<Card sx={{ p: 3 }}>           // Desktop: 24px
<Card sx={{ p: isMobile ? 2 : 3 }}> // Mobile: 16px, Desktop: 24px

// Margem entre cards
<Grid container spacing={2.5}>  // 20px entre cards
```
{% endraw %}

#### 2. Formulários e Inputs

```typescript
// Espaçamento entre campos
<Stack spacing={2.5}>          // 20px entre inputs

// Padding interno de inputs
// Definido automaticamente pelo MUI, não customizar
```

#### 3. Modais e Dialogs

{% raw %}
```typescript
<DialogContent sx={{ pt: 2, pb: 3 }}>
  // pt: 16px (topo)
  // pb: 24px (base)
</DialogContent>

<DialogActions sx={{ p: 3, pt: 0 }}>
  // Lateral: 24px
  // Topo: 0 (já tem padding do content)
</DialogActions>
```
{% endraw %}

#### 4. Sidebar e Navigation

{% raw %}
```typescript
// Padding container
<Box sx={{ px: 2, py: 2 }}>   // 16px horizontal e vertical

// Padding de items
<ListItemButton sx={{ py: 1.5, px: 2 }}>
  // 12px vertical, 16px horizontal
</ListItemButton>
```
{% endraw %}

#### 5. Gaps entre Elementos

```typescript
// Elementos muito próximos (icons + text)
gap: 0.5  // 4px

// Elementos relacionados (botões em grupo)
gap: 1    // 8px

// Elementos independentes (seções de um form)
gap: 2.5  // 20px
```

### Regras Importantes

#### ✅ FAZER

1. **Usar múltiplos de 0.5** (4px)
   {% raw %}
   ```typescript
   sx={{ p: 2.5 }}    // ✅ 20px
   sx={{ gap: 1.5 }}  // ✅ 12px
   ```
   {% endraw %}

2. **Manter consistência por tipo**
   - Cards sempre `p: 3` (desktop)
   - Inputs sempre `spacing: 2.5`
   - Modais sempre `p: 3` nas ações

3. **Responsive com breakpoints**
   {% raw %}
   ```typescript
   sx={{ p: isMobile ? 2 : 3 }}  // ✅
   ```
   {% endraw %}

#### ❌ EVITAR

1. **Valores hardcoded fora do sistema**
   {% raw %}
   ```typescript
   sx={{ padding: "18px" }}     // ❌ Não é múltiplo de 8
   sx={{ marginTop: "25px" }}   // ❌ Use theme.spacing()
   ```
   {% endraw %}

2. **Espaçamentos inconsistentes**
   {% raw %}
   ```typescript
   // Card A
   <Card sx={{ p: 2 }}>         // ❌ Deveria ser p: 3

   // Card B (mesmo contexto)
   <Card sx={{ p: 3 }}>         // ✅
   ```
   {% endraw %}

3. **Padding diferente em componentes similares**
   {% raw %}
   ```typescript
   // Dialog 1
   <DialogContent sx={{ p: 2 }}>    // ❌

   // Dialog 2
   <DialogContent sx={{ p: 3 }}>    // ✅
   ```
   {% endraw %}

### Tabela de Referência Rápida

| Contexto                | Desktop | Mobile  | Propriedade    |
|-------------------------|---------|---------|----------------|
| Card padding            | `p: 3`  | `p: 2`  | 24px / 16px    |
| Form field gap          | `spacing: 2.5`     | 20px           |
| Modal padding           | `p: 3`  | `p: 2`  | 24px / 16px    |
| Sidebar container       | `px: 2, py: 2`     | 16px           |
| Button group gap        | `gap: 1`           | 8px            |
| Section separation      | `mt: 2.5` ou `3`   | 20px / 24px    |
| Icon + Text             | `gap: 0.5`         | 4px            |

### Exemplos Práticos

#### Card com Conteúdo

{% raw %}
```typescript
<Card sx={{ p: 3 }}>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Título
  </Typography>
  <Stack spacing={2.5}>
    <TextField />
    <TextField />
  </Stack>
</Card>
```
{% endraw %}

#### Modal com Ações

{% raw %}
```typescript
<Dialog>
  <DialogTitle sx={{ pb: 2 }}>
    Novo Item
  </DialogTitle>
  
  <DialogContent sx={{ pt: 2, pb: 3 }}>
    <Stack spacing={2.5}>
      {/* Form fields */}
    </Stack>
  </DialogContent>
  
  <DialogActions sx={{ p: 3, pt: 0, gap: 1.5 }}>
    <Button>Cancelar</Button>
    <Button variant="contained">Salvar</Button>
  </DialogActions>
</Dialog>
```
{% endraw %}

#### Grid de Cards

{% raw %}
```typescript
<Grid container spacing={2.5}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Card sx={{ p: isMobile ? 2 : 3 }}>
      {/* Content */}
    </Card>
  </Grid>
</Grid>
```
{% endraw %}

### Exceções Permitidas

- **BorderRadius**: 20px (2.5) é o padrão global definido no tema
- **IconSize**: 16px, 18px, 20px, 24px (definidos pelo MUI)
- **LineHeight**: Controlado automaticamente pela tipografia

---

## 🎨 Componentes e Padrões

### Cards

{% raw %}
```typescript
<Card
  sx={{
    borderRadius: "20px",
    bgcolor: isDarkMode
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha("#FFFFFF", 0.8),
    backdropFilter: "blur(12px)",
    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
    boxShadow: `0 10px 40px -10px ${alpha(theme.palette.primary.main, 0.15)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: `0 16px 48px -12px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
  }}
>
  <CardContent sx={{ p: 3 }}>
    {/* Content */}
  </CardContent>
</Card>
```
{% endraw %}

### Dialogs/Modals

{% raw %}
```typescript
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: isMobile ? 0 : "20px",
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.paper, 0.95)
        : alpha("#FFFFFF", 0.98),
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: isMobile
        ? "none"
        : `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
      boxShadow: isDarkMode
        ? `0 24px 80px -20px ${alpha("#000000", 0.6)}`
        : `0 24px 80px -20px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  }}
  slotProps={{
    backdrop: {
      sx: {
        bgcolor: isDarkMode
          ? alpha("#0F172A", 0.8)
          : alpha("#64748B", 0.4),
        backdropFilter: "blur(8px)",
      },
    },
  }}
>
  {/* Content */}
</Dialog>
```
{% endraw %}

### Botões

{% raw %}
```typescript
<Button
  variant="contained"
  sx={{
    borderRadius: "20px",
    px: 2.5,
    py: 1.25,
    fontWeight: 600,
    textTransform: "none",
    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
  }}
>
  Texto do Botão
</Button>
```
{% endraw %}

### Inputs

{% raw %}
```typescript
<TextField
  fullWidth
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: isDarkMode
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.primary.main, 0.02),
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.1)
          : alpha(theme.palette.primary.main, 0.12),
        borderWidth: 1.5,
      },
      "&:hover fieldset": {
        borderColor: isDarkMode
          ? alpha("#FFFFFF", 0.2)
          : alpha(theme.palette.primary.main, 0.25),
      },
      "&.Mui-focused": {
        bgcolor: isDarkMode
          ? alpha(theme.palette.primary.main, 0.08)
          : alpha(theme.palette.primary.main, 0.04),
      },
    },
  }}
/>
```
{% endraw %}

---

## 🎭 Animações e Transições

### Princípios

- Todas as transições devem ser suaves: `transition: all 0.2s ease-in-out`
- Hover deve elevar elementos: `transform: translateY(-2px)` ou `translateY(-4px)`
- Evitar animações rígidas ou instantâneas

### Padrões de Animação

{% raw %}
```typescript
// Hover em cards
"&:hover": {
  transform: "translateY(-4px)",
  transition: "all 0.2s ease-in-out",
}

// Hover em botões
"&:hover": {
  transform: "translateY(-2px)",
  transition: "all 0.2s ease-in-out",
}

// Loading states
<CircularProgress sx={{ animation: "spin 1s linear infinite" }} />
```
{% endraw %}

---

## 🌓 Dark Mode

### Backgrounds

- **Light Mode**: `#F8FAFC` (Slate-50) ou `#F9FAFB` (Gray-50)
- **Dark Mode**: `#0F172A` (Slate-900)

### Cards e Surfaces

```typescript
bgcolor: isDarkMode
  ? alpha(theme.palette.background.paper, 0.6)
  : alpha("#FFFFFF", 0.8)
```

### Borders

```typescript
border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`
```

---

## 📱 Responsividade

### Breakpoints

- **Mobile**: `theme.breakpoints.down("md")` (< 900px)
- **Desktop**: `theme.breakpoints.up("md")` (≥ 900px)

### Padrões Responsivos

{% raw %}
```typescript
// Padding adaptativo
sx={{ p: isMobile ? 2 : 3 }}  // Mobile: 16px, Desktop: 24px

// Full screen em mobile
fullScreen={isMobile}

// Grid responsivo
<Grid container spacing={2.5}>
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
    {/* Content */}
  </Grid>
</Grid>
```
{% endraw %}

---

## ✅ Checklist de Verificação

Antes de commit, verifique:

1. ✅ Todos os `p`, `px`, `py`, `m`, `mx`, `my` são múltiplos de 0.5
2. ✅ Cards similares têm o mesmo padding
3. ✅ Gaps são consistentes por tipo de agrupamento
4. ✅ Mobile/Desktop seguem a mesma proporção (geralmente 2 vs 3)
5. ✅ Border radius é 20px (2.5) para elementos grandes, 12px (1.5) para pequenos
6. ✅ Sombras são coloridas, não pretas
7. ✅ Transições são suaves (0.2s ease-in-out)
8. ✅ Hover states estão implementados
9. ✅ Dark mode está testado
10. ✅ Empty states têm ícones/ilustrações

---

## 📚 Referências

- **MUI Theme**: Configurado em `theme.ts`
- **Cores**: Acesse via `theme.palette.primary.main`, etc.
- **Espaçamento**: Use `theme.spacing()` ou valores numéricos (múltiplos de 0.5)
- **Alpha**: Use `alpha()` helper do MUI para transparências

---

**Mantido por**: Equipe Nix  
**Versão do Documento**: 2.0
