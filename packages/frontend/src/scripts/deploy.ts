import { ethers } from "ethers";

// コントラクトをデプロイする非同期関数
export async function deployContract(
  contractJsonData: { contractName: string, abi: any; bytecode: string },
  signer: ethers.Signer,
  constructorArgs: any[] = []
) {
  try {
    console.log(`Starting deployment of ${contractJsonData.contractName}...`);
    
    // コントラクトのファクトリを作成
    const contractFactory = new ethers.ContractFactory(
      contractJsonData.abi,
      contractJsonData.bytecode,
      signer
    );

    // コントラクトをデプロイ
    const contract = await contractFactory.deploy(...constructorArgs);
    console.log("Contract deployment transaction sent.");

    // デプロイ完了まで待機
    await contract.waitForDeployment();
    console.log("Contract deployed.");

    // トランザクションのレシートを取得
    const txReceipt = await contract.deploymentTransaction()!.wait();
    console.log(`Contract deployed at address: ${txReceipt!.contractAddress}`);
    console.log(`Transaction hash: ${txReceipt!.hash}`);

    return  {
      contractAddress: txReceipt!.contractAddress,
      transactionHash: txReceipt!.hash,
    };
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to deploy ${contractJsonData.contractName} contract: ${(error as Error).message}`);
  }
};
