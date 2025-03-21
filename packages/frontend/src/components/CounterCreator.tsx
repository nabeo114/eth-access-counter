import React, { useState } from "react";
import { Card, CardContent, Button, TextField, Typography, Divider, Alert } from "@mui/material";
import axios from "axios";

const CounterCreator: React.FC = () => {
  const [initCount, setInitCount] = useState<number>(0);
  const [digit, setDigit] = useState<number>(6);
  const [counterId, setCounterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCounter = async () => {
    if (initCount < 0) {
      setError("初期値は 0 以上の値を入力してください。");
      return;
    }

    if (digit < 1 || digit > 8) {
      setError("桁数は 1 以上 8 以下の値を入力してください。");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/create-counter", {
        initCount,
        digit,
      });
      if (response.status === 200) {
        setCounterId(response.data.counterId);
        console.log("カウンター作成成功:", response.data);
        setError(null);
      } else {
        setError("サーバーエラー: カウンター作成に失敗しました。");
      }
    } catch (error) {
      console.error("データの取得に失敗しました:", error);
      setError("カウンター作成に失敗しました。");
    }
  };

  return (
    <Card style={{ maxWidth: 400, margin: "20px auto", padding: "20px" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom align="center">
          アクセスカウンター作成
        </Typography>
        {error && <Alert severity="error" style={{ marginBottom: "20px" }}>{error}</Alert>}
        <TextField
          label="初期値 (0以上)"
          type="number"
          fullWidth
          value={initCount}
          onChange={(e) => setInitCount(Number(e.target.value))}
          margin="normal"
        />
        <TextField
          label="桁数 (1〜8)"
          type="number"
          fullWidth
          value={digit}
          onChange={(e) => setDigit(Number(e.target.value))}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={createCounter}
          style={{ marginTop: "20px" }}
        >
          カウンター作成
        </Button>
        {counterId && (
          <>
          <Divider sx={{ my: 2 }} />
          <div style={{ marginTop: "20px" }}>
            <Typography variant="subtitle1" gutterBottom>
              以下のHTMLタグをコピーして使用してください。  
              Ethereumアドレスをクエリパラメータ（例: `?address=0xYourEthereumAddress`）として渡すと、指定されたアドレスがキリ番を取得した際にNFTが発行されます。
            </Typography>
            <TextField
              value={`<table border="0" cellspacing="0" cellpadding="0"><tr><td align="center"><a href="http://localhost:3000/"><img src="http://localhost:5001/counter/${counterId}/" alt="アクセスカウンター" border="0"></a></td></tr></table>`}
              fullWidth
              multiline
              rows={4}
              InputProps={{
                readOnly: true,
              }}
            />
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Typography variant="subtitle1" gutterBottom>
                プレビュー
              </Typography>
              <img
                src={`http://localhost:5001/counter/${counterId}`}
                alt="アクセスカウンター"
                style={{
                  display: "block",
                  margin: "0 auto",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CounterCreator;
