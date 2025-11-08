import { Stack, Typography } from "@mui/material";

export const LogoGlyph = ({ size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="tradeforgeGradientA" x1="8" y1="10" x2="56" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1C62D1" />
        <stop offset="1" stopColor="#8137D0" />
      </linearGradient>
      <linearGradient id="tradeforgeGradientB" x1="16" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8FE1FF" />
        <stop offset="1" stopColor="#E8B7FF" />
      </linearGradient>
    </defs>
    <rect
      x="6"
      y="12"
      width="20"
      height="40"
      rx="10"
      fill="url(#tradeforgeGradientA)"
      opacity="0.92"
    />
    <rect
      x="26"
      y="20"
      width="14"
      height="26"
      rx="7"
      fill="url(#tradeforgeGradientB)"
      opacity="0.85"
    />
    <path
      d="M40 8C50.4934 8 59 16.5066 59 27C59 37.4934 50.4934 46 40 46C29.5066 46 21 37.4934 21 27"
      stroke="url(#tradeforgeGradientA)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.65"
    />
    <circle cx="48" cy="18" r="5" fill="#FFFFFF" opacity="0.9" />
    <circle cx="48" cy="18" r="3" fill="#1C62D1" />
  </svg>
);

const BrandLogo = ({ glyphSize = 44, showText = true }) => (
  <Stack direction="row" spacing={2} alignItems="center">
    <LogoGlyph size={glyphSize} />
    {showText && (
      <Stack spacing={0.2}>
        <Typography variant="h6" fontWeight={800} letterSpacing="0.08em" color="primary.main">
          TRADEFORGE
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Journal IA pour traders
        </Typography>
      </Stack>
    )}
  </Stack>
);

export default BrandLogo;
