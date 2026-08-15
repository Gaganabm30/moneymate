import FloatingCards from "./FloatingCards";
import { FiStar } from "react-icons/fi";

export default function AuthIllustration() {
  return (
    <div className="illustration">

      {/* Brand Badge */}
      <div className="illustration-badge">
        <FiStar />
        <span>MoneyMate AI</span>
      </div>

      {/* Main Heading */}
      <h1>
        Smart Finance
        <br />
        Starts Here.
      </h1>

      {/* Description */}
      <p>
        Manage your expenses, budgets and savings with{" "}
        <strong>AI-powered insights.</strong>{" "}
        Track every rupee, understand your spending habits,
        and make smarter financial decisions.
      </p>

      {/* Floating Finance Cards */}
      <FloatingCards />

    </div>
  );
}