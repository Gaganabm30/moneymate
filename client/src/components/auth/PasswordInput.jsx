import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function PasswordInput({
  placeholder,
  value,
  onChange,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-wrapper">

      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />

      <button
        type="button"
        className="eye-btn"
        onClick={() => setShow(!show)}
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>

    </div>
  );
}