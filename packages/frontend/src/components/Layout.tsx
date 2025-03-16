import React from "react";
import { Container } from "@mui/material";
import Header from "./Header";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Header />
      <Container sx={{ py: 4 }}>{children}</Container>
    </>
  );
};

export default Layout;
