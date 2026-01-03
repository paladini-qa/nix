# Sistema de Espaçamento - Nix

## Visão Geral

O sistema de espaçamento do Nix utiliza múltiplos de 8px (sistema MUI padrão) para criar uma hierarquia visual consistente.

## Escala de Espaçamento

```typescript
// Unidade base: 8px (theme.spacing(1))
XS:  0.5 =  4px  // Gaps mínimos entre elementos muito próximos
SM:  1   =  8px  // Elementos compactos, separação intra-componente
MD:  2   = 16px  // **PADRÃO** - Padding interno de componentes
LG:  3   = 24px  // **PADRÃO** - Espaçamento entre seções/cards
XL:  4   = 32px  // Separação de módulos principais
```

## Aplicação por Contexto

### 1. Cards e Containers

```typescript
// Padding interno
<Card sx={{ p: 3 }}>           // Desktop: 24px
<Card sx={{ p: isMobile ? 2 : 3 }}> // Mobile: 16px, Desktop: 24px

// Margem entre cards
<Grid container spacing={2.5}>  // 20px entre cards
```

### 2. Formulários e Inputs

```typescript
// Espaçamento entre campos
<Stack spacing={2.5}>          // 20px entre inputs

// Padding interno de inputs
// Definido automaticamente pelo MUI, não customizar
```

### 3. Modais e Dialogs

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

### 4. Sidebar e Navigation

```typescript
// Padding container
<Box sx={{ px: 2, py: 2 }}>   // 16px horizontal e vertical

// Padding de items
<ListItemButton sx={{ py: 1.5, px: 2 }}>
  // 12px vertical, 16px horizontal
</ListItemButton>
```

### 5. Gaps entre Elementos

```typescript
// Elementos muito próximos (icons + text)
gap: 0.5  // 4px

// Elementos relacionados (botões em grupo)
gap: 1    // 8px

// Elementos independentes (seções de um form)
gap: 2.5  // 20px
```

## Regras Importantes

### ✅ FAZER

1. **Usar múltiplos de 0.5** (4px)
   ```typescript
   sx={{ p: 2.5 }}    // ✅ 20px
   sx={{ gap: 1.5 }}  // ✅ 12px
   ```

2. **Manter consistência por tipo**
   - Cards sempre `p: 3` (desktop)
   - Inputs sempre `spacing: 2.5`
   - Modais sempre `p: 3` nas ações

3. **Responsive com breakpoints**
   ```typescript
   sx={{ p: isMobile ? 2 : 3 }}  // ✅
   ```

### ❌ EVITAR

1. **Valores hardcoded fora do sistema**
   ```typescript
   sx={{ padding: "18px" }}     // ❌ Não é múltiplo de 8
   sx={{ marginTop: "25px" }}   // ❌ Use theme.spacing()
   ```

2. **Espaçamentos inconsistentes**
   ```typescript
   // Card A
   <Card sx={{ p: 2 }}>         // ❌ Deveria ser p: 3

   // Card B (mesmo contexto)
   <Card sx={{ p: 3 }}>         // ✅
   ```

3. **Padding diferente em componentes similares**
   ```typescript
   // Dialog 1
   <DialogContent sx={{ p: 2 }}>    // ❌

   // Dialog 2
   <DialogContent sx={{ p: 3 }}>    // ✅
   ```

## Tabela de Referência Rápida

| Contexto                | Desktop | Mobile  | Propriedade    |
|-------------------------|---------|---------|----------------|
| Card padding            | `p: 3`  | `p: 2`  | 24px / 16px    |
| Form field gap          | `spacing: 2.5`     | 20px           |
| Modal padding           | `p: 3`  | `p: 2`  | 24px / 16px    |
| Sidebar container       | `px: 2, py: 2`     | 16px           |
| Button group gap        | `gap: 1`           | 8px            |
| Section separation      | `mt: 2.5` ou `3`   | 20px / 24px    |
| Icon + Text             | `gap: 0.5`         | 4px            |

## Exemplos Práticos

### Card com Conteúdo

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

### Modal com Ações

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

### Grid de Cards

```typescript
<Grid container spacing={2.5}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Card sx={{ p: isMobile ? 2 : 3 }}>
      {/* Content */}
    </Card>
  </Grid>
</Grid>
```

## Verificação Automática

Antes de commit, verifique:

1. ✅ Todos os `p`, `px`, `py`, `m`, `mx`, `my` são múltiplos de 0.5
2. ✅ Cards similares têm o mesmo padding
3. ✅ Gaps são consistentes por tipo de agrupamento
4. ✅ Mobile/Desktop seguem a mesma proporção (geralmente 2 vs 3)

## Exceções Permitidas

**BorderRadius**: 20px (2.5) é o padrão global definido no tema  
**IconSize**: 16px, 18px, 20px, 24px (definidos pelo MUI)  
**LineHeight**: Controlado automaticamente pela tipografia

---

**Última atualização**: Dezembro 2025  
**Mantido por**: Equipe Nix





