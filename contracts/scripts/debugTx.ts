import { ethers } from "hardhat";

const TX_HASH = "0xd31154e384d95cd24da4354a8f5f71ab2452c292e4b53534f089dd5375d142d6";

async function main() {
  console.log("🔍 Analyzing Transaction...\n");

  const provider = ethers.provider;

  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log("❌ Transaction not found or still pending");
      return;
    }

    console.log("Transaction Hash:", TX_HASH);
    console.log("Status:", receipt.status === 1 ? "✅ Success" : "❌ FAILED");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("From:", receipt.from);
    console.log("To:", receipt.to);
    console.log("\n" + "=".repeat(80));

    // If transaction failed, try to get revert reason
    if (receipt.status === 0) {
      console.log("\n❌ TRANSACTION FAILED - Attempting to get revert reason...\n");
      
      const tx = await provider.getTransaction(TX_HASH);
      
      if (tx) {
        try {
          // Try to replay the transaction to get the revert reason
          await provider.call(
            {
              to: tx.to,
              from: tx.from,
              data: tx.data,
              value: tx.value,
              gasLimit: tx.gasLimit,
            },
            tx.blockNumber! - 1
          );
        } catch (error: any) {
          console.log("🔴 Revert Reason:");
          console.log(error.message);
          
          // Try to parse the error data
          if (error.data) {
            console.log("\n📋 Error Data:", error.data);
            
            // Try to decode common error signatures
            const errorData = error.data;
            if (typeof errorData === 'string') {
              // Common error signatures
              const errors: { [key: string]: string } = {
                '0x82b42900': 'Unauthorized',
                '0xd92e233d': 'ZeroAddress',
                '0xf4d678b8': 'InsufficientBalance',
                '0xfb8f41b2': 'InsufficientAllowance',
              };
              
              const errorSig = errorData.substring(0, 10);
              if (errors[errorSig]) {
                console.log("\n⚠️ Known Error:", errors[errorSig]);
              }
            }
          }
        }
      }
    } else {
      console.log("\n✅ Transaction succeeded!");
      console.log("\n📜 Event Logs:");
      
      receipt.logs.forEach((log, index) => {
        console.log(`\nLog ${index}:`);
        console.log("  Contract:", log.address);
        console.log("  Topics:", log.topics.length);
        if (log.topics.length > 0) {
          // Check for common events
          const topic0 = log.topics[0];
          if (topic0 === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            console.log("  Event: Transfer");
          } else if (topic0 === '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925') {
            console.log("  Event: Approval");
          }
        }
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🔗 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/tx/${TX_HASH}`);

  } catch (error: any) {
    console.error("\n❌ Error analyzing transaction:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
