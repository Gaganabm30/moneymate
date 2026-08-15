import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordInput({
  placeholder = "Enter password",
  value,
  onChange,
  name = "password"
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-wrapper">
      <FiLock className="field-icon" />
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="form-input"
        required
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}