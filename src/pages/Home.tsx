import { useState, useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectDiscord } from "../components/ConnectDiscord";
import { LinkWallet } from "../components/LinkWallet";
import { TokenBalanceDisplay } from "../components/TokenBalanceDisplay";
import { useAuth } from "../hooks/AuthContext";
import { useTokenBalance } from "../hooks/useTokenBalance";

export function Home() {
  const { authState } = useAuth();
  const currentAccount = useCurrentAccount();
  const { balance } = useTokenBalance();
  const [currentStep, setCurrentStep] = useState(1);

  // Step completion logic
  const isDiscordConnected = authState.isAuthenticated && authState.user;
  const isWalletConnected = currentAccount?.address;
  const hasLinkedWallets = isDiscordConnected && authState.user?.suiAddresses && authState.user.suiAddresses.length > 0;

  // Auto-advance steps
  useEffect(() => {
    if (isDiscordConnected && currentStep === 1) {
      setCurrentStep(2);
    }
    if (hasLinkedWallets && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [isDiscordConnected, hasLinkedWallets, currentStep]);

  const steps = [
    { id: 1, title: 'Discord', completed: isDiscordConnected },
    { id: 2, title: 'Wallet', completed: hasLinkedWallets },
    { id: 3, title: 'Roles', completed: balance > 0 }
  ];

  return (
    <div className="full-height flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-3xl font-bold mb-2">Sui Turkey</h1>
          
          {/* Steps */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  step-circle
                  ${currentStep === step.id ? 'active' : ''}
                  ${step.completed ? 'done' : ''}
                `}>
                  {step.completed ? '✓' : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-700 mx-3">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: step.completed ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="minimal-card p-6 fade-in">
          
          {/* Step 1: Discord */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold">Connect Discord</h2>
              <ConnectDiscord />
            </div>
          )}

          {/* Step 2: Wallet */}
          {currentStep === 2 && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold">Manage Wallets</h2>
              
              {!isWalletConnected ? (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">Connect your Sui wallet to link it to your account</p>
                  <ConnectButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="badge-success">✓ Wallet Connected</div>
                  <LinkWallet />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Roles */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center">Token Balance & Roles</h2>
              <TokenBalanceDisplay />
              
              {/* Additional wallet management for step 3 */}
              {isWalletConnected && (
                <div className="pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 text-center mb-3">
                    Wallet Management
                  </h3>
                  <LinkWallet />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="text-gray-400 disabled:opacity-30 hover:text-white transition-colors"
            >
              ← Back
            </button>

            <div className="flex space-x-1">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step.id === currentStep ? 'bg-indigo-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              disabled={currentStep === 3 || (currentStep === 1 && !isDiscordConnected) || (currentStep === 2 && !hasLinkedWallets)}
              className="text-indigo-400 disabled:opacity-30 hover:text-indigo-300 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 