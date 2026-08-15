import { useState } from "react";
import { FiUser, FiMail, FiPhone, FiArrowRight, FiAlertCircle } from "react-icons/fi";

export default function StepOne({ formData = {}, updateFormData, next }) {
  const [error, setError] = useState("");

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      setError("Please enter a valid email address.");
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
        <label className="form-label" htmlFor="reg-name">Full Name</label>
        <div className="input-wrapper">
          <FiUser className="field-icon" />
          <input
            id="reg-name"
            type="text"
            placeholder="John Doe"
            value={formData.fullName || ""}
            onChange={(e) => {
              setError("");
              updateFormData("fullName", e.target.value);
            }}
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-email">Email Address</label>
        <div className="input-wrapper">
          <FiMail className="field-icon" />
          <input
            id="reg-email"
            type="email"
            placeholder="name@example.com"
            value={formData.email || ""}
            onChange={(e) => {
              setError("");
              updateFormData("email", e.target.value);
            }}
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="reg-phone">
          Phone Number <span className="optional-text">(Optional)</span>
        </label>
        <div className="input-wrapper">
          <FiPhone className="field-icon" />
          <input
            id="reg-phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone || ""}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <button type="submit" className="auth-submit-btn">
        <span>Continue to Security</span>
        <FiArrowRight className="btn-icon" />
      </button>
    </form>
  );
}