import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";

// NFTメタデータとNFT画像を保存するディレクトリ（無ければ作成）
const saveDirectory = path.join(__dirname, "..", "assets");
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

// NFTメタデータを生成する非同期関数
export async function generateNFTMetadata(counterId: string, tokenId: string, count: number) {
  try {
    // tokenId を BigInt に変換
    let tokenIdBigInt: bigint;
    if (typeof tokenId === "string") {
      tokenIdBigInt = BigInt(tokenId);
    } else {
      throw new Error("Invalid tokenId: tokenId must be a string.");
    }
    // tokenId が非負整数であるかをチェック
    if (tokenIdBigInt < 0) {
      throw new Error("Invalid tokenId: tokenId must be a non-negative BigInt.");
    }

    const metadata = {
      name: `Sample NFT #${tokenIdBigInt}`,
      description: `This is a sample NFT. You achieved a special milestone with the access counter at number ${count}`,
      image: `http://localhost:5000/assets/image/${counterId}/${tokenIdBigInt}.png`,
    };

    // 指定されたcounterIdのNFTアセットを保存するディレクトリ（無ければ作成）
    const assetDir = path.join(saveDirectory, counterId);
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // 指定されたcounterIdのディレクトリにNFTメタデータを保存
    const metadataPath = path.join(assetDir, `${tokenIdBigInt}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  } catch (error) {
    throw new Error(`Failed to generate NFT metadata: ${(error as Error).message}`);
  }
};

// NFTメタデータを取得する非同期関数
export async function getNFTMetadata(counterId: string, tokenId: string) {
  try {
    // tokenId を BigInt に変換
    let tokenIdBigInt: bigint;
    if (typeof tokenId === "string") {
      tokenIdBigInt = BigInt(tokenId);
    } else {
      throw new Error("Invalid tokenId: tokenId must be a string.");
    }
    // tokenId が非負整数であるかをチェック
    if (tokenIdBigInt < 0) {
      throw new Error("Invalid tokenId: tokenId must be a non-negative BigInt.");
    }

    // 指定されたcounterIdのディレクトリが存在しなければ例外をスロー
    const assetDir = path.join(saveDirectory, counterId);
    if (!fs.existsSync(assetDir)) {
      throw new Error(`Directory ${assetDir} does not exist.`);
    }

    // 指定されたcounterIdのディレクトリにNFTメタデータが存在しなければ例外をスロー
    const metadataPath = path.join(assetDir, `${tokenIdBigInt}.json`);
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Metadata for tokenId ${tokenIdBigInt} not found.`);
    }

    // NFTメタデータファイルを読み込んで返す
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return metadata;
  } catch (error) {
    throw new Error(`Failed to get NFT metadata: ${(error as Error).message}`);
  }
}

// NFT画像を生成する非同期関数
export async function generateNFTImage(counterId: string, tokenId: string, count: number, digit: number) {
  try {
    // tokenId を BigInt に変換
    let tokenIdBigInt: bigint;
    if (typeof tokenId === "string") {
      tokenIdBigInt = BigInt(tokenId);
    } else {
      throw new Error("Invalid tokenId: tokenId must be a string.");
    }
    // tokenId が非負整数であるかをチェック
    if (tokenIdBigInt < 0) {
      throw new Error("Invalid tokenId: tokenId must be a non-negative BigInt.");
    }

    // 指定されたcounterIdのNFTアセットを保存するディレクトリ（無ければ作成）
    const assetDir = path.join(saveDirectory, counterId);
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // 指定されたcounterIdのディレクトリにNFT画像を生成して保存
    const imagePath = path.join(assetDir, `${tokenIdBigInt}.png`);
    // 動的にキャンバスサイズとフォントサイズを計算
    const canvasSize = 400; // キャンバスサイズ
    // canvasを生成
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext("2d");
    // 背景をグラデーションに設定
    const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    gradient.addColorStop(0, "#89f7fe");
    gradient.addColorStop(1, "#66a6ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    // 中央に円形装飾
//    ctx.beginPath();
//    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 3, 0, Math.PI * 2);
//    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
//    ctx.fill();
    // メインメッセージのテキスト
    const mainMessage = "Congratulations!";
    const subMessage = `You are the ${count.toLocaleString()}th visitor!`;
    // メインメッセージを描画
    ctx.font = "bold 32px 'Arial'";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mainMessage, canvasSize / 2, canvasSize / 2 - 40);
    // サブメッセージを描画
    ctx.font = "24px 'Arial'";
    ctx.fillText(subMessage, canvasSize / 2, canvasSize / 2 + 10);
    // トークンID情報を下部に表示
    const tokenInfo = `Token ID: ${tokenIdBigInt}`;
    ctx.font = "18px 'Arial'";
    ctx.fillStyle = "#dddddd";
    ctx.fillText(tokenInfo, canvasSize / 2, canvasSize - 30);
    // 星の装飾
//    const starCount = 5;
//    for (let i = 0; i < starCount; i++) {
//      const x = Math.random() * canvasSize;
//      const y = Math.random() * canvasSize;
//      const size = Math.random() * 10 + 5;
//      ctx.beginPath();
//      ctx.arc(x, y, size, 0, Math.PI * 2);
//      ctx.fillStyle = `rgba(255, 255, 0, ${Math.random()})`;
//      ctx.fill();
//    }

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imagePath, buffer);

    return imagePath;
  } catch (error) {
    throw new Error(`Failed to generate NFT image: ${(error as Error).message}`);
  }
}

// NFT画像を取得する非同期関数
export async function getNFTImage(counterId: string, imageFile: string) {
  try {
    // 指定されたcounterIdのディレクトリが存在しなければ例外をスロー
    const assetDir = path.join(saveDirectory, counterId);
    if (!fs.existsSync(assetDir)) {
      throw new Error(`Directory ${assetDir} does not exist.`);
    }

    // 指定されたcounterIdのディレクトリにNFT画像が存在しなければ例外をスロー
    const imagePath = path.join(assetDir, imageFile);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file ${imageFile} not found.`);
    }

    return fs.readFileSync(imagePath);
  } catch (error) {
    throw new Error(`Failed to get NFT metadata: ${(error as Error).message}`);
  }
}

module.exports = {
  generateNFTMetadata,
  getNFTMetadata,
  generateNFTImage,
  getNFTImage,
};
