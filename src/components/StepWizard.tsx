import { ReactNode } from 'react';
import { ModernModal } from './ModernModal';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  content: ReactNode;
  canProceed?: boolean;
  isCompleted?: boolean;
}

interface StepWizardProps {
  steps: WizardStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
}

export function StepWizard({ 
  steps, 
  isOpen, 
  onClose, 
  onComplete,
  currentStepIndex,
  onStepChange
}: StepWizardProps) {
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  return (
    <ModernModal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="space-y-8">
        {/* Progress Bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onStepChange(index)}
                className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full
                  transition-all duration-300 ease-out z-10
                  ${index <= currentStepIndex 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                  }
                  ${index === currentStepIndex ? 'ring-4 ring-purple-200 ring-opacity-50' : ''}
                `}
                disabled={index > currentStepIndex}
              >
                {step.isCompleted ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-100 to-blue-100">
              {currentStep.icon}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {currentStep.title}
          </h3>
          
          <p className="text-gray-600 max-w-md mx-auto">
            {currentStep.description}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="w-full transform transition-all duration-300 ease-out">
            {currentStep.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all duration-200
              ${isFirstStep 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }
            `}
          >
            ← Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
            >
              Cancel
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentStep.canProceed === false}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg
                ${currentStep.canProceed === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 hover:shadow-xl transform hover:scale-105'
                }
              `}
            >
              {isLastStep ? 'Complete' : 'Next'} →
            </button>
          </div>
        </div>
      </div>
    </ModernModal>
  );
} 