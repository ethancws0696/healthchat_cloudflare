import ChatWidget from "@/components/ChatWidget";

export default function DemoSection() {
  return (
    <div className="py-12 bg-gray-50" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary-500 font-semibold tracking-wide uppercase">See it in action</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Experience the HealthChat AI widget
          </p>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="aspect-w-16 aspect-h-9">
                <img 
                  className="rounded-md object-cover w-full h-full" 
                  src="https://images.unsplash.com/photo-1576671414121-aa2d0967b1cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80" 
                  alt="Doctor's office waiting room" 
                />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">North Shore Health Center</h3>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Boston, Massachusetts</span>
              </div>
              <p className="mt-3 text-base text-gray-500">
                Comprehensive family health center offering primary care, pediatrics, and mental health services. Accepting new patients and most insurance plans.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <ChatWidget isDemo={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
