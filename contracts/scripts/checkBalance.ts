import { ethers } from "hardhat";

async function main() {
  const address = "0x17e08dD6C3b78cB618Db025EA3d4868180bb3550";
  const balance = await ethers.provider.getBalance(address);
  
  console.log("Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
}

main();
