import BalanceCard from "./BalanceCard";
import AnimatedChart from "./AnimatedChart";
import AIInsightCard from "./AIInsightCard";
import TransactionTicker from "./TransactionTicker";

import "./LiveDashboard.css";

export default function LiveDashboard(){

return(

<div className="dashboard-preview">

    <BalanceCard />

    <AnimatedChart />

    <AIInsightCard />

    <TransactionTicker />

</div>

);

}