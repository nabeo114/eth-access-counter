import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import axios from "axios";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface MetamaskContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  network: ethers.Network | null;
  connectMetamask: () => Promise<void>;
  disconnectMetamask: () => void;
  isConnected: boolean;
  isAuthenticated: boolean;
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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

      signInWithEthereum(signer, network);
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
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem("metamaskConnected");
  };

  // SIWE認証を行う関数
  const signInWithEthereum = async (signer: ethers.Signer, network: ethers.Network) => {
    if (!signer) {
      setError("Metamask is not connected.");
      return;
    }
    try {
      const scheme = window.location.protocol.slice(0, -1);
      const domain = window.location.host;
      const origin = window.location.origin;
      const address = await signer.getAddress();

      // サーバーからnonceを取得
      const nonceResponse = await axios.get("http://localhost:5001/signin/nonce",
        { withCredentials: true }
      );
      const nonce = nonceResponse.data.nonce;

      const message = new SiweMessage({
        scheme,
        domain,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: origin,
        version: "1",
        chainId: network?.chainId ? Number(network.chainId) : 1, // bigint → number へ変換
        nonce,
      });
      const preparedMessage = message.prepareMessage();
      const signature = await signer.signMessage(preparedMessage);

      // サーバーへ署名を送信し、検証
      const verifyResponse = await axios.post("http://localhost:5001/signin/verify",
        { message, signature },
        { withCredentials: true }
      );

      if (verifyResponse.status === 200) {
        setIsAuthenticated(true);
      } else {
        setError("Authentication failed.");
      }
    } catch (error) {
      console.error("SIWE authentication error:", (error as Error).message);
      setError((error as Error).message);
    }
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
    isAuthenticated,
    error,
  }), [provider, signer, network, isConnected, isAuthenticated, error]);

  return (
    <MetamaskContext.Provider value={contextValue}>
      {children}
    </MetamaskContext.Provider>
  );
};
