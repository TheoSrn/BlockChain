import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking NFT Metadata\n");

  const factoryAddress = "0xcD10F4847908eBBe7BAc14664F777c600b5f5Fd8";
  const Factory = await ethers.getContractAt("Factory", factoryAddress);
  
  for (let assetId = 1; assetId <= 2; assetId++) {
    console.log(`\n━━━ Asset #${assetId} ━━━`);
    
    const asset = await Factory.getAsset(assetId);
    console.log(`Name: ${asset.name}`);
    console.log(`Symbol: ${asset.symbol}`);
    console.log(`NFT Contract: ${asset.nft}`);
    
    const AssetNFT = await ethers.getContractAt("AssetNFT", asset.nft);
    
    // Get metadata
    const metadata = await AssetNFT.getMetadata();
    console.log(`\nMetadata:`);
    console.log(`  Location: ${metadata.location}`);
    console.log(`  Surface: ${metadata.surface}`);
    console.log(`  EstimatedValue: ${metadata.estimatedValue}`);
    console.log(`  Description: ${metadata.description}`);
    console.log(`  Documents: "${metadata.documents}"`);
    
    // Check if UNIQUE
    const isUnique = metadata.documents.includes('UNIQUE');
    console.log(`\nisUnique check: ${isUnique}`);
    console.log(`  documents.includes('UNIQUE'): ${metadata.documents.includes('UNIQUE')}`);
    
    // Try ownerOf
    try {
      const owner = await AssetNFT.ownerOf(assetId);
      console.log(`\n✅ Owner of tokenId ${assetId}: ${owner}`);
    } catch (e: any) {
      console.log(`❌ ownerOf failed: ${e.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
