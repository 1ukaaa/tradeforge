import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, lighten } from "@mui/material/styles";

const defaultMeta = [];

export const ForgeCard = ({
  title,
  subtitle,
  helper,
  actions,
  children,
  variant = "default",
  glow = false,
  ...paperProps
}) => (
  <Paper
    {...paperProps}
    sx={{
      p: { xs: 2.5, md: 3 },
      display: "flex",
      flexDirection: "column",
      gap: 2,
      backgroundImage: (theme) =>
        variant === "glass"
          ? theme.forge.gradients.card
          : variant === "alert"
          ? theme.forge.gradients.warning
          : theme.forge.gradients.card,
      borderColor: (theme) =>
        variant === "alert"
          ? alpha(theme.palette.error.main, 0.6)
          : alpha("#FFFFFF", 0.1),
      boxShadow: (theme) => (glow ? theme.forge.shadows.glow : "none"),
      position: "relative",
      overflow: "hidden",
      ...paperProps.sx,
    }}
  >
    {(title || helper || actions) && (
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Stack spacing={0.5}>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.2em" }}>
              {subtitle}
            </Typography>
          )}
          {title && (
            <Typography variant="h6" color="text.primary">
              {title}
            </Typography>
          )}
          {helper && (
            <Typography variant="body2" color="text.secondary">
              {helper}
            </Typography>
          )}
        </Stack>
        {actions && <Box>{actions}</Box>}
      </Stack>
    )}
    {children}
  </Paper>
);

export const PageHero = ({ eyebrow, title, description, actions, meta = defaultMeta, illustration }) => (
  <Box
    sx={{
      p: { xs: 3, md: 4 },
      borderRadius: 4,
      background: (theme) => theme.forge.gradients.hero,
      border: (theme) => `1px solid ${alpha("#FFFFFF", 0.12)}`,
      boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {illustration && (
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -60,
          opacity: 0.12,
          pointerEvents: "none",
        }}
      >
        {illustration}
      </Box>
    )}
    <Stack spacing={2} maxWidth={{ xs: "100%", md: "65%" }}>
      {eyebrow && (
        <Chip
          size="small"
          label={eyebrow}
          sx={{
            alignSelf: "flex-start",
            bgcolor: alpha("#74F6D6", 0.18),
            color: "#74F6D6",
            fontWeight: 600,
            letterSpacing: "0.3em",
          }}
        />
      )}
      {title && (
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          {description}
        </Typography>
      )}
      {actions && <Stack direction="row" spacing={2}>{actions}</Stack>}
    </Stack>

    {meta.length > 0 && (
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          mt: { xs: 3, md: 4 },
        }}
      >
        {meta.map(({ label, value, trend }, index) => (
          <Box
            key={`${label}-${index}`}
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 3,
              border: (theme) => `1px solid ${alpha("#FFFFFF", 0.12)}`,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha("#FFFFFF", 0.06)}, ${alpha(theme.palette.background.paper, 0.7)})`,
            }}
          >
            <Typography variant="overline" color="text.secondary" letterSpacing="0.2em">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                color={
                  typeof trend === "string"
                    ? trend.trim().startsWith("+")
                      ? "success.light"
                      : trend.trim().startsWith("-")
                      ? "error.light"
                      : "text.secondary"
                    : "text.secondary"
                }
              >
                {trend}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    )}
  </Box>
);

export const MetricBadge = ({ label, value, tone = "neutral" }) => (
  <Stack spacing={0.5} sx={{ minWidth: 140 }}>
    <Typography variant="caption" color="text.secondary" letterSpacing="0.25em">
      {label}
    </Typography>
    <Box
      sx={{
        px: 2,
        py: 1,
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha("#FFFFFF", 0.1)}`,
        background: (theme) =>
          tone === "alert"
            ? theme.forge.gradients.warning
            : tone === "positive"
            ? `linear-gradient(120deg, ${alpha("#74F6D6", 0.25)}, ${alpha("#4AC9FF", 0.1)})`
            : alpha("#FFFFFF", 0.04),
        color: tone === "alert" ? lighten("#F15A29", 0.1) : "#F4F6FF",
      }}
    >
      <Typography variant="h5">{value}</Typography>
    </Box>
  </Stack>
);

export const SectionHeading = ({ label, description }) => (
  <Stack spacing={0.5}>
    <Typography variant="overline" color="text.secondary" letterSpacing="0.4em">
      {label}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    )}
  </Stack>
);
