import { FiCheck } from "react-icons/fi";

export default function ProgressStepper({ step }) {
  const steps = [
    { num: 1, title: "Account" },
    { num: 2, title: "Security" },
    { num: 3, title: "Preferences" },
  ];

  return (
    <div className="stepper-container">
      <div className="stepper-track">
        {steps.map((s, idx) => {
          const isCompleted = step > s.num;
          const isActive = step === s.num;

          return (
            <div key={s.num} className="stepper-item-wrapper">
              <div className={`stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                <div className="step-badge">
                  {isCompleted ? <FiCheck /> : s.num}
                </div>
                <span className="step-label">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`stepper-connector ${step > s.num ? "filled" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}