import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking Asset NFT Structure\n");

  const factoryAddress = "0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8";
  const Factory = await ethers.getContractAt("Factory", factoryAddress);
  
  // Check all assets
  for (let assetId = 1; assetId <= 4; assetId++) {
    console.log(`\n━━━ Asset #${assetId} ━━━`);
    
    try {
      const asset = await Factory.getAsset(assetId);
      console.log(`Name: ${asset.name}`);
      console.log(`Symbol: ${asset.symbol}`);
      console.log(`NFT Contract: ${asset.nft}`);
      
      const AssetNFT = await ethers.getContractAt("AssetNFT", asset.nft);
      
      // Try different tokenIds to see which one exists
      for (let tokenId = 1; tokenId <= 10; tokenId++) {
        try {
          const owner = await AssetNFT.ownerOf(tokenId);
          console.log(`  ✅ TokenId ${tokenId} exists - Owner: ${owner}`);
        } catch (e) {
          // Token doesn't exist, skip
        }
      }
      
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
