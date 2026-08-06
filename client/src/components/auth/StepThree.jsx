export default function StepThree({prev}){

return(

<>

<div className="input-group">

<select>

<option>India</option>

<option>United States</option>

<option>United Kingdom</option>

</select>

</div>

<div className="input-group">

<select>

<option>INR ₹</option>

<option>USD $</option>

<option>EUR €</option>

</select>

</div>

<div className="input-group">

<input
placeholder="Monthly Income (Optional)"
/>

</div>

<label className="terms">

<input type="checkbox"/>

I agree to the Terms & Privacy Policy

</label>

<div className="wizard-buttons">

<button
className="secondary-btn"
onClick={prev}
>

Back

</button>

<button
className="login-btn">

Create Account

</button>

</div>

</>

);

}