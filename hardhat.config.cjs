require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

// Use environment variables for network configuration
// WARNING: Never commit private keys to source control
if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY) {
  console.error("Error: Missing environment variables. Please set SEPOLIA_RPC_URL and PRIVATE_KEY in your .env file");
  process.exit(1);
}
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v6",
  },
}; 