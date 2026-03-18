import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Go to homepage">
      <img
        src="/images/Logo.png"
        alt="Elite Marketplace logo"
        className="h-10 w-10 rounded-full object-cover"
      />
    </Link>
  );
}

export default Logo;
