import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small practices and solo providers.",
      price: "$79",
      period: "/month",
      features: [
        "AI-powered chat widget",
        "Up to 150 chats per month",
        "Basic customization",
        "Email notifications"
      ],
      cta: "Start free trial",
      highlight: false
    },
    {
      name: "Professional",
      description: "Ideal for growing practices and clinics.",
      price: "$199",
      period: "/month",
      features: [
        "Everything in Starter",
        "Unlimited chats",
        "Advanced customization",
        "CRM integration",
        "Analytics dashboard"
      ],
      cta: "Start free trial",
      highlight: true
    },
    {
      name: "Enterprise",
      description: "For healthcare networks and hospital systems.",
      price: "Custom",
      period: "",
      features: [
        "Everything in Professional",
        "Multi-site support",
        "Enhanced security features",
        "Custom AI training",
        "Dedicated support team"
      ],
      cta: "Contact sales",
      highlight: false
    }
  ];

  return (
    <div className="py-16 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-12">
          <h2 className="text-base text-primary-500 font-semibold tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Choose the plan that's right for your healthcare practice.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`${
                plan.highlight 
                  ? "border-primary-300" 
                  : "border-gray-200"
              } border rounded-lg shadow-sm divide-y divide-gray-200`}
            >
              <div className="p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h2>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">{plan.period}</span>
                </p>
                <Link href="/register">
                  <Button 
                    className="mt-8 block w-full py-2 text-sm font-semibold text-center"
                    variant={plan.highlight ? "default" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, featIndex) => (
                    <li key={featIndex} className="flex space-x-3">
                      <svg className="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
