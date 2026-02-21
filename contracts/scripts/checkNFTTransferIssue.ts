import { ethers } from "hardhat";

const TX_HASH = "0x8bb42650089bccdd0e8b2ce2a84767d95add632a49156ee0cd30a5403939fd1f";

async function main() {
  console.log("🔍 Checking NFT Transfer Issue...\n");

  const provider = ethers.provider;

  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log("❌ Transaction not found");
      return;
    }

    console.log("Transaction Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("From:", receipt.from);
    console.log("To:", receipt.to);
    console.log("\n📜 Logs:");

    // Parse logs
    receipt.logs.forEach((log, index) => {
      console.log(`\nLog ${index}:`);
      console.log("  Address:", log.address);
      console.log("  Topics:", log.topics);
      console.log("  Data:", log.data);
    });

    // If transaction failed, try to get revert reason
    if (receipt.status === 0) {
      console.log("\n❌ TRANSACTION FAILED");
      const tx = await provider.getTransaction(TX_HASH);
      
      if (tx) {
        try {
          // Try to replay the transaction to get the revert reason
          await provider.call({
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: tx.value,
            gasLimit: tx.gasLimit,
            gasPrice: tx.gasPrice,
          }, tx.blockNumber! - 1);
        } catch (error: any) {
          console.log("\n🔴 Revert Reason:", error.message);
        }
      }
    }

  } catch (error: any) {
    console.error("Error:", error.message);
  }

  // Check KYC addresses
  console.log("\n\n=".repeat(40));
  console.log("🔐 Checking KYC Configuration:");
  console.log("=".repeat(40));

  const KYC_ADDRESS = process.env.NEXT_PUBLIC_KYC_ADDRESS || "0x7C5223514Baf8e80575E9FA2204890C9DA385fC6";
  const PRIMARY_SALE_NFT_ADDRESS = "0xe602280Ed991B01Ba253Cd738aFCFcF498c31943";

  const kycContract = await ethers.getContractAt("KYC", KYC_ADDRESS);

  console.log("\nPrimarySaleNFT Contract:", PRIMARY_SALE_NFT_ADDRESS);
  const isContractWhitelisted = await kycContract.isWhitelisted(PRIMARY_SALE_NFT_ADDRESS);
  console.log("Is Whitelisted:", isContractWhitelisted ? "✅ Yes" : "❌ No");

  if (!isContractWhitelisted) {
    console.log("\n⚠️  PROBLEM DETECTED:");
    console.log("The PrimarySaleNFT contract is NOT whitelisted in KYC!");
    console.log("This may cause NFT transfers to fail if KYC is required.");
    console.log("\n💡 SOLUTION:");
    console.log("Run the manageKYC.ts script and whitelist this address:");
    console.log(PRIMARY_SALE_NFT_ADDRESS);
  }

  console.log("\n🔗 View transaction on Etherscan:");
  console.log(`https://sepolia.etherscan.io/tx/${TX_HASH}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
