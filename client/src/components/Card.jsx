import React from 'react';

const Card = ({ children, className = '', onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`w-full bg-[#fdf8f8] border border-rose-100 rounded-2xl p-6 md:p-8 transition-all duration-300 shadow-sm shadow-rose-100/30
        ${onClick ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-md hover:shadow-rose-200/40 hover:border-rose-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
