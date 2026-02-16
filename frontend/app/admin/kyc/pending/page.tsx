'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { kycABI } from '@/abi/KYC';

const KYC_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_KYC_ADDRESS || '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1') as const;

interface KYCRequest {
  user: string;
  fullName: string;
  country: string;
  documentType: string;
  documentNumber: string;
  timestamp: bigint;
  status: number; // 0=NONE, 1=PENDING, 2=APPROVED, 3=REJECTED
}

export default function KYCPendingPage() {
  const { address } = useAccount();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Get pending requests
  const { data: pendingAddresses, isLoading, refetch } = useReadContract({
    address: KYC_CONTRACT_ADDRESS,
    abi: kycABI,
    functionName: 'getPendingRequests',
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess, refetch]);

  const handleApprove = async (userAddress: string) => {
    writeContract({
      address: KYC_CONTRACT_ADDRESS,
      abi: kycABI,
      functionName: 'approveKYC',
      args: [userAddress as `0x${string}`],
    });
  };

  const handleReject = async (userAddress: string) => {
    writeContract({
      address: KYC_CONTRACT_ADDRESS,
      abi: kycABI,
      functionName: 'rejectKYC',
      args: [userAddress as `0x${string}`],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pending KYC Applications</h1>

      {/* Admin Status */}
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{address}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          ⚠️ Only KYC_ADMIN_ROLE can approve/reject applications
        </p>
      </div>

      {/* Pending Requests */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending applications...</p>
        </div>
      ) : (pendingAddresses as string[] || []).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
          <p className="text-2xl mb-2">✅</p>
          <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
          <p className="text-gray-600 dark:text-gray-400">
            All KYC applications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(pendingAddresses as string[] || []).map((userAddress: string) => (
            <KYCRequestCard
              key={userAddress}
              userAddress={userAddress}
              onApprove={handleApprove}
              onReject={handleReject}
              isPending={isPending}
              isConfirming={isConfirming}
            />
          ))}
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200">
          ✅ Transaction confirmed! Hash: {hash?.slice(0, 10)}...
        </div>
      )}
    </div>
  );
}

// Component to display individual KYC request
function KYCRequestCard({
  userAddress,
  onApprove,
  onReject,
  isPending,
  isConfirming,
}: {
  userAddress: string;
  onApprove: (address: string) => void;
  onReject: (address: string) => void;
  isPending: boolean;
  isConfirming: boolean;
}) {
  const { data: kycRequest } = useReadContract({
    address: KYC_CONTRACT_ADDRESS,
    abi: kycABI,
    functionName: 'getKYCRequest',
    args: [userAddress as `0x${string}`],
  });

  if (!kycRequest) return null;

  const request = kycRequest as unknown as KYCRequest;
  const date = new Date(Number(request.timestamp) * 1000);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
              <span className="ml-2 font-medium">{request.fullName}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Country:</span>
              <span className="ml-2 font-medium">{request.country}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Document Type:</span>
              <span className="ml-2 font-medium capitalize">{request.documentType}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Document Number:</span>
              <span className="ml-2 font-medium">{request.documentNumber}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Wallet:</span>
              <span className="ml-2 font-mono text-xs">{userAddress}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
              <span className="ml-2">{date.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-4">
          <button
            onClick={() => onApprove(userAddress)}
            disabled={isPending || isConfirming}
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <span>✅</span>
            <span>{isPending || isConfirming ? 'Processing...' : 'Approve KYC'}</span>
          </button>
          <button
            onClick={() => onReject(userAddress)}
            disabled={isPending || isConfirming}
            className="btn btn-secondary bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <span>❌</span>
            <span>{isPending || isConfirming ? 'Processing...' : 'Reject KYC'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
