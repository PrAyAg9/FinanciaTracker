import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Edit, Trash2, Loader } from 'lucide-react';
import { Transaction } from '../../pages/TransactionsPage';
import { transactionService } from '../../services/transactionService';

interface TransactionListProps {
  filters: {
    searchTerm: string;
    selectedCategory: string;
    selectedType: string;
    dateRange: string;
  };
  refreshTrigger: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ filters, refreshTrigger, onEdit, onDelete }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await transactionService.getTransactions({
          limit: 50,
          page: 1
        });
        
        // Transform API response to match component interface
        const transformedTransactions = response.transactions.map((t: any) => ({
          id: t._id,
          description: t.description,
          category: t.category,
          amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
          date: new Date(t.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric', 
            year: 'numeric'
          }),
          type: t.type
        }));
        
        setTransactions(transformedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [refreshTrigger]); // Refresh when trigger changes

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesCategory = filters.selectedCategory === 'All categories' || transaction.category === filters.selectedCategory;
    const matchesType = filters.selectedType === 'All types' || transaction.type === filters.selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDelete = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(transactionId);
        onDelete();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Failed to delete transaction');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Transactions ({filteredTransactions.length})
          </h2>
          <div className="text-sm text-gray-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-100">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-lg">{transaction.description}</h4>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                      {transaction.category}
                    </span>
                    <span>{transaction.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`text-xl font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 text-lg">No transactions found matching your filters.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria or date range.</p>
        </div>
      )}

      {/* Pagination would go here in a real app */}
      {filteredTransactions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing 1-{filteredTransactions.length} of {filteredTransactions.length} results
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;