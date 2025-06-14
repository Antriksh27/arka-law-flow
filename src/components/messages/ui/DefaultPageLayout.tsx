
import React from "react";

interface DefaultPageLayoutProps {
  children: React.ReactNode;
}

export const DefaultPageLayout: React.FC<DefaultPageLayoutProps> = ({
  children,
}) => (
  <div className="min-h-screen w-full bg-[#F9FAFB]">{children}</div>
);

export default DefaultPageLayout;
