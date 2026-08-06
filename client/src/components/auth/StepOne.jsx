export default function StepOne({next}){

return(

<>

<div className="input-group">

<input
placeholder="Full Name"
/>

</div>

<div className="input-group">

<input
placeholder="Email"
/>

</div>

<div className="input-group">

<input
placeholder="Phone"
/>

</div>

<button
className="login-btn"
onClick={next}
>

Next →

</button>

</>

);

}