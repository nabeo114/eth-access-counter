import React, { useState } from "react";
import { Card, CardContent, Typography, Alert } from "@mui/material";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import axios from "axios";
import { MetamaskProvider } from "./contexts/MetamaskContext";
import AppLayout from "./components/AppLayout";
import Home from "./components/Home";

const CounterDisplay: React.FC = () => {
  const { counterId } = useParams<{ counterId: string }>();
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/counter/${counterId}`);
        if (response.status === 200) {
          setCount(response.data.count);
        } else {
          setError("カウンター情報の取得に失敗しました。");
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
        setError("カウンター情報の取得に失敗しました。");
      }
    };
    fetchCount();
  }, [counterId]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (count === null) {
    return <Typography>読み込み中...</Typography>;
  }

  return (
    <Card style={{ maxWidth: 400, margin: "20px auto", padding: "20px" }}>
      <CardContent>
        <Typography variant="h5" align="center">
          アクセスカウンター
        </Typography>
        <Typography variant="h6" align="center" style={{ marginTop: "20px" }}>
          現在のカウント: {count}
        </Typography>
      </CardContent>
    </Card>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <MetamaskProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:counterId" element={<CounterDisplay />} />
          </Routes>
        </AppLayout>
      </MetamaskProvider>
    </Router>
  );
};

export default App;
