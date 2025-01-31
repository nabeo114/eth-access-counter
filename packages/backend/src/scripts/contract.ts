import fs from "fs";
import path from "path";
import dotenv from "dotenv";
//import { ethers } from "hardhat";
import { ethers } from "ethers";
import hre from "hardhat";

dotenv.config();

// コントラクトのJSONファイルのパス
const contractJsonPath = path.join(__dirname, "..", "..", "artifacts", "contracts", "MyNFT.sol", "MyNFT.json");

// contractJsonData の読み込みを安全に行う
let contractJsonData: any = null;
if (fs.existsSync(contractJsonPath)) {
  contractJsonData = require(contractJsonPath);
} else {
  console.warn("Warning: Contract JSON file does not exist. Run compileContracts() first.");
}

// Memo: 将来的に、コントラクト情報はDB(AWSであればDynamoDBなど)に保存したほうが良いかも
// コントラクト情報を保存するディレクトリ（無ければ作成）
const saveDirectory = path.join(__dirname, "..", "data");
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

// コントラクト情報を保存するファイル
const contractDataFilePath = path.join(saveDirectory, "contract.json");

// コントラクト情報の型
interface ContractData {
  counterId: string;
  contractAddress: string | null;
  transactionHash: string | null;
  abi: string;
}

// プロバイダーURLの設定（環境変数からInfuraのAPIキーを取得）
const providerUrl = `https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`;

// Hardhatを使用してスマートコントラクトをコンパイルする関数
export async function compileContracts() {
  try {
    console.log("Starting compilation...");

    // Hardhatが提供する "compile" タスクを実行
    await hre.run("compile");

    console.log("Contracts compiled successfully.");
  } catch (error) {
    throw new Error(`Failed to compile contract: ${(error as Error).message}`);
  }
};

