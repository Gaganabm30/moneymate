export default function ProgressStepper({step}){

return(

<div className="stepper">

<div className={step>=1?"active":""}>1</div>

<div className="line"></div>

<div className={step>=2?"active":""}>2</div>

<div className="line"></div>

<div className={step>=3?"active":""}>3</div>

</div>

);

}