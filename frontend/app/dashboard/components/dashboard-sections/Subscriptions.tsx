import PricingInterface from "../../../components/subscriptionFolder/subscriptionsBoxes";

export default function QuickActionsSection() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-white">Subscriptions</h1>
      <p className="text-gray-400 mb-[-10px]">Your current subscription: Inactive;</p>
      <PricingInterface></PricingInterface>
    </div>
    
  );
}