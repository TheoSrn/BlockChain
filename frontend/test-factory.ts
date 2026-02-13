// Quick test to verify Factory.assetCount() is accessible
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { FACTORY_ABI } from './abi/Factory';

const FACTORY_ADDRESS = '0x035E8F2533F002492C12486298D5Ff2F07900674';
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/UtllL6v6kMNFiAwAHQ7HU';

async function testFactoryRead() {
  console.log('🧪 Testing Factory.assetCount()...');
  console.log('Factory Address:', FACTORY_ADDRESS);
  console.log('RPC URL:', RPC_URL.substring(0, 50) + '...');

  try {
    const client = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    console.log('✅ Client created');

    const result = await client.readContract({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'assetCount',
    });

    console.log('✅ Asset Count Result:', result);
    console.log('✅ SUCCESS - Factory is readable!');
  } catch (error) {
    console.error('❌ ERROR reading Factory:', error);
  }
}

// Run test
testFactoryRead();
