import {
  FiGlobe,
  FiDollarSign,
  FiTrendingUp,
  FiArrowLeft,
  FiStar
} from "react-icons/fi";

export default function StepThree({
  formData = {},
  updateFormData,
  prev,
  onSubmit,
  loading = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="step-form">

      {/* Country / Region */}
      <div className="form-field">
        <label
          className="form-label"
          htmlFor="reg-country"
        >
          Country / Region
        </label>

        <div className="input-wrapper">
          <FiGlobe className="field-icon" />

          <select
            id="reg-country"
            value={formData.country || "India"}
            onChange={(e) =>
              updateFormData("country", e.target.value)
            }
            className="form-input form-select"
          >
            <option value="India">
              India 🇮🇳
            </option>

            <option value="United States">
              United States 🇺🇸
            </option>

            <option value="United Kingdom">
              United Kingdom 🇬🇧
            </option>

            <option value="Canada">
              Canada 🇨🇦
            </option>

            <option value="Australia">
              Australia 🇦🇺
            </option>

            <option value="Germany">
              Germany 🇩🇪
            </option>

            <option value="Singapore">
              Singapore 🇸🇬
            </option>
          </select>
        </div>
      </div>


      {/* Preferred Currency */}
      <div className="form-field">
        <label
          className="form-label"
          htmlFor="reg-currency"
        >
          Preferred Currency
        </label>

        <div className="input-wrapper">
          <FiDollarSign className="field-icon" />

          <select
            id="reg-currency"
            value={formData.currency || "INR"}
            onChange={(e) =>
              updateFormData("currency", e.target.value)
            }
            className="form-input form-select"
          >
            <option value="INR">
              INR (₹) - Indian Rupee
            </option>

            <option value="USD">
              USD ($) - US Dollar
            </option>

            <option value="EUR">
              EUR (€) - Euro
            </option>

            <option value="GBP">
              GBP (£) - British Pound
            </option>

            <option value="CAD">
              CAD ($) - Canadian Dollar
            </option>

            <option value="AUD">
              AUD ($) - Australian Dollar
            </option>
          </select>
        </div>
      </div>


      {/* Monthly Income */}
      <div className="form-field">
        <label
          className="form-label"
          htmlFor="reg-income"
        >
          Monthly Income
          <span className="optional-text">
            {" "} (Optional)
          </span>
        </label>

        <div className="input-wrapper">
          <FiTrendingUp className="field-icon" />

          <input
            id="reg-income"
            type="number"
            min="0"
            placeholder="e.g. 50000"
            value={formData.monthlyIncome || ""}
            onChange={(e) =>
              updateFormData(
                "monthlyIncome",
                e.target.value
              )
            }
            className="form-input"
          />
        </div>
      </div>


      {/* Terms */}
      <label className="terms-checkbox">

        <input
          type="checkbox"
          checked={formData.agreeTerms || false}
          onChange={(e) =>
            updateFormData(
              "agreeTerms",
              e.target.checked
            )
          }
          required
        />

        <span>
          I agree to the{" "}

          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
          >
            Terms of Service
          </a>

          {" "}and{" "}

          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
          >
            Privacy Policy
          </a>
        </span>

      </label>


      {/* Navigation Buttons */}
      <div className="wizard-buttons">

        <button
          type="button"
          className="wizard-btn secondary-btn"
          onClick={prev}
          disabled={loading}
        >
          <FiArrowLeft className="btn-icon" />

          <span>
            Back
          </span>
        </button>


        <button
          type="submit"
          className="wizard-btn primary-btn submit-final-btn"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner-sm" />
          ) : (
            <>
              <FiStar className="btn-icon" />

              <span>
                Create Account
              </span>
            </>
          )}
        </button>

      </div>

    </form>
  );
}