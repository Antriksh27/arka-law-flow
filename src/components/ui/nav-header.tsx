
"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Cases', href: '/cases' },
  { name: 'Clients', href: '/clients' },
  { name: 'Appointments', href: '/appointments' },
  { name: 'Hearings', href: '/hearings' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'Notes', href: '/notes' },
  { name: 'Messages', href: '/messages' },
  { name: 'Documents', href: '/documents' },
  { name: 'Team', href: '/team' },
];

function NavHeader() {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full border-2 border-[#E0E7FF] bg-white p-1 shadow-sm"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {navigation.map((item) => (
        <Tab key={item.name} setPosition={setPosition} href={item.href}>
          {item.name}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  href,
}: {
  children: React.ReactNode;
  setPosition: any;
  href: string;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-10 block cursor-pointer"
    >
      <Link 
        to={href}
        className={`block px-4 py-2 md:px-6 md:py-3 text-sm font-medium rounded-full transition-colors ${
          isActive
            ? 'bg-[#1E3A8A] text-white shadow'
            : 'text-[#1E3A8A] hover:bg-[#E0E7FF] hover:text-[#1E3A8A]'
        }`}
        style={{ letterSpacing: "0.05em" }}
      >
        {children}
      </Link>
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-8 md:h-12 rounded-full bg-[#E0E7FF]"
      style={{ top: 2 }}
    />
  );
};

export default NavHeader;
