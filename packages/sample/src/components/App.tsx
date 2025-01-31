import React from "react";
import { Container, Box, Card, CardContent, Typography } from "@mui/material";
import Metamask from "./Metamask";

const App: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5 }}>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom align="center">Sample App</Typography>
            <Metamask />
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default App;
