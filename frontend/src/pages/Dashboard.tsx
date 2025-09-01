import React, { useState, useCallback } from "react";
import Header from "../components/layout/Header";
import SummaryCards from "../components/dashboard/SummaryCards";
import TransactionInput from "../components/dashboard/TransactionInput";
import SpendingChart from "../components/dashboard/SpendingChart";
import TrendsChart from "../components/dashboard/TrendsChart";

const Dashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionAdded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Track your financial journey</p>
        </div>

        {/* Summary Cards - Only refresh on data changes */}
        <div key={`summary-${refreshTrigger}`} className="mb-8">
          <SummaryCards />
        </div>

        {/* AI Transaction Input */}
        <div className="mb-8">
          <TransactionInput onTransactionAdded={handleTransactionAdded} />
        </div>

        {/* Charts Section - Only refresh on data changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div key={`spending-${refreshTrigger}`}>
            <SpendingChart />
          </div>
          <div key={`trends-${refreshTrigger}`}>
            <TrendsChart />
          </div>
        </div>


      </main>
    </div>
  );
};

export default Dashboard;
