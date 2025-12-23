import { Terminal } from "lucide-react";
import PricingInterface from "../../../components/subscriptionFolder/subscriptionsBoxes";

export default function QuickActionsSection() {
  return (
    <div>
<div className="flex items-center gap-2 mb-4">
    <Terminal size={14} className="text-purple-600" strokeWidth={3} />
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Account Nodes</span>
  </div>
  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[0.95]">
    Billing <br /> 
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
      & Subscriptions.
    </span>
  </h1>      <PricingInterface></PricingInterface>
    </div>

  );
}