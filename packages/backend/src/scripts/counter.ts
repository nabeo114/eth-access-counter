import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { createCanvas } from "canvas";
import { compileContracts, deployContract, mintNFT } from "./contract";
import { generateNFTMetadata, generateNFTImage } from "./asset";

// Memo: 将来的に、カウンタ情報はDB(AWSであればDynamoDBなど)に保存したほうが良いかも
// カウンタ情報を保存するディレクトリ（無ければ作成）
const saveDirectory = path.join(__dirname, "..", "data");
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

// カウンタ情報を保存するファイル
const counterDataFilePath = path.join(saveDirectory, "counter.json");

// カウンタ情報の型
interface CounterData {
  counterId: string;
  count: number;
  digit: number;
  lastAccessIp: string | null;
  updated: number;
  // Memo: 将来的に、カウンタのデザインも選択できるようにしても良いかも
}

// アクセスカウンタを生成する非同期関数
export async function createCounter(initCount: number, digit: number): Promise<{ counterId: string }> {
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
    await compileContracts();

    // コントラクトをデプロイ
    await deployContract(counterId, "MyNFT");

    const counterData: CounterData = {
      counterId: counterId,
      count: initCount,
      digit: digit,
      lastAccessIp: null,
      updated: Math.floor(Date.now() / 1000),
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
  if (num < 100) return false; // 100未満は対象外

  const numStr = num.toString();
  const firstDigit = numStr[0];  // 最上位の桁
  const rest = numStr.slice(1);  // 残りの桁

  // 例: 100, 5000, 700000 のような数か、ゾロ目か
  return /^0+$/.test(rest) || /^(\d)\1+$/.test(numStr);
}

// カウンタをインクリメントする非同期関数
export async function incrementCount(counterId: string, accessIp: string, address: string): Promise<{ count: number, digit: number }> {
  try {
    // ファイルが存在しなければ例外をスロー
    if (!fs.existsSync(counterDataFilePath)) {
      throw new Error("Counter data file does not exist");
    }

    console.log(counterId);
    console.log(accessIp);
    console.log(address);

    const fileContent = fs.readFileSync(counterDataFilePath, "utf-8");
    const existingData = JSON.parse(fileContent) as CounterData[];

    // 指定されたcounterIdのカウンタ情報を取得（無ければ、例外をスロー）
    const counterData = existingData.find((item) => item.counterId === counterId);
    if (!counterData) {
      throw new Error(`Counter data with ID ${counterId} not found`);
    }

    // 最後にアクセスしたIPアドレスと異なる場合はカウンタをインクリメントし、カウンタ情報を更新
//    if (counterData.lastAccessIp !== accessIp) {
      counterData.count++;
      counterData.lastAccessIp = accessIp;
      counterData.updated = Math.floor(Date.now() / 1000);
//    }

    // T.B.D addressが有効でカウンタがキリ番であれば、NFTの処理を実行
    if (address && isMilestoneNumber(counterData.count)) {
      try {
        const tokenId = await mintNFT(counterId, address);
        console.log(`NFT minted! Token ID: ${tokenId} for address ${address}`);

        // NFTアセットを作成
        generateNFTMetadata(counterId, tokenId, counterData.count);
        generateNFTImage(counterId, tokenId, counterData.count, counterData.digit);
      } catch (nftError) {
        console.error(`Failed to mint NFT: ${(nftError as Error).message}`);
      }
    }

    // 更新したデータをファイルに保存
    fs.writeFileSync(counterDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");

    console.log(counterData.count);

    return { count: counterData.count, digit: counterData.digit };
  } catch (error) {
    throw new Error(`Failed to increment count: ${(error as Error).message}`);
  }
};

// カウンタ画像を取得する非同期関数
export async function getCounterImage(count: number, digit: number): Promise<Buffer> {
  try {
    // カウントを桁数に合わせてゼロ埋め
    const formattedCount = count.toString().padStart(digit, "0");

    // 動的にキャンバスサイズとフォントサイズを計算
    const fontSize = 20; // 基本フォントサイズ
    const padding = 4; // 上下左右の余白
    const textWidth = formattedCount.length * fontSize * 0.6; // 文字幅の目安
    const canvasWidth = textWidth + padding * 2;
    const canvasHeight = fontSize + padding * 2;

    // canvasを生成
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
  
    // 背景を白に設定
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
    // カウントを黒色で描画
    ctx.fillStyle = "#000000";
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formattedCount, canvasWidth / 2, canvasHeight / 2);

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
