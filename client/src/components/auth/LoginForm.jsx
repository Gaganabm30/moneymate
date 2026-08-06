import { Link } from "react-router-dom";
import { useState } from "react";

import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";

export default function LoginForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (

    <div className="login-card">

      <h1>Welcome Back 👋</h1>

      <p>
        Login to continue managing your finances.
      </p>

      <div className="input-group">

        <label>Email</label>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

      </div>

      <div className="input-group">

        <label>Password</label>

        <PasswordInput
          placeholder="Enter password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

      </div>

      <div className="login-options">

        <label className="remember">

          <input type="checkbox"/>

          Remember me

        </label>

        <Link to="/forgot-password">
          Forgot Password?
        </Link>

      </div>

      <button className="login-btn">

        Login

      </button>

      <SocialLogin/>

      <div className="bottom-link">

        Don't have an account?

        <Link to="/register">

          Register

        </Link>

      </div>

    </div>

  );

}