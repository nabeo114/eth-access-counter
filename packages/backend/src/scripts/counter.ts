import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createCanvas } from "canvas";
import { compileContracts, deployContract, mintNFT } from "./contract";
import { generateNFTMetadata, generateNFTImage } from "./asset";
//import { DynamoDB } from "aws-sdk";

// DynamoDBを使うためのクライアント
//const dynamoDb = new DynamoDB.DocumentClient();

// カウンタ情報を保存するディレクトリ（無ければ作成）
const saveDirectory = path.join(__dirname, "..", "data");
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

// カウンタ情報を保存するファイル
const counterDataFilePath = path.join(saveDirectory, "counter.json");

// 環境に応じて保存先を切り替える
const isLocal = process.env.ENV === 'local';

// カウンタ情報の型
export interface CounterData {
  counterId: string;
  counter: {
    count: number;
    digit: number;
    milestoneType: string;
  }
  contract: {
    address: string;
    abi: any;
    bytecode: string;
  };
  design: {
    counter: any;
    nft: any;
  };
  lastAccessIp: string | null;
  updatedAt: number;
}

// アクセスカウンタを生成する非同期関数
export async function createCounter(initialCounter: CounterData): Promise<{ counterId: string }> {
  try {
    let existingData: CounterData[] = [];

    // ファイルが存在すればデータを読み込む
    if (fs.existsSync(counterDataFilePath)) {
      const fileContent = fs.readFileSync(counterDataFilePath, "utf-8");
      existingData = JSON.parse(fileContent) as CounterData[];
    }

    // UUIDでカウンタIDを生成
    const counterId = uuidv4();

    // コントラクトのコンパイル
//    await compileContracts();

    // コントラクトをデプロイ
//    await deployContract(counterId, "MyNFT");

    const counterData: CounterData = {
      counterId: counterId,
      counter: initialCounter.counter,
      contract: initialCounter.contract,
      design: initialCounter.design,
      lastAccessIp: null,
      updatedAt: Math.floor(Date.now() / 1000),
    };

    // 既存データに新しいカウンタ情報を追加してファイルに保存
    existingData.push(counterData);
    fs.writeFileSync(counterDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");

    return { counterId: counterId };
  } catch (error) {
    throw new Error(`Failed to create counter: ${(error as Error).message}`);
  }
};

// キリ番を判定する関数
function isMilestoneNumber(num: number) {
//  if (num < 100) return false; // 100未満は対象外
  if (num < 10) return false;

  const numStr = num.toString();
  const rest = numStr.slice(1); // 最上位の桁を除いた残りの部分

  // 例: 100, 5000, 700000 のような数か、ゾロ目か
  return rest.length > 0 && /^0+$/.test(rest) || /^(\d)\1+$/.test(numStr);
}

// カウンタをインクリメントする非同期関数
export async function incrementCount(counterId: string, accessIp: string, address: string): Promise<{ count: number, digit: number, nftMinted: boolean }> {
  try {
    // ファイルが存在しなければ例外をスロー
    if (!fs.existsSync(counterDataFilePath)) {
      throw new Error("Counter data file does not exist");
    }

    console.log({ counterId, accessIp, address });

    const fileContent = fs.readFileSync(counterDataFilePath, "utf-8");
    const existingData = JSON.parse(fileContent) as CounterData[];

    // 指定されたcounterIdのカウンタ情報を取得（無ければ、例外をスロー）
    const counterData = existingData.find((item) => item.counterId === counterId);
    if (!counterData) {
      throw new Error(`Counter data with ID ${counterId} not found`);
    }

    // 最後にアクセスしたIPアドレスと異なる場合はカウンタをインクリメントし、カウンタ情報を更新
//    if (counterData.lastAccessIp !== accessIp) {
      counterData.counter.count++;
      counterData.lastAccessIp = accessIp;
      counterData.updatedAt = Math.floor(Date.now() / 1000);
//    }

  let nftMinted = false;

    // addressが有効でカウンタがキリ番であれば、NFTの処理を実行
    if (address && isMilestoneNumber(counterData.counter.count)) {
      try {
        const tokenId = await mintNFT(counterId, address);
        console.log(`NFT minted! Token ID: ${tokenId} for address ${address}`);

        // NFTアセットを作成
        generateNFTMetadata(counterId, tokenId, counterData.counter.count);
        generateNFTImage(counterId, tokenId, counterData.counter.count, counterData.counter.digit);

        nftMinted = true; // NFT発行成功
      } catch (nftError) {
        console.error(`Failed to mint NFT: ${(nftError as Error).message}`);
      }
    }

    // 更新したデータをファイルに保存
    fs.writeFileSync(counterDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");

    console.log(counterData.counter.count);

    return { count: counterData.counter.count, digit: counterData.counter.digit, nftMinted };
  } catch (error) {
    throw new Error(`Failed to increment count: ${(error as Error).message}`);
  }
};

// カウンタ画像を取得する非同期関数
export async function getCounterImage(count: number, digit: number, nftMinted: boolean): Promise<Buffer> {
  try {
    // カウントを桁数に合わせてゼロ埋め
    const formattedCount = count.toString().padStart(digit, "0");

    // 動的にキャンバスサイズとフォントサイズを計算
    const fontSize = 20; // 基本フォントサイズ
    const padding = 10; // 上下左右の余白
    const ctx = createCanvas(1, 1).getContext("2d"); // 仮のCanvasでテキスト幅を測定
    ctx.font = `${fontSize}px Arial`;

    // カウンタの幅を計算
    const countTextWidth = ctx.measureText(formattedCount).width;

    // NFTメッセージの幅を計算
    const nftMessage = "You got NFT!";
    const nftTextWidth = ctx.measureText(nftMessage).width;

    // 幅はカウンタ文字列とNFTメッセージの大きい方に合わせる
    const canvasWidth = Math.max(countTextWidth, nftTextWidth) + padding * 2;

    // 高さを計算（NFTメッセージがある場合は2行分のスペース）
    let canvasHeight = fontSize + padding * 2;
    if (nftMinted) {
      canvasHeight += fontSize * 1.5 + padding;
    }

    // canvasを生成
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx2 = canvas.getContext("2d");
  
    // 背景を白に設定
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, canvasWidth, canvasHeight);
  
    // カウントを黒色で描画
    ctx2.fillStyle = "#000000";
    ctx2.font = `${fontSize}px Arial`;
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(formattedCount, canvasWidth / 2, fontSize);

    // NFT発行時のメッセージを追加
    if (nftMinted) {
      ctx2.fillStyle = "#ff0000"; // 赤色
      ctx2.font = `${fontSize * 0.8}px Arial`; // 少し小さめのフォント
      ctx2.fillText(nftMessage, canvasWidth / 2, fontSize * 2.2);
    }

    // 画像データをバッファとして取得
    const counterImage = canvas.toBuffer("image/png");
    return counterImage;
  } catch (error) {
    throw new Error(`Failed to get counter image: ${(error as Error).message}`);
  }
};

module.exports = {
  createCounter,
  incrementCount,
  getCounterImage,
};
