'use client';

const STEPS = [
    { num: 1, label: 'Upload Jewelry' },
    { num: 2, label: 'AI Analysis' },
    { num: 3, label: 'Choose Template' },
    { num: 4, label: 'Generate' },
];

export default function StepProgress({ currentStep }) {
    return (
        <div className="step-progress">
            {STEPS.map((step, idx) => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        className={`step-item ${currentStep === step.num ? 'active' : ''
                            } ${currentStep > step.num ? 'completed' : ''}`}
                    >
                        <div className="step-circle">
                            {currentStep > step.num ? '✓' : step.num}
                        </div>
                        <span className="step-label">{step.label}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                        <div
                            className={`step-connector ${currentStep > step.num ? 'completed' : ''}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
