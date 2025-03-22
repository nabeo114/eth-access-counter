import React from "react";
import { Container, Box } from "@mui/material";
import Header from "./Header";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box component="main" flexGrow={1} py={4} sx={{ marginTop: '64px' }}>
        <Container>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;
