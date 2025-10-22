import { useEffect, useState } from "react";
import { Search, Heart, Bell, TrendingDown, ShoppingCart } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse & Add to Wishlist",
    description:
      "Explore curated product lists and add your favorite items to your personal wishlist.",
  },
  {
    icon: Heart,
    title: "Set Your Price Threshold",
    description:
      "Define your target price and monitor products until the desired price is reached.",
  },
  {
    icon: Bell,
    title: "Get Instant Alerts",
    description:
      "Receive notifications when prices drop below your set threshold for quick action.",
  },
  {
    icon: TrendingDown,
    title: "Track Price Trends",
    description:
      "Analyze historical price data to know the best time to buy.",
  },
  {
    icon: ShoppingCart,
    title: "Buy Confidently",
    description:
      "Purchase via trusted affiliate links with complete price transparency.",
  },
];

const HowItWorksNavbar = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length);
    }, 3000); // auto-slide every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-8 bg-[hsl(10.1,67.8%,95%)]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-[hsl(10.1,67.8%,50%)]">
          How Personal Wishlist & Price Tracking Works
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Add products to your wishlist, monitor prices, get instant alerts, and buy at the right moment.
        </p>

        {/* Carousel Cards */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={index} className="flex-shrink-0 w-full md:w-1/5 px-2">
                  <div className="bg-white border border-[hsl(10.1,67.8%,50%)] rounded-xl shadow-lg p-4 h-64 flex flex-col justify-start items-center">
                    {/* Rectangular Step Number */}
                    <div className="flex items-center justify-center w-16 h-10 bg-[hsl(10.1,67.8%,50%)] text-white rounded-md mb-4 font-bold">
                      Step {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="text-[hsl(10.1,67.8%,50%)] mb-4">
                      <StepIcon className="w-8 h-8 mx-auto" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 text-center">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksNavbar;
