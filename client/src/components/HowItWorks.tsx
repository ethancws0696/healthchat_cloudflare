export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Sign Up & Connect",
      description: "Create your account and add your website URL for our system to begin scanning and indexing your content."
    },
    {
      number: 2,
      title: "Customize & Brand",
      description: "Personalize your chat widget to match your brand colors, logo, and greeting messages to create a seamless experience."
    },
    {
      number: 3,
      title: "Deploy & Engage",
      description: "Add our code snippet to your website and start engaging with visitors 24/7, qualifying leads, and growing your practice."
    }
  ];

  return (
    <div className="py-16 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-500 font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple setup, powerful results
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Get started in minutes and see immediate improvements in patient engagement.
          </p>
        </div>

        <div className="mt-16">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-lg font-medium text-gray-900">Setup Process</span>
            </div>
          </div>

          <div className="mt-12 max-w-lg mx-auto grid gap-8 lg:grid-cols-3 lg:max-w-none">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        {step.number}
                      </div>
                      <h3 className="ml-3 text-xl font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="mt-3 text-base text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
