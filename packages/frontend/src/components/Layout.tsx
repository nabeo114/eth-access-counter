import React from "react";
import { Container, Box } from "@mui/material";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Container>
      <Box py={4}>{children}</Box>
    </Container>
  );
};

export default Layout;