// コントラクトをデプロイする非同期関数
export async function deployContract(counterId: string, contractName: string) {
  try {
    if (!fs.existsSync(contractJsonPath)) {
      throw new Error(`Contract JSON file not found. Run compileContracts() first.`);
    }

    // コンパイル後に改めてロード
    contractJsonData = require(contractJsonPath);

    let existingData: ContractData[] = [];

    // ファイルが存在すればデータを読み込む
    if (fs.existsSync(contractDataFilePath)) {
      const fileContent = fs.readFileSync(contractDataFilePath, "utf-8");
      existingData = JSON.parse(fileContent) as ContractData[];
    }

    // 指定されたcounterIdのコントラクト情報が存在すれば例外をスロー
    if (existingData.some((data) => data.counterId === counterId)) {
      throw new Error(`Contract with counterId ${counterId} is already deployed.`);
    }

    console.log(`Starting deployment of ${contractName}...`);

    // 環境変数から秘密鍵を取得（無ければ例外をスロー）
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Private key not found in environment variables.");
    }

    // プロバイダーを設定
    const provider = new ethers.JsonRpcProvider(providerUrl);

    // ウォレットを作成（秘密鍵とプロバイダーを関連付け）
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // コントラクトのファクトリを作成
    const contractFactory = new ethers.ContractFactory(contractJsonData.abi, contractJsonData.bytecode, wallet);

    // 最大ガス料金と最大優先料金を設定（EIP-1559対応）
    const maxFeePerGas = ethers.parseUnits("40", "gwei"); // 最大料金（40 gweiに設定）
    const maxPriorityFeePerGas = ethers.parseUnits("30", "gwei"); // 優先料金（30 gweiに設定）

    // コントラクトのデプロイに必要なガス量を見積もり
    const gasEstimate = await provider.estimateGas({
      to: "0x0000000000000000000000000000000000000000", // 送信先アドレスはダミー（見積もり用）
      data: contractJsonData.bytecode // コントラクトのバイトコード
    });
    console.log(`Estimated Gas: ${gasEstimate.toString()}`);

    // コントラクトをデプロイ
    const contract = await contractFactory.deploy(wallet.address, {
      maxFeePerGas, // 最大ガス料金
      maxPriorityFeePerGas, // 最大優先料金
    });
    console.log("Contract deployment transaction sent.");

    // デプロイ完了まで待機
    await contract.waitForDeployment();
    console.log("Contract deployed.");

    // トランザクションのレシートを取得
    const txReceipt = await contract.deploymentTransaction()!.wait();
    console.log(`Contract deployed at address: ${txReceipt!.contractAddress}`);
    console.log(`Transaction hash: ${txReceipt!.hash}`);

    // コントラクトのABIを取得
    const contractABI = JSON.stringify(contractJsonData.abi, null, 2);

    const contractData = {
      counterId: counterId,
      contractAddress: txReceipt!.contractAddress,
      transactionHash: txReceipt!.hash,
      abi: contractABI,
    };

    // 既存データに新しいコントラクト情報を追加してファイルに保存
    existingData.push(contractData);
    fs.writeFileSync(contractDataFilePath, JSON.stringify(existingData, null, 2), "utf-8");

    return contractData;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to deploy ${contractName} contract: ${(error as Error).message}`);
  }
};

// コントラクトオブジェクトを生成する非同期関数
async function getContract(counterId: string) {
  try {
    // ファイルが存在しなければ例外をスロー
    if (!fs.existsSync(contractDataFilePath)) {
      throw new Error("Contract data file does not exist");
    }

    const fileContent = fs.readFileSync(contractDataFilePath, "utf-8");
    const existingData = JSON.parse(fileContent) as ContractData[];

    // 指定されたcounterIdのコントラクト情報を取得（無ければ、例外をスロー）
    const contractData = existingData.find((item) => item.counterId === counterId);
    if (!contractData) {
      throw new Error(`Contract data with ID ${counterId} not found`);
    }

    // contractAddress が null の場合は null を返す
    if (!contractData.contractAddress) {
      console.warn(`Contract address is null for counterId ${counterId}`);
      return null;
    }

    // 環境変数から秘密鍵を取得（無ければ例外をスロー）
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Private key not found in environment variables.");
    }

    // ウォレットを作成
    const wallet = new ethers.Wallet(privateKey);

    // プロバイダーを設定
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const walletWithProvider = wallet.connect(provider);

    // コントラクトオブジェクトを生成
    const contract = new ethers.Contract(contractData.contractAddress, contractData.abi, walletWithProvider);

    // コントラクトを返却
    return contract;
  } catch (error) {
    throw new Error(`Failed to create contract: ${(error as Error).message}`);
  }
}

// NFTを発行する非同期関数
export async function mintNFT(counterId: string, address: string) {
  try {
    // コントラクトオブジェクトを取得
    const contract = await getContract(counterId);

    // contract が null の場合はエラーをスロー
    if (!contract) {
      throw new Error(`Contract for counterId ${counterId} is not available.`);
    }

    // NFTをミント（コントラクトのメソッドを実行）
    const tx = await contract.safeMint(address);

    // トランザクションの確認
    const receipt = await tx.wait();

    console.log(`Minted NFT to ${address}`);
    console.log(`Transaction hash: ${tx.hash}`);

//    console.log("Logs:", receipt.logs);

    // `Transfer` イベントを取得 (logs 経由)
    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ]);

    let tokenId: string | null = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog(log);
        if (parsedLog!.name === "Transfer") {
          tokenId = parsedLog!.args.tokenId.toString();
          break;
        }
      } catch (err) {
        // parseLog が失敗するログもあるので無視
      }
    }

    if (!tokenId) {
      throw new Error("Failed to retrieve tokenId from the Transfer event");
    }

    console.log(`Minted tokenId: ${tokenId}`);

    // tokenIdを返却
    return tokenId;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to mint NFT: ${(error as Error).message}`);
  }
}

module.exports = {
  compileContracts,
  deployContract,
  mintNFT,
};
