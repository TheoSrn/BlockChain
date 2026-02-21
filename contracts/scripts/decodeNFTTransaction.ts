import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Analyzing acceptBuyOrder Transaction\n");

  const txHash = "0xf6c9340c9852d198a26adb51f8a8a97f6300bc87f3c605f88fddea140a6146ce";
  
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    console.log("Transaction not found");
    return;
  }

  console.log(`Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
  console.log(`\nEvents (${receipt.logs.length} logs):\n`);

  // ERC721 Transfer event signature
  const transferSig = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i];
    console.log(`Log ${i}:`);
    console.log(`  Contract: ${log.address}`);
    console.log(`  Topics: ${log.topics.length}`);
    
    if (log.topics[0] === transferSig) {
      console.log(`  Event: Transfer`);
      
      // Decode Transfer event
      if (log.topics.length >= 3) {
        const from = ethers.getAddress("0x" + log.topics[1].slice(26));
        const to = ethers.getAddress("0x" + log.topics[2].slice(26));
        
        // For ERC721, tokenId is in topics[3] if it exists, otherwise in data
        let tokenId;
        if (log.topics.length === 4) {
          // ERC721 - tokenId in topics
          tokenId = BigInt(log.topics[3]).toString();
        } else if (log.data && log.data !== "0x") {
          // ERC20 - amount in data (skip)
          const amount = BigInt(log.data);
          console.log(`  From: ${from}`);
          console.log(`  To: ${to}`);
          console.log(`  Amount: ${ethers.formatEther(amount)}`);
          console.log();
          continue;
        }
        
        console.log(`  From: ${from}`);
        console.log(`  To: ${to}`);
        if (tokenId) {
          console.log(`  Token ID: ${tokenId}`);
          console.log(`  → This is the NFT transfer! 🎨`);
        }
      }
    }
    console.log();
  }

  // Now check who owns what
  console.log("\n📊 Checking Current Ownership:");
  console.log("\nAdmin: 0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF");
  console.log("User:  0x17e08dD6C3b78cB618Db025EA3d4868180bb3550\n");
  
  // Find NFT contract from logs
  const nftTransferLog = receipt.logs.find(log => 
    log.topics[0] === transferSig && log.topics.length === 4
  );
  
  if (nftTransferLog) {
    const nftContract = nftTransferLog.address;
    const tokenId = BigInt(nftTransferLog.topics[3]);
    
    console.log(`NFT Contract: ${nftContract}`);
    console.log(`Token ID: ${tokenId}`);
    
    const AssetNFT = await ethers.getContractAt("AssetNFT", nftContract);
    const owner = await AssetNFT.ownerOf(tokenId);
    
    console.log(`\n✅ Current Owner: ${owner}`);
    
    if (owner.toLowerCase() === "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF".toLowerCase()) {
      console.log(`\n🎉 Owned by Admin ✅`);
      console.log("\nLa vente s'est bien déroulée ! L'Admin possède maintenant le NFT #4.");
    } else if (owner.toLowerCase() === "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550".toLowerCase()) {
      console.log(`\n📦 Owned by User ✅`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
