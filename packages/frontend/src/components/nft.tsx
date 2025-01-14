import { useNFTContract } from "../hooks/nft";

export const NFTManager = () => {
    const { address, balance, isBalanceLoading, isBalanceError, onMintNFT, isMinting, isMintError } = useNFTContract();

    return (
        <div>
            <h1>NFT Manager</h1>

            {/* Display NFT Balance */}
            <div>
                <h2>NFT Balance</h2>
                {isBalanceLoading ? (
                    <p>Loading NFT balance...</p>
                ) : isBalanceError ? (
                    <p>Error fetching balance.</p>
                ) : (
                    <p>Your NFT balance: {balance}</p>
                )}
            </div>

            {/* Mint NFT */}
            <div>
                <h2>Mint a new NFT</h2>
                <button onClick={async () => {onMintNFT()}} disabled={isMinting || !onMintNFT}>
                    {isMinting ? "Minting..." : "Mint NFT"}
                </button>
                {isMintError && <p style={{ color: "red" }}>Error minting NFT.</p>}
            </div>
        </div>
    );
};