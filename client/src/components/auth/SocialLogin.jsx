import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function SocialLogin() {
  return (
    <div className="social-login-container">
      <div className="social-divider">
        <span></span>
        <p>Or continue with</p>
        <span></span>
      </div>

      <div className="social-buttons">
        <button type="button" className="social-btn google-btn">
          <FcGoogle className="social-icon" />
          <span>Google</span>
        </button>

        <button type="button" className="social-btn github-btn">
          <FaGithub className="social-icon" />
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
}