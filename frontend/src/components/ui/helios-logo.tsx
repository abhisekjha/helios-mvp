import React from 'react';

interface HeliosLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6', 
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export function HeliosLogo({ size = 'md', className = '' }: HeliosLogoProps) {
  const sizeClass = sizeMap[size];
  
  return (
    <img 
      src="/heliosLogo.svg" 
      alt="Helios AI Agent" 
      className={`${sizeClass} ${className}`}
    />
  );
}
