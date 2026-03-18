import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center ">
        <span className="text-white font-bold text-lg  bg-[url('/images/Logo.png')]"></span>
      </div>
    </Link>
  );
}

export default Logo;