import { ethers } from "hardhat";

async function main() {
  console.log("🎨 Checking NFT #4 (PRPL) Ownership\n");

  // From previous ownership check, we know the NFT contract address
  const nftContractAddress = "0x5c1a1c42c1f80a7c77f8d2c79f94ed74bf8acbc9";
  
  console.log(`NFT Contract: ${nftContractAddress}`);
  
  const nftContract = await ethers.getContractAt("AssetNFT", nftContractAddress);
  
  try {
    const owner = await nftContract.ownerOf(4);
    console.log(`\n✅ Current Owner: ${owner}`);
    console.log(`\nWallets:`);
    console.log(`   Admin: 0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF`);
    console.log(`   User:  0x17e08dD6C3b78cB618Db025EA3d4868180bb3550`);
    
    if (owner.toLowerCase() === "0xA24a49D62C3Dc81a9BADC056dc69a1B386593FcF".toLowerCase()) {
      console.log(`\n🎉 Owned by Admin ✅`);
    } else if (owner.toLowerCase() === "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550".toLowerCase()) {
      console.log(`\n📦 Owned by User ✅`);
    } else {
      console.log(`\n⚠️ Owned by someone else`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
