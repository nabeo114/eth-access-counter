import hre from "hardhat";

async function main() {
  const [bobWalletClient, aliceWalletClient] =
    await hre.viem.getWalletClients();

    const myNFT = await hre.viem.deployContract("MyNFT");
    console.log(myNFT.address);
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });