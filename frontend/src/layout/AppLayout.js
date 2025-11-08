import { Box, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";
import NavigationMenu from "../components/NavigationMenu";

const AppLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f2f5ff 0%, #f9f4ff 100%)",
        display: "flex",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "flex-start" },
          gap: { xs: 3, lg: 6 },
          px: { xs: 2, md: 4, lg: 7 },
          py: { xs: 3, md: 5 },
        }}
      >
        <NavigationMenu />
        <Box
          sx={{
            flex: 1,
            maxWidth: { lg: 980, xl: 1080 },
            minHeight: { xs: "auto", md: "calc(100vh - 160px)" },
            pb: { xs: 4, md: 6 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
