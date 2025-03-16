import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";

interface MetamaskContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  network: ethers.Network | null;
  connectMetamask: () => Promise<void>;
  disconnectMetamask: () => void;
  isConnected: boolean;
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
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Metamask に接続する関数
  const connectMetamask = async () => {
    if (!window.ethereum) {
      setError("Metamask is not installed.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setNetwork(network);
      setIsConnected(true);
      setError(null);

      localStorage.setItem("metamaskConnected", "true");
    } catch (error) {
      console.error("Error connecting to Metamask:", (error as Error).message);
      setError((error as Error).message);
    }
  };

  // Metamask との接続を解除する関数
  const disconnectMetamask = () => {
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem("metamaskConnected");
  };

  useEffect(() => {
    const checkMetamaskConnection = async () => {
      if (localStorage.getItem("metamaskConnected") === "true") {
        await connectMetamask();
      }
    };

    checkMetamaskConnection();
  }, []);

  const contextValue = useMemo(() => ({
    provider,
    signer,
    network,
    connectMetamask,
    disconnectMetamask,
    isConnected,
    error,
  }), [provider, signer, network, isConnected, error]);

  return (
    <MetamaskContext.Provider value={contextValue}>
      {children}
    </MetamaskContext.Provider>
  );
};
