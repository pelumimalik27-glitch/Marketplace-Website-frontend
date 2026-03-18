import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center bg-[url('/images/Logo.png')]">
        {/* <span className="text-white font-bold text-lg">E</span> */}
      </div>
    </Link>
  );
}

export default Logo;