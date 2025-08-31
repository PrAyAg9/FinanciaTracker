import React, { useState } from 'react';
import Header from '../components/layout/Header';
import FilterBar from '../components/transactions/FilterBar';
import TransactionList from '../components/transactions/TransactionList';
import EditTransactionModal from '../components/transactions/EditTransactionModal';

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

const TransactionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedType, setSelectedType] = useState('All types');
  const [dateRange, setDateRange] = useState('This month');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingTransaction(null);
  };

  const handleTransactionDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const filters = {
    searchTerm,
    selectedCategory,
    selectedType,
    dateRange
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">View and manage all your financial transactions</p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        {/* Transaction List */}
        <TransactionList
          filters={filters}
          refreshTrigger={refreshTrigger}
          onEdit={setEditingTransaction}
          onDelete={handleTransactionDeleted}
        />

        {/* Edit Modal */}
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSave={handleTransactionUpdated}
          />
        )}
      </main>
    </div>
  );
};

export default TransactionsPage;