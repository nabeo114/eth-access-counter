import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Box, Card, CardContent, Button, Typography, Divider, CircularProgress, Alert } from "@mui/material";
import { useMetamask } from "../contexts/MetamaskContext";

const Metamask: React.FC = () => {
  const { provider, signer, network, connectMetamask, error: metamaskError  } = useMetamask();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [networkChainId, setNetworkChainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountDetails = async () => {
    setError(null);
    try {
      if (signer) {
        const address = await signer.getAddress();
        setAccountAddress(address);

        if (provider) {
          const balance = await provider.getBalance(address);
          setBalance(ethers.formatEther(balance.toString()));
        }
      }

      if (network) {
        setNetworkName(network.name);
        setNetworkChainId(network.chainId.toString());
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Error fetching account details:", errorMessage);
      setError(errorMessage);
    }
  };

  const handleConnectMetamask = async () => {
    setError(null);
    setLoading(true);
    try {
      await connectMetamask();
      await fetchAccountDetails();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Error connecting Metamask:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider && signer && network) {
      fetchAccountDetails();
    }
  }, [provider, signer, network]);

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleConnectMetamask} sx={{ mt: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Connect Metamask"}
      </Button>
      {(metamaskError || error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {metamaskError || error}
        </Alert>
      )}
      {(accountAddress || balance || networkName || networkChainId) && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            {accountAddress && (
              <>
                <Typography variant="body2" color="textSecondary">
                  Account Address: <Typography component="span" variant="body1" color="textPrimary">
                    {accountAddress}
                  </Typography>
                </Typography>
              </>
            )}
            {balance && (
              <Typography variant="body2" color="textSecondary">
                Balance: <Typography component="span" variant="body1" color="textPrimary">
                  {balance}
                </Typography>
              </Typography>
            )}
            {(networkName && networkChainId) && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Network Name: <Typography component="span" variant="body1" color="textPrimary">
                    {networkName}
                  </Typography>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Chain ID: <Typography component="span" variant="body1" color="textPrimary">
                    {networkChainId}
                  </Typography>
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {accountAddress && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 3 }}>
          <Typography variant="body2" color="textSecondary">
            アクセスカウンター
          </Typography>
          <Box dangerouslySetInnerHTML={{
            __html: `
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/">
                      <img src="http://localhost:5000/counter/9c3f2013-6309-47f1-a117-2615c195700a/?address=${accountAddress}" 
                          alt="アクセスカウンター" border="0">
                      </img>
                    </a>
                  </td>
                </tr>
              </table>
            `
          }} />
        </Box>
      )}
    </>
  );
};

export default Metamask;
