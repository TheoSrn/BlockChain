import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les adresses depuis frontend/.env.local
const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
dotenv.config({ path: frontendEnvPath });

async function main() {
  const txHash = "0xa82ed64d8344ea5b5cd2d09bbbb3ffbd548d9aae222f0430b69a285b3b792a8e";
  
  console.log("🔍 Analyzing transaction:", txHash, "\n");

  const provider = ethers.provider;
  
  // Get transaction receipt
  const receipt = await provider.getTransactionReceipt(txHash);
  
  if (!receipt) {
    console.log("❌ Transaction not found or still pending");
    return;
  }

  console.log("📊 Transaction Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Block Number:", receipt.blockNumber);
  
  if (receipt.status === 0) {
    console.log("\n⚠️ Transaction failed. Trying to get revert reason...\n");
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    
    if (tx) {
      console.log("From:", tx.from);
      console.log("To:", tx.to);
      console.log("Value:", ethers.formatEther(tx.value || 0n), "ETH");
      console.log("Gas Limit:", tx.gasLimit.toString());
      
      try {
        // Try to replay the transaction to get the revert reason
        await provider.call({
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value,
          gasLimit: tx.gasLimit
        }, tx.blockNumber! - 1);
      } catch (error: any) {
        console.log("\n❌ Revert Reason:");
        if (error.data) {
          console.log("Error Data:", error.data);
        }
        if (error.reason) {
          console.log("Reason:", error.reason);
        }
        if (error.message) {
          console.log("Message:", error.message);
        }
        
        // Try to decode the error
        if (error.data && typeof error.data === 'string') {
          try {
            const reason = ethers.toUtf8String('0x' + error.data.substring(138));
            console.log("Decoded Reason:", reason);
          } catch {
            console.log("Could not decode error data");
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
