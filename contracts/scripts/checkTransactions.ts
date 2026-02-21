import { ethers } from "hardhat";

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║       🔍 TRANSACTION ANALYSIS                        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const provider = ethers.provider;

  // Admin (buyer) transactions
  const adminTxs = [
    "0x66e181895a83de1c386ae0e9c611a4544fb02897e1b314d84f9bd53670b8d686",
    "0xda38944bd5efc52b0700ef9c2fcf45a02d9957a0a5bd4f9a033145de7b7334db"
  ];

  // User (seller) transactions
  const userTxs = [
    "0xf6c9340c9852d198a26adb51f8a8a97f6300bc87f3c605f88fddea140a6146ce",
    "0xda38944bd5efc52b0700ef9c2fcf45a02d9957a0a5bd4f9a033145de7b7334db"
  ];

  console.log("👤 ADMIN TRANSACTIONS (Buyer):\n");
  for (const txHash of adminTxs) {
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!tx || !receipt) {
        console.log(`❌ Transaction ${txHash} not found\n`);
        continue;
      }

      console.log(`📝 Transaction: ${txHash}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
      console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Block: ${receipt.blockNumber}`);
      
      // Decode input data
      if (tx.data && tx.data.length > 10) {
        const methodId = tx.data.slice(0, 10);
        console.log(`   Method ID: ${methodId}`);
        
        // Common method signatures
        const methods: { [key: string]: string } = {
          "0x095ea7b3": "approve(address,uint256)",
          "0xa9059cbb": "transfer(address,uint256)",
          "0x23b872dd": "transferFrom(address,address,uint256)",
          "0x42842e0e": "safeTransferFrom(address,address,uint256)",
          "0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
          "0x6a4f832b": "createBuyOrder(uint256,uint256,address)",
          "0x3ccfd60b": "withdraw()",
          "0xd0e30db0": "deposit()",
        };
        
        if (methods[methodId]) {
          console.log(`   Method: ${methods[methodId]}`);
        }
      }
      
      // Check for events
      if (receipt.logs.length > 0) {
        console.log(`   Events: ${receipt.logs.length} log(s)`);
        for (const log of receipt.logs) {
          const topics = log.topics;
          if (topics.length > 0) {
            const eventSig = topics[0];
            // Common event signatures
            if (eventSig === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
              console.log(`      - Transfer event`);
            } else if (eventSig === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
              console.log(`      - Approval event`);
            } else if (eventSig === "0x1d5e12b51dee5e4d34434576c3fb99714a85f57b0fd89fd5fcc8d68062b10a5c") {
              console.log(`      - BuyOrderCreated event`);
            }
          }
        }
      }
      
      console.log();
    } catch (error: any) {
      console.log(`❌ Error checking transaction ${txHash}: ${error.message}\n`);
    }
  }

  console.log("\n👤 USER TRANSACTIONS (Seller):\n");
  for (const txHash of userTxs) {
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!tx || !receipt) {
        console.log(`❌ Transaction ${txHash} not found\n`);
        continue;
      }

      console.log(`📝 Transaction: ${txHash}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
      console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Block: ${receipt.blockNumber}`);
      
      // Decode input data
      if (tx.data && tx.data.length > 10) {
        const methodId = tx.data.slice(0, 10);
        console.log(`   Method ID: ${methodId}`);
        
        const methods: { [key: string]: string } = {
          "0x095ea7b3": "approve(address,uint256)",
          "0xa9059cbb": "transfer(address,uint256)",
          "0x23b872dd": "transferFrom(address,address,uint256)",
          "0x42842e0e": "safeTransferFrom(address,address,uint256)",
          "0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
          "0x6a4f832b": "createBuyOrder(uint256,uint256,address)",
          "0x3ccfd60b": "withdraw()",
          "0xd0e30db0": "deposit()",
          "0x3d7d3f5a": "createSellOrder(uint256,uint256,uint256,address)",
        };
        
        if (methods[methodId]) {
          console.log(`   Method: ${methods[methodId]}`);
        }
      }
      
      // Check for events
      if (receipt.logs.length > 0) {
        console.log(`   Events: ${receipt.logs.length} log(s)`);
        for (const log of receipt.logs) {
          const topics = log.topics;
          if (topics.length > 0) {
            const eventSig = topics[0];
            if (eventSig === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
              console.log(`      - Transfer event`);
            } else if (eventSig === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925") {
              console.log(`      - Approval event`);
            } else if (eventSig === "0x90064ca91f6db5ң76dc698a492f3af7c105593c16defe8615e1da34b0c78aa67") {
              console.log(`      - SellOrderCreated event`);
            }
          }
        }
      }
      
      console.log();
    } catch (error: any) {
      console.log(`❌ Error checking transaction ${txHash}: ${error.message}\n`);
    }
  }

  // Check NFT #4 (PRPL) current owner
  console.log("\n🎨 NFT #4 (PRPL) Current Ownership:\n");
  try {
    const factoryAddress = process.env.FACTORY_ADDRESS;
    const Factory = await ethers.getContractAt("factory", factoryAddress!);
    
    const asset = await Factory.assets(4);
    const nftContract = await ethers.getContractAt("assetNFT", asset.nftContract);
    
    const owner = await nftContract.ownerOf(4);
    console.log(`   Owner: ${owner}`);
    console.log(`   Admin: 0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF`);
    console.log(`   User:  0x17e08dD6C3b78cB618Db025EA3d4868180bb3550`);
    
    if (owner.toLowerCase() === "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF".toLowerCase()) {
      console.log(`   ✅ Owned by Admin`);
    } else if (owner.toLowerCase() === "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550".toLowerCase()) {
      console.log(`   ✅ Owned by User`);
    } else {
      console.log(`   ⚠️ Owned by someone else`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error checking NFT owner: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
