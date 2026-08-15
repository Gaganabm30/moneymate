import { useState } from "react";
import { FiArrowLeft, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";

export default function StepTwo({ formData = {}, updateFormData, next, prev }) {
  const [error, setError] = useState("");

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    next();
  };

  return (
    <form onSubmit={handleNext} className="step-form">
      {error && (
        <div className="auth-alert alert-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor="reg-pass">Create Password</label>
        <PasswordInput
          placeholder="Min. 6 characters"
          value={formData.password || ""}
          onChange={(e) => {
            setError("");
            updateFormData("password", e.target.value);
          }}
        />
      </div>

      <PasswordStrength password={formData.password || ""} />

      <div className="form-field" style={{ marginTop: "12px" }}>
        <label className="form-label" htmlFor="reg-confirm-pass">Confirm Password</label>
        <PasswordInput
          placeholder="Re-enter password"
          value={formData.confirmPassword || ""}
          onChange={(e) => {
            setError("");
            updateFormData("confirmPassword", e.target.value);
          }}
          name="confirmPassword"
        />
      </div>

      <div className="wizard-buttons">
        <button type="button" className="wizard-btn secondary-btn" onClick={prev}>
          <FiArrowLeft className="btn-icon" />
          <span>Back</span>
        </button>

        <button type="submit" className="wizard-btn primary-btn">
          <span>Continue</span>
          <FiArrowRight className="btn-icon" />
        </button>
      </div>
    </form>
  );
}