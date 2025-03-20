import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { AccountBalanceWallet, ContentCopy, Logout } from "@mui/icons-material";
import { useMetamask } from "../contexts/MetamaskContext";
import { copyToClipboard } from "../utils";

const Header: React.FC = () => {
  const { signer, connectMetamask, disconnectMetamask } = useMetamask();
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

  const handleConnect = () => {
    connectMetamask();
  } 

  const handleDisconnect = () => {
    disconnectMetamask();
    setAccount(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Eth Access Counter
        </Typography>
        {account ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1">
              {account.slice(0, 6)}...{account.slice(-4)}
            </Typography>
            <Tooltip title="Copy address">
              <IconButton onClick={handleCopy} size="small" sx={{ marginRight: 1 }}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Disconnect Wallet">
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
            Connect Wallet
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
