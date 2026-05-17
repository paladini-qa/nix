import { test, expect } from "@playwright/test";

test.describe("Transações", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
  });

  test("carrega a página de transações", async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/transactions/);
  });

  test("exibe lista ou estado vazio", async ({ page }) => {
    // Deve mostrar transações existentes OU mensagem de lista vazia
    const hasTransactions = page.locator('table, [data-testid="transaction-item"]');
    const emptyState = page.locator('text=/nenhuma transação/i, text=/sem transações/i, text=/vazio/i');

    await expect(hasTransactions.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("abre o formulário de nova transação", async ({ page }) => {
    const addButton = page
      .locator(
        'button:has-text("Nova"), button:has-text("Adicionar"), button:has-text("+"), [aria-label*="nova transação" i], [aria-label*="adicionar" i]'
      )
      .first();

    await expect(addButton).toBeVisible({ timeout: 5_000 });
    await addButton.click();

    // Aguarda modal/dialog ou formulário abrir
    const form = page.locator('[role="dialog"], [data-testid="transaction-form"]');
    await expect(form).toBeVisible({ timeout: 5_000 });
  });

  test("cria e exclui uma transação de teste", async ({ page }) => {
    const TEST_DESCRIPTION = `[E2E] Teste ${Date.now()}`;

    // Abre formulário
    const addButton = page
      .locator(
        'button:has-text("Nova"), button:has-text("Adicionar"), [aria-label*="nova transação" i], [aria-label*="adicionar" i]'
      )
      .first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Preenche descrição
    const descInput = dialog.locator('input[name="description"], label:has-text("Descrição") >> .. >> input').first();
    await descInput.fill(TEST_DESCRIPTION);

    // Preenche valor
    const amountInput = dialog.locator('input[name="amount"], label:has-text("Valor") >> .. >> input').first();
    await amountInput.fill("99.99");

    // Salva
    const saveButton = dialog.locator('button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")').first();
    await saveButton.click();

    // Verifica que a transação aparece na lista
    await expect(page.locator(`text=${TEST_DESCRIPTION}`)).toBeVisible({ timeout: 10_000 });

    // Exclui a transação criada
    const transactionRow = page.locator(`text=${TEST_DESCRIPTION}`).locator("..");
    const deleteButton = transactionRow
      .locator('button[aria-label*="excluir" i], button[aria-label*="deletar" i], button[aria-label*="remover" i]')
      .first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirma exclusão se houver dialog de confirmação
      const confirmButton = page.locator(
        'button:has-text("Confirmar"), button:has-text("Excluir"), button:has-text("Sim")'
      ).last();
      if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmButton.click();
      }
      await expect(page.locator(`text=${TEST_DESCRIPTION}`)).toHaveCount(0, { timeout: 8_000 });
    }
  });
});
