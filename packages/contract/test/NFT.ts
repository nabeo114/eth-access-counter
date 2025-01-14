import { expect } from "chai";
import hre from "hardhat";
import {
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
  import { getAddress } from "viem";
  
describe("MyNFT", function () {
  async function deployMyNFTFixture() {
    const myNFT = await hre.viem.deployContract("MyNFT");
  
      const publicClient = await hre.viem.getPublicClient();

    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    return { myNFT, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { myNFT } = await loadFixture(deployMyNFTFixture);
      expect(await myNFT.read.name()).to.equal("MyNFT");
      expect(await myNFT.read.symbol()).to.equal("MNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and assign it to the correct owner", async function () {
      const { myNFT, owner } = await loadFixture(deployMyNFTFixture);

      const tokenURI = "https://example.com/token/1";
      await myNFT.write.mint([owner.account.address, tokenURI]);

      expect(await myNFT.read.balanceOf([owner.account.address])).to.equal(BigInt(1));
      expect(await myNFT.read.ownerOf([BigInt(1)])).to.equal(getAddress(owner.account.address));
      expect(await myNFT.read.tokenURI([BigInt(1)])).to.equal(tokenURI);
    });
  });

  describe("Transfers", function () {
    it("Should transfer token between accounts", async function () {
      const { myNFT, owner, addr1 } = await loadFixture(deployMyNFTFixture);

      await myNFT.write.mint([owner.account.address, "https://example.com/token/1"]);

      await myNFT.write.transferFrom([owner.account.address, addr1.account.address, BigInt(1)]);

      expect(await myNFT.read.balanceOf([owner.account.address])).to.equal(BigInt(0));
      expect(await myNFT.read.balanceOf([addr1.account.address])).to.equal(BigInt(1));
      expect(await myNFT.read.ownerOf([BigInt(1)])).to.equal(getAddress(addr1.account.address));
    });

    it("Should not allow unauthorized transfers", async function () {
      const { myNFT, owner, addr1, addr2 } = await loadFixture(deployMyNFTFixture);

      await myNFT.write.mint([owner.account.address, "https://example.com/token/1"]);
      const nftAsOtherAccount = await hre.viem.getContractAt(
        "MyNFT",
        myNFT.address,
        { client: { wallet: addr1 } }
      );
      await expect(
        nftAsOtherAccount.write.transferFrom([owner.account.address, addr2.account.address, BigInt(1)])
      ).to.be.rejectedWith("Not authorized");
    });
  });

  describe("Approvals", function () {
    it("Should allow setting and using token approvals", async function () {
      const { myNFT, owner, addr1 } = await loadFixture(deployMyNFTFixture);

      await myNFT.write.mint([owner.account.address, "https://example.com/token/1"]);

      await myNFT.write.approve([addr1.account.address, BigInt(1)]);

      expect(await myNFT.read.getApproved([BigInt(1)])).to.equal(getAddress(addr1.account.address));

      const nftAsOtherAccount = await hre.viem.getContractAt(
        "MyNFT",
        myNFT.address,
        { client: { wallet: addr1 } }
      );
      await nftAsOtherAccount.write.transferFrom([owner.account.address, addr1.account.address, BigInt(1)]);

      expect(await myNFT.read.balanceOf([addr1.account.address])).to.equal(BigInt(1));
      expect(await myNFT.read.ownerOf([BigInt(1)])).to.equal(getAddress(addr1.account.address));
    });

    it("Should allow setting and using operator approvals", async function () {
      const { myNFT, owner, addr1, addr2 } = await loadFixture(deployMyNFTFixture);

      await myNFT.write.mint([owner.account.address, "https://example.com/token/1"]);

      await myNFT.write.setApprovalForAll([addr1.account.address, true]);

      expect(await myNFT.read.isApprovedForAll([owner.account.address, addr1.account.address])).to.equal(true);

      const nftAsOtherAccount = await hre.viem.getContractAt(
        "MyNFT",
        myNFT.address,
        { client: { wallet: addr1 } }
      );
      await nftAsOtherAccount.write.transferFrom([owner.account.address, addr2.account.address, BigInt(1)]);

      expect(await myNFT.read.balanceOf([addr2.account.address])).to.equal(BigInt(1));
      expect(await myNFT.read.ownerOf([BigInt(1)])).to.equal(getAddress(addr2.account.address));
    });
  });
});
