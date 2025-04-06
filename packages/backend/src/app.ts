import express, { Request, Response } from "express";
import cors from "cors";
import { generateNonce, SiweMessage } from "siwe";
import { CounterData, createCounter, incrementCount, getCounterImage } from "./scripts/counter";
import { getNFTMetadata, getNFTImage } from "./scripts/asset";

const app = express();
app.use(express.json());
// デフォルトのCORS設定（認証不要API用）
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
// 認証が必要なAPIのCORS設定
const corsOptionsWithCredentials = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};
// CORSミドルウェア（認証が必要なAPIを動的に設定）
app.use((req, res, next) => {
  if (req.path.startsWith("/signin")) {
    cors(corsOptionsWithCredentials)(req, res, next);
  } else {
    cors(corsOptions)(req, res, next);
  }
});
const port = process.env.PORT || 5001;

app.get("/signin/nonce", async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    res.json({nonce});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/signin/verify", async (req: Request, res: Response) => {
  const { message, signature } = req.body;
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// アクセスカウンタを作成するエンドポイント
app.post("/create-counter", async (req: Request, res: Response) => {
  const {
    counter: { initialCount, digitCount, milestoneType },
    contract: { address, abi, bytecode },
    design: { counter, nft },
  } = req.body;

  // initialCount と digitCount を number に変換
  const initialCountNum = Number(initialCount);
  const digitCountNum = Number(digitCount);

  // 数値に変換できない場合はエラーレスポンスを返す
  if (isNaN(initialCountNum) || isNaN(digitCountNum)) {
    res.status(400).json({ error: "initCount and digit must be valid numbers" });
    return;
  }

  const counterData: CounterData = {
    counterId: "",  // ここではまだ生成していないので空文字列としておく
    counter: {
      count: initialCountNum,
      digit: digitCountNum,
      milestoneType,
    },
    contract: {
      address,
      abi,
      bytecode,
    },
    design: {
      counter,
      nft,
    },
    lastAccessIp: null,
    updatedAt: 0,  
  };

  try {
    // アクセスカウンタを生成
    const counterId = await createCounter(counterData);
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

// ローカル開発用にサーバーを起動（Lambda 環境では不要）
if (process.env.NODE_ENV !== "lambda") {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app;
