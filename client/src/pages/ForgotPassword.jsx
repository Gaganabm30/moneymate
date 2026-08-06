import { Link } from "react-router-dom";

import "../styles/auth.css";

export default function ForgotPassword(){

return(

<div className="auth-page">

<div className="login-card">

<h1>Forgot Password</h1>

<p>

Enter your email to receive a password reset link.

</p>

<div className="input-group">

<label>Email</label>

<input
type="email"
placeholder="Enter email"
/>

</div>

<button className="login-btn">

Send Reset Link

</button>

<div className="bottom-link">

<Link to="/login">

← Back to Login

</Link>

</div>

</div>

</div>

);

}