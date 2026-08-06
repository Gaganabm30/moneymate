import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function SocialLogin(){

return(

<>

<div className="divider">

<span></span>

<p>or continue with</p>

<span></span>

</div>

<div className="social-buttons">

<button>

<FcGoogle/>

Google

</button>

<button>

<FaGithub/>

GitHub

</button>

</div>

</>

);

}