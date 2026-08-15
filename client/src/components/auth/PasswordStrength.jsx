export default function PasswordStrength({ password = "" }) {
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: "Enter a password", color: "var(--neutral-300, #E5E7EB)", width: "0%" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score, label: "Weak password", color: "#EF4444", width: "25%" };
      case 2:
        return { score, label: "Fair password", color: "#F59E0B", width: "50%" };
      case 3:
        return { score, label: "Good password", color: "#3B82F6", width: "75%" };
      case 4:
        return { score, label: "Strong password", color: "#10B981", width: "100%" };
      default:
        return { score: 0, label: "Too short (min 8 chars)", color: "#EF4444", width: "15%" };
    }
  };

  const strength = getStrength(password);

  return (
    <div className="strength-meter">
      <div className="strength-bar-bg">
        <div
          className="strength-bar-fill"
          style={{ width: strength.width, backgroundColor: strength.color }}
        />
      </div>
      <span className="strength-text" style={{ color: password ? strength.color : "#6B7280" }}>
        {strength.label}
      </span>
    </div>
  );
}