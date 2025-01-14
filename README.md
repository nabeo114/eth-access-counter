# Hacktivation-2024 Setup Guide

This guide provides step-by-step instructions to set up the environment for the Hacktivation-2024 project.

## 1. Contract Development
Navigate to the `packages/contract` directory.

### Steps:
1. **Write Your Contract:**
   - Write your smart contract files in this directory.

2. **Create a Deployment Script:**
   - Write your deployment script in `scripts/deploy.ts`.

3. **Start the Local Node:**
   ```bash
   npm run node
   ```

4. **Deploy the Contract:**
   - Deploy the contract to the local network using the following command:
     ```bash
     npm run deploy -- --network localhost
     ```
   - Note down the contract address displayed in the console after deployment.

## 2. Frontend Setup
Navigate to the `packages/frontend` directory.

### Steps:
1. **Import the Local Node Account into MetaMask:**
   - Open MetaMask and import the private key of the first account displayed by the local node.

2. **Add Localhost Network to MetaMask:**
   - Configure MetaMask to connect to the localhost network.

3. **Start the Frontend Application:**
   ```bash
   npm run dev
   ```

---

Now you have both the backend (smart contract) and frontend environments running for Hacktivation-2024. Happy hacking!
