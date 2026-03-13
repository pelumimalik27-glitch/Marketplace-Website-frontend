import React from "react";
import { Facebook, Twitter, Instagram, Youtube, Heart } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-11">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-orange-500 mb-4">Elite Marketplace</h2>
            <p className="text-gray-400 mb-6">
              The leading multi-vendor marketplace connecting buyers with trusted sellers worldwide. 
              Quality products, secure transactions, and exceptional customer service.
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                <Facebook size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                <Twitter size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                <Instagram size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Shop</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Categories</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Flash Deals</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Best Sellers</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Track Order</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Returns & Refunds</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
            </ul>
          </div>

          {/* Become a Seller */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Become a Seller</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white">Seller Registration</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Seller Dashboard</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Seller Guidelines</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Commission Rates</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Seller Support</a></li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-semibold mb-4">We Accept</h3>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white p-2 rounded">
              <span className="text-black font-bold">VISA</span>
            </div>
            <div className="bg-white p-2 rounded">
              <span className="text-blue-600 font-bold">MasterCard</span>
            </div>
            <div className="bg-white p-2 rounded">
              <span className="text-yellow-500 font-bold">PayStack</span>
            </div>
            <div className="bg-white p-2 rounded">
              <span className="text-black font-bold">Stripe</span>
            </div>
            <div className="bg-white p-2 rounded">
              <span className="text-green-600 font-bold">Apple Pay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Elite Marketplace. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Site Map</a>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Made with <Heart size={14} className="text-red-500" /> for the community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;