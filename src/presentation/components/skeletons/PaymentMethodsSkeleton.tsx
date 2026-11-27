import { Box, Skeleton } from "@mui/material";

export default function PaymentMethodsSkeleton() {
  return (
    <Box role="status" aria-label="Carregando métodos de pagamento" sx={{ px: { xs: 0, md: 3 }, display: "grid", gap: 2 }}>
      <Skeleton variant="text" width={245} height={42} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1, md: 2.5 } }}>
        {[1, 2, 3, 4].map((card) => (
          <Skeleton key={card} variant="rounded" height={94} sx={{ borderRadius: "var(--radius-card)" }} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={338} sx={{ borderRadius: "var(--radius-card)" }} />
      <Skeleton variant="rounded" height={252} sx={{ borderRadius: "var(--radius-card)" }} />
    </Box>
  );
}
