"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import PRICING_TABLE from "./pricingTable";
import { ChevronRight, Loader2 } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { PLAN_UUIDS } from "@/utils/stripe/config";

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  recommended?: boolean;
}

// Map Plan Names (from DB) to Config UUIDs
const PLAN_MAPPING: Record<string, string> = {
  'Individual': PLAN_UUIDS.INDIVIDUAL,
  'Developers': PLAN_UUIDS.DEVELOPERS,
  'Enterprise': PLAN_UUIDS.ENTERPRISE
};

const supabase = createClient();

// Memoized SVG components
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    className="mr-3 bg-purple-600/20 fill-purple-400 rounded-full p-[3px] flex-shrink-0"
    viewBox="0 0 24 24"
  >
    <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64 text-white">
    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
  </div>
);

// Toggle button component
const ToggleButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-[15px] font-medium py-2 px-4 tracking-wide rounded-full cursor-pointer transition-colors ${
      active
        ? "bg-purple-600 text-white"
        : "bg-transparent text-white/70 hover:text-white"
    }`}
  >
    {children}
  </button>
);

// Feature list item component
const FeatureItem = ({ feature }: { feature: string }) => (
  <li className="flex items-start text-[15px] text-white/70 font-medium">
    <CheckIcon />
    <span>{feature}</span>
  </li>
);

// --- NEW COMPONENT: Pricing Card with Subscribe Logic ---
const PricingCard = ({ plan, isMonthly }: { plan: Plan; isMonthly: boolean }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const planId = PLAN_MAPPING[plan.name];
    
    if (!planId) {
      console.error(`Plan mapping not found for: ${plan.name}`);
      return;
    }

    setLoading(true);
    try {
      await createSubscriptionCheckout(planId, isMonthly ? 'month' : 'year');
    } catch (error: any) {
      alert(error.message || "An error occurred during checkout.");
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white/2 backdrop-blur-lg border border-white/10 shadow-lg rounded-3xl p-6 hover:scale-[1.03] hover:bg-white/5 transition-all duration-300 flex flex-col ${
        plan.recommended
          ? "border-purple-500 shadow-[0_0_20px_3px_rgba(168,85,247,0.5)]"
          : ""
      }`}
    >
      <div className="relative h-full flex flex-col">
        <h4 className="text-white text-lg font-semibold mb-4">{plan.name}</h4>
        <h3 className="text-4xl font-semibold text-white">
          €{isMonthly ? plan.monthly_price : plan.yearly_price}
          <sub className="text-white/60 font-medium text-sm ml-1">
            / {isMonthly ? "month" : "year"}
          </sub>
        </h3>

        <hr className="my-6 border-white/10" />

        <ul className="space-y-4 flex-grow">
          {plan.features.map((feature, index) => (
            <FeatureItem key={`${plan.id}-${index}`} feature={feature} />
          ))}
        </ul>

        <div className="mt-8 pt-4">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className={`w-full px-4 py-2 text-[15px] font-medium tracking-wide 
            bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Get Started"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PricingInterface() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState(true);

  // Parse features from plan data
  const parseFeatures = useCallback((features: any): string[] => {
    let parsedFeatures: any = {};
    const featuresList: string[] = [];

    if (typeof features === "string") {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = {};
      }
    } else if (typeof features === "object" && features !== null) {
      parsedFeatures = features;
    }

    if (parsedFeatures.features && typeof parsedFeatures.features === "object") {
      Object.values(parsedFeatures.features).forEach((section: any) => {
        if (section.description) featuresList.push(section.description);
      });
    }

    if (parsedFeatures.ai_capabilities && Array.isArray(parsedFeatures.ai_capabilities)) {
      featuresList.push(...parsedFeatures.ai_capabilities.slice(0, 2));
    }

    return featuresList;
  }, []);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("id, name, monthly_price, yearly_price, features");

        if (error) throw error;

        const mappedPlans: Plan[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          monthly_price: p.monthly_price,
          yearly_price: p.yearly_price,
          features: parseFeatures(p.features),
          recommended: p.name === "Developers",
        }));

        // SORT PLANS: Individual → Developers → Enterprise
        const order = ["Individual", "Developers", "Enterprise"];
        const sortedPlans = mappedPlans.sort(
          (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
        );

        setPlans(sortedPlans);
      } catch (err) {
        console.error("Error fetching pricing data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [parseFeatures]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6 mt-[-30px]">
      {/* Monthly / Yearly Toggle */}
      <div className="flex mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-full max-w-[250px] p-1 mt-10">
        <ToggleButton active={isMonthly} onClick={() => setIsMonthly(true)}>
          Monthly
        </ToggleButton>
        <ToggleButton active={!isMonthly} onClick={() => setIsMonthly(false)}>
          <span className="flex items-center justify-center gap-2">
            Yearly
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                !isMonthly
                  ? "bg-white text-black"
                  : "bg-purple-600/20 text-purple-300"
              }`}
            >
              -20%
            </span>
          </span>
        </ToggleButton>
      </div>
      
      {/* Pricing Cards Grid */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 max-md:max-w-md max-md:mx-auto mt-8">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} isMonthly={isMonthly} />
        ))}
      </div>

      <div className="flex justify-center items-center mt-[15px] gap-2 cursor-default">
        <ChevronRight className="w-8 h-8 text-white/70 rotate-90 mb-[100px]" />
      </div>

      <PRICING_TABLE />
    </div>
  );
}