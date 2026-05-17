import React, { useState } from "react";
import { Box, SxProps, Theme, useTheme } from "@mui/material";
import { CreditCard as CreditCardIcon, AccountBalanceWallet as WalletIcon } from "@mui/icons-material";

interface PaymentMethodIconProps {
  imageUrl?: string;
  colors: { primary: string; secondary: string };
  type?: "card" | "cash";
  size?: number;
  borderRadius?: string;
  iconSize?: number;
  sx?: SxProps<Theme>;
}

const PaymentMethodIcon: React.FC<PaymentMethodIconProps> = ({
  imageUrl,
  colors,
  type,
  size = 40,
  borderRadius = "10px",
  iconSize = 18,
  sx,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [imgError, setImgError] = useState(false);

  const showImage = Boolean(imageUrl && !imgError);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius,
        flexShrink: 0,
        overflow: "hidden",
        background: showImage
          ? "transparent"
          : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx,
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            imageRendering: "-webkit-optimize-contrast",
          }}
          onError={() => setImgError(true)}
        />
      ) : type === "cash" ? (
        <WalletIcon sx={{ color: "#fff", fontSize: iconSize }} />
      ) : (
        <CreditCardIcon sx={{ color: "#fff", fontSize: iconSize }} />
      )}
    </Box>
  );
};

export default PaymentMethodIcon;
