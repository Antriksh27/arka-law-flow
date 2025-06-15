
import React from 'react';
import { Card } from "@/components/ui/card";
import TeamTable from "@/components/team/TeamTable";

const TeamPage = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Team Management</h1>
      <Card className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <TeamTable />
      </Card>
    </div>
  );
};

export default TeamPage;
