// Simple deployment script using ethers.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying VaultFactory contract to Sepolia...");

  // Get the contract factory
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  
  // Deploy the contract
  const vaultFactory = await VaultFactory.deploy();
  await vaultFactory.waitForDeployment();
  
  // Get the deployed contract address
  const vaultFactoryAddress = await vaultFactory.getAddress();
  
  console.log(`VaultFactory deployed to: ${vaultFactoryAddress}`);
  
  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    vaultFactoryAddress: vaultFactoryAddress,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment successful! ✅");
  console.log("\nNEXT STEPS:");
  console.log(`1. Open src/utils/contracts.ts`);
  console.log(`2. Update VAULT_FACTORY_ADDRESS with: '${vaultFactoryAddress}'`);
  console.log('3. Run the app with: npm run dev');
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
