'use client';

export default function DocsPage() {
  const sections = [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', desc: 'Learn about tokenized assets and RWA' },
        { title: 'Connect Your Wallet', desc: 'How to connect MetaMask and other wallets' },
        { title: 'KYC Verification', desc: 'Complete your identity verification' },
      ],
    },
    {
      title: 'User Guide',
      items: [
        { title: 'Browsing Assets', desc: 'Discover tokenized real-world assets' },
        { title: 'Investing', desc: 'How to invest in tokenized assets' },
        { title: 'Managing Portfolio', desc: 'Track and manage your investments' },
        { title: 'Trading', desc: 'Buy and sell tokenized assets' },
      ],
    },
    {
      title: 'Advanced',
      items: [
        { title: 'Smart Contracts', desc: 'Understanding the blockchain layer' },
        { title: 'Compliance', desc: 'Regulatory and compliance information' },
        { title: 'API Reference', desc: 'Technical documentation for developers' },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-gray-600 text-lg mb-8">
        Everything you need to know about using the Tokenized Asset Management Platform
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item, itemIdx) => (
                <a
                  key={itemIdx}
                  href="#"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-blue-600 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-white border rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">What are Real World Assets (RWA)?</h3>
            <p className="text-gray-600">
              Real World Assets are physical or traditional financial assets that have been tokenized on the
              blockchain, enabling fractional ownership and easier trading.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Do I need to complete KYC?</h3>
            <p className="text-gray-600">
              Yes, KYC verification is required to comply with regulations and ensure a secure trading
              environment for all users.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">What wallets are supported?</h3>
            <p className="text-gray-600">
              We support MetaMask, WalletConnect, Coinbase Wallet, and other popular Ethereum-compatible
              wallets.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Are my funds safe?</h3>
            <p className="text-gray-600">
              All assets are managed by audited smart contracts on the blockchain. You maintain full custody
              of your assets through your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">Need more help?</h3>
        <p className="text-gray-700 mb-4">
          Can't find what you're looking for? Contact our support team.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}
