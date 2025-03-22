import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { AccountBalanceWallet, ContentCopy, Logout } from "@mui/icons-material";
import { useMetamask } from "../contexts/MetamaskContext";
import { copyToClipboard } from "../utils";

const Header: React.FC = () => {
  const { signer, connectMetamask, disconnectMetamask, signInWithEthereum } = useMetamask();
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setAccount(address);
      }
    };

    fetchAccount();
  }, [signer]);

  const handleCopy = () => {
    if (account) {
      copyToClipboard(account);
    }
  };

  const handleConnect = async () => {
    await connectMetamask();
    await signInWithEthereum();
  } 

  const handleDisconnect = () => {
    disconnectMetamask();
    setAccount(null);
  };

  return (
    <AppBar position="fixed" sx={{ top: 0, left: 0, right: 0, zIndex: 1100 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Eth Access Counter
        </Typography>
        {account ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Copy address">
              <Box display="flex" alignItems="center" onClick={handleCopy} sx={{ cursor: "pointer" }}>
                <Typography variant="body1">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Typography>
                <IconButton size="small" sx={{ marginRight: 1 }}>
                  <ContentCopy />
                </IconButton>
              </Box>
            </Tooltip>
            <Tooltip title="Disconnect Metamask">
              <IconButton onClick={handleDisconnect} size="small">
                <Logout />
              </IconButton>
            </Tooltip>
          </div>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AccountBalanceWallet />}
            onClick={handleConnect}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              padding: "6px 16px",
            }}
          >
            Connect Metamask
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
