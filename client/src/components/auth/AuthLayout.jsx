import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthIllustration from "./AuthIllustration";

import "../../styles/auth.css";

export default function AuthLayout({ mode }) {

    return (

        <div className="auth-page">

            <div className="auth-left">

                <AuthIllustration />

            </div>

            <div className="auth-right">

                {mode==="login"
                    ? <LoginForm/>
                    : <RegisterForm/>
                }

            </div>

        </div>

    );

}