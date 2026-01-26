"use client";
import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = {
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({
  href,
  onClick,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md border border-transparent font-medium uppercase tracking-wide no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-[0.7rem]',
    md: 'px-3 py-2 text-xs',
    lg: 'px-4 py-3 text-sm',
  };

  const cls = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
