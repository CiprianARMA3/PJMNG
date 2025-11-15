"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import PRICING_TABLE from "./pricingTable";
import { ChevronRight } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  recommended?: boolean;
}

const supabase = createClient();

export default function PricingInterface() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("id, name, monthly_price, yearly_price, features");

        if (error) throw error;

        const mappedPlans: Plan[] = (data || []).map((p: any) => {
          let parsedFeatures: any = {};

          if (typeof p.features === "string") {
            try {
              parsedFeatures = JSON.parse(p.features);
            } catch {
              parsedFeatures = {};
            }
          } else if (typeof p.features === "object" && p.features !== null) {
            parsedFeatures = p.features;
          }

          const featuresList: string[] = [];
          if (parsedFeatures.features && typeof parsedFeatures.features === "object") {
            Object.values(parsedFeatures.features).forEach((section: any) => {
              if (section.description) featuresList.push(section.description);
            });
          }

          // Optional: include first 2 AI capabilities
          if (parsedFeatures.ai_capabilities && Array.isArray(parsedFeatures.ai_capabilities)) {
            featuresList.push(...parsedFeatures.ai_capabilities.slice(0, 2));
          }

          return {
            id: p.id,
            name: p.name,
            monthly_price: p.monthly_price,
            yearly_price: p.yearly_price,
            features: featuresList,
            recommended: p.name === "Developers", // Developer gets glowy border
          };
        });

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
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-white">
                <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 mt-[-30px]">
      {/* Monthly / Yearly Toggle */}
      <div className="flex mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-full max-w-[250px] p-1 mt-10">
        <button
          onClick={() => setIsMonthly(true)}
          className={`w-full text-[15px] font-medium py-2 px-4 tracking-wide rounded-full cursor-pointer ${
            isMonthly
              ? "bg-purple-600 text-white"
              : "bg-transparent text-white/70 hover:text-white transition"
          }`}
        >
          Monthly
        </button>
          <button
            onClick={() => setIsMonthly(false)}
            className={`w-full text-[15px] font-medium py-2 px-4 tracking-wide rounded-full cursor-pointer flex items-center justify-center gap-2 ${
              !isMonthly
                ? "bg-purple-600 text-white"
                : "bg-transparent text-white/70 hover:text-white transition"
            }`}
          >
            Yearly
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                !isMonthly
                  ? "bg-white text-black" // active: white badge with black text
                  : "bg-purple-600/20 text-purple-300" // inactive: soft purple
              }`}
            >
              -20%
            </span>
          </button>

      </div>
      

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 max-md:max-w-md max-md:mx-auto mt-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white/2 backdrop-blur-lg border border-white/10 shadow-lg rounded-3xl p-6 hover:scale-[1.03] hover:bg-white/5 transition-all duration-300 ${
              plan.recommended
                ? "border-purple-500 shadow-[0_0_20px_3px_rgba(168,85,247,0.5)]"
                : ""
            }`}
          >
            <div className="relative h-full">
              <h4 className="text-white text-lg font-semibold mb-4">{plan.name}</h4>
              <h3 className="text-4xl font-semibold text-white">
                €{isMonthly ? plan.monthly_price : plan.yearly_price}
                <sub className="text-white/60 font-medium text-sm ml-1">
                  / {isMonthly ? "month" : "year"}
                </sub>
              </h3>

              <hr className="my-6 border-white/10" />

              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center text-[15px] text-white/70 font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      className="mr-3 bg-purple-600/20 fill-purple-400 rounded-full p-[3px]"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="min-h-[38px] mt-8">
                <button
                  type="button"
                  className="absolute bottom-0 left-0 right-0 w-full px-4 py-2 text-[15px] font-medium tracking-wide 
                  bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center mt-[15px] gap-2 cursor-default">
        <ChevronRight className="w-8 h-8 text-white/70 rotate-90" />
      </div>
        {/* <div
          style={{
            backgroundColor:"white",
            position: "absolute",
            inset: 0,
            backgroundImage: 'url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")',
            backgroundSize: "200px",
            backgroundRepeat: "repeat",
            opacity: 0.05,
          }}
        ></div> */}
       <PRICING_TABLE /> 
    </div>

  );
}
