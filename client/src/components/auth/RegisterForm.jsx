import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import ProgressStepper from "./ProgressStepper";
import SocialLogin from "./SocialLogin";

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "India",
    currency: "INR",
    monthlyIncome: "",
    agreeTerms: false,
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  const updateFormData = (key, value) => {
    setError("");
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const next = () => {
    setError("");
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prev = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitFinal = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Please complete all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await register({
        fullName: formData.fullName,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        country: formData.country,
        currency: formData.currency,
        monthlyIncome: formData.monthlyIncome,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.code === "ERR_NETWORK" || !err?.response) {
        setError("Unable to connect to server.");
      } else if (err?.response?.status === 409) {
        setError("Email already registered.");
      } else if (err?.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Registration failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card register-card">
      <div className="auth-header">
        <h1>Get Started 🚀</h1>
        <p>Create your MoneyMate account in 3 simple steps.</p>
      </div>

      {error && (
        <div className="auth-alert alert-error">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <ProgressStepper step={step} />

      <div className="step-content">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <StepOne formData={formData} updateFormData={updateFormData} next={next} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <StepTwo formData={formData} updateFormData={updateFormData} next={next} prev={prev} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <StepThree
                formData={formData}
                updateFormData={updateFormData}
                prev={prev}
                onSubmit={handleSubmitFinal}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 1 && <SocialLogin />}

      <div className="auth-footer-link">
        <span>Already have an account?</span>
        <Link to="/login" className="accent-link">Sign In</Link>
      </div>
    </div>
  );
}