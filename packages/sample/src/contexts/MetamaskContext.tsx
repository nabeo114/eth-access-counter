import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

interface MetamaskContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  network: ethers.Network | null;
  connectMetamask: () => Promise<void>;
  error: string | null;
}

const MetamaskContext = createContext<MetamaskContextType | undefined>(undefined);

export const useMetamask = () => {
  const context = useContext(MetamaskContext);
  if (!context) {
    throw new Error("useMetamask must be used within a MetamaskProvider");
  }
  return context;
};

export const MetamaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [network, setNetwork] = useState<ethers.Network | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Metamask に接続する関数
  const connectMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Metamask のアカウントに接続をリクエストし、アカウントが取得できるかどうか確認
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setNetwork(network);
      } catch (error) {
        console.error("Error connecting to Metamask:", (error as Error).message);
        setError((error as Error).message);
      }
    } else {
      console.error("Metamask is not installed.");
      setError("Metamask is not installed.");
    }
  };

  return (
    <MetamaskContext.Provider value={{ provider, signer, network, connectMetamask, error }}>
      {children}
    </MetamaskContext.Provider>
  );
};
