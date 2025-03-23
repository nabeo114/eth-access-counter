import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Button, TextField, Typography, FormControl, FormLabel, FormControlLabel, Radio, RadioGroup, Divider, Alert } from "@mui/material";
import axios from "axios";
import { useMetamask } from "../contexts/MetamaskContext";
import { deployContract } from "../scripts/deploy";

import nftType1ContractJson from "../contracts/MyNFT.json";

const MAX_DIGIT = 10;

const CounterCreator: React.FC = () => {
  const { signer, isAuthenticated } = useMetamask();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [initCount, setInitCount] = useState<number>(0);
  const [digit, setDigit] = useState<number>(6);
  const [counterDesign, setCounterDesign] = useState<string>("");
  const [nftType, setNftType] = useState<string>("nft");
  const [nftDesign, setNftDesign] = useState<string>("");
  const [milestoneNumberType, setMilestoneNumberType] = useState<string>("");
  const [counterId, setCounterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setAccountAddress(address);
      }
    };

    fetchAccount();
  }, [signer]);

  const getContractJson = () => {
    if (nftType === "nft") {
      return nftType1ContractJson;
    } else if (nftType === "sbt") {
      return nftType1ContractJson;
    }

    return nftType1ContractJson;
  };

  const createCounter = async () => {
    if (!isAuthenticated || !signer || !accountAddress) {
      setError("Metamask でサインインしてください。");
      return;
    }

    if (initCount < 0) {
      setError("初期値は 0 以上の値を入力してください。");
      return;
    }

    if (digit < 1 || digit > MAX_DIGIT) {
      setError(`桁数は 1 以上 ${MAX_DIGIT} 以下の値を入力してください。`);
      return;
    }

    if (!counterDesign) {
      setError("デザインを選択してください。");
      return;
    }

    if (!nftType) {
      setError("タイプを選択してください。");
      return;
    }

    if (!nftDesign) {
      setError("デザインを選択してください。");
      return;
    }

    if (!milestoneNumberType) {
      setError("タイプを選択してください。");
      return;
    }

    try {
      const contractJson = getContractJson();
      const { contractAddress }  = await deployContract(contractJson, signer, [accountAddress]);

      const response = await axios.post("http://localhost:5001/create-counter", {
        initCount,
        digit,
        counterDesign,
        contractAddress,
        abi: contractJson.abi,
        bytecode: contractJson.bytecode,
        nftDesign,
        milestoneNumberType,
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
    <Card style={{ maxWidth: 600, margin: "20px auto", padding: "20px" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom align="center">
          アクセスカウンター作成
        </Typography>
        {error && <Alert severity="error" style={{ marginBottom: "20px" }}>{error}</Alert>}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="初期値 (0以上)"
            type="number"
            fullWidth
            value={initCount}
            onChange={(e) => setInitCount(Number(e.target.value))}
            margin="normal"
          />
          <TextField
            label={`桁数 (1〜${MAX_DIGIT})`}
            type="number"
            fullWidth
            value={digit}
            onChange={(e) => setDigit(Number(e.target.value))}
            margin="normal"
          />
        </Box>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">デザイン</FormLabel>
          <RadioGroup 
            row
            value={counterDesign}
            onChange={(e) => setCounterDesign(e.target.value)}
          >
            <FormControlLabel value="design1" control={<Radio />} label="デザイン 1" />
            <FormControlLabel value="design2" control={<Radio />} label="デザイン 2" />
            <FormControlLabel value="design3" control={<Radio />} label="デザイン 3" />
          </RadioGroup>
        </FormControl>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">タイプ</FormLabel>
          <RadioGroup 
            row
            value={nftType}
            onChange={(e) => setNftType(e.target.value)}
          >
            <FormControlLabel value="nft" control={<Radio />} label="タイプ 1" />
            <FormControlLabel value="sbt" control={<Radio />} label="タイプ 2" />
          </RadioGroup>
        </FormControl>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">デザイン</FormLabel>
          <RadioGroup 
            row
            value={nftDesign}
            onChange={(e) => setNftDesign(e.target.value)}
          >
            <FormControlLabel value="design1" control={<Radio />} label="デザイン 1" />
            <FormControlLabel value="design2" control={<Radio />} label="デザイン 2" />
            <FormControlLabel value="design3" control={<Radio />} label="デザイン 3" />
          </RadioGroup>
        </FormControl>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">タイプ</FormLabel>
          <RadioGroup 
            row
            value={milestoneNumberType}
            onChange={(e) => setMilestoneNumberType(e.target.value)}
          >
            <FormControlLabel value="type1" control={<Radio />} label="タイプ 1" />
            <FormControlLabel value="type2" control={<Radio />} label="タイプ 2" />
          </RadioGroup>
        </FormControl>
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
              Ethereumアドレスをクエリパラメータ（例: `?address=0xVisitorsEthereumAddress`）として渡すと、指定されたアドレスがキリ番を取得した際にNFTが発行されます。
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
