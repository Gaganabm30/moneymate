import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { month:"Jan", income:42, expense:28 },
  { month:"Feb", income:48, expense:26 },
  { month:"Mar", income:52, expense:34 },
  { month:"Apr", income:49, expense:31 },
  { month:"May", income:60, expense:36 },
  { month:"Jun", income:58, expense:33 }
];

export default function AnimatedChart(){

return(

<>

<h3>Income vs Expense</h3>

<ResponsiveContainer width="100%" height={260}>

<AreaChart data={data}>

<XAxis dataKey="month"/>

<Tooltip/>

<Area
type="monotone"
dataKey="income"
stroke="#635BFF"
fill="#8C82FF"
fillOpacity={0.25}
/>

<Area
type="monotone"
dataKey="expense"
stroke="#FF5B6B"
fill="#FF9DA7"
fillOpacity={0.18}
/>

</AreaChart>

</ResponsiveContainer>

</>

);

}