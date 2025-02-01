import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createCounter, incrementCount, getCounterImage } from "./scripts/counter";
import { getNFTMetadata, getNFTImage } from "./scripts/asset";

const app = express();
const port = 5000;

app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

// アクセスカウンタを作成するエンドポイント
app.post("/create-counter", async (req: Request, res: Response) => {
  const { initCount, digit } = req.body;

  // initCount と digit を number に変換
  const initCountNum = Number(initCount);
  const digitNum = Number(digit);

  // 数値に変換できない場合はエラーレスポンスを返す
  if (isNaN(initCountNum) || isNaN(digitNum)) {
    res.status(400).json({ error: "initCount and digit must be valid numbers" });
    return;
  }

  try {
    // アクセスカウンタを生成
    const counterId = await createCounter(initCountNum, digitNum);
    res.json(counterId);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// カウンタ画像を取得するエンドポイント
app.get("/counter/:counterId", async (req: Request, res: Response) => {
  const { counterId } = req.params;
  const { address } = req.query;

  // counterId が存在しない場合はエラーレスポンスを返す
  if (!counterId || typeof counterId !== "string") {
    res.status(400).json({ error: "Counter ID must be a valid string" });
    return;
  }

  // address が存在しない場合でもエラーにはしない（存在する場合のみNFTを発行する）

  // IPアドレスを取得
  const accessIp =
    req.headers["x-forwarded-for"]?.toString() ||
    req.socket.remoteAddress ||
    "unknown";

  try {
    // カウンタをインクリメント
    const { count, digit, nftMinted } = await incrementCount(counterId, accessIp, address as string);

    // カウンタ画像を取得
    const imageData = await getCounterImage(count, digit, nftMinted);
    res.setHeader("Content-Type", "image/png");
    res.send(imageData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// NFTメタデータを取得するエンドポイント
app.get("/assets/metadata/:counterId/:tokenId", async (req: Request, res: Response) => {
  const { counterId, tokenId } = req.params;

  try {
    const metadata = await getNFTMetadata(counterId, tokenId);
    if (!metadata) {
      res.status(404).json({ error: "Metadata not found" });
      return;
    }
    res.json(metadata);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// NFT画像データを取得するエンドポイント
app.get("/assets/image/:counterId/:imageFile", async (req: Request, res: Response) => {
  const { counterId, imageFile } = req.params;

  try {
    const imageData = await getNFTImage(counterId, imageFile);
    if (!imageData) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.setHeader("Content-Type", "image/png");
    res.send(imageData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
