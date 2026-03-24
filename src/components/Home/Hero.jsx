import React, { useState } from "react";
import { Link } from "react-router-dom";

function Hero() {
  const [active, setActive] = useState("");

  return (
   <section className="relative w-full min-h-[320px] bg-[url('/images/new-hero.jpg')] bg-cover lg:bg-contain bg-center py-16 sm:min-h-[380px] sm:py-24">
      <div className="absolute inset-0 bg-black/60 "></div>
      
      <div className="relative z-10 flex h-full items-center justify-center text-white">
        <div className="max-w-xl px-4 text-center sm:px-6">
          <h1 className="text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">Welcome to Elite Marketplace</h1>
          <p className="mt-4 text-sm sm:text-lg">Discover amazing deals from verified sellers</p>
          <Link to="/shoppage">
            <button
              onClick={() => setActive("shop")}
              className={`glow-cta mt-6 rounded-xl px-6 py-3 text-sm sm:text-base ${
                active === "shop" ? "bg-orange-700 text-white" : "bg-white text-orange-700"
              }`}
            >
              Shop Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
