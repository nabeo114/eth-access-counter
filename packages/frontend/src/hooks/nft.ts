import React, { useState } from "react";
import { useAccount,useReadContract, useWriteContract } from "wagmi";
import nftAbi from "../ABI/MyNFT.json";

export const useNFTContract = () => {
    const { address } = useAccount();

    const nftAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

    // Read NFT balance
    const { data: nftBalance, isError: isBalanceError, isLoading: isBalanceLoading } = useReadContract({
      address: nftAddress,
      abi: nftAbi,
      functionName: "balanceOf",
      args: [address],
    });
  
    const { writeContract: mintNFT, isPending: isMinting, isError: isMintError } = useWriteContract();
  
    const onMintNFT = async () => {
        mintNFT({
            address: nftAddress,
            abi: nftAbi,
            functionName: "mint",
            args: [address, "test"],
          });
    }
    return {
        address,
      balance: nftBalance ?  Number(nftBalance): 0,
      isBalanceError,
      isBalanceLoading,
      onMintNFT,
      isMinting,
      isMintError,
    };
  }