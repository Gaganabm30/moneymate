import { useState } from "react";

import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";

import ProgressStepper from "./ProgressStepper";

export default function RegisterForm(){

const [step,setStep]=useState(1);

const next=()=>setStep(step+1);

const prev=()=>setStep(step-1);

return(

<div className="login-card">

<h1>Create Account</h1>

<p>Start your smart finance journey.</p>

<ProgressStepper step={step}/>

{step===1 && <StepOne next={next}/>}

{step===2 && <StepTwo next={next} prev={prev}/>}

{step===3 && <StepThree prev={prev}/>}

</div>

);

}