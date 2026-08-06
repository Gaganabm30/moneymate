import PasswordStrength from "./PasswordStrength";

export default function StepTwo({next,prev}){

return(

<>

<div className="input-group">

<input
type="password"
placeholder="Password"
/>

</div>

<div className="input-group">

<input
type="password"
placeholder="Confirm Password"
/>

</div>

<PasswordStrength/>

<div className="wizard-buttons">

<button
className="secondary-btn"
onClick={prev}
>

Back

</button>

<button
className="login-btn"
onClick={next}
>

Next

</button>

</div>

</>

);

}