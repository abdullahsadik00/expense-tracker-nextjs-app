// components/alerts/MerchantAlerts.tsx
'use client';

import { useState, useEffect } from 'react';

interface MerchantAlert {
  merchant: string;
  category_name: string;
  transaction_count: number;
  total_spent: string;
  avg_transaction: string;
  max_transaction: string;
  spending_alert: string;
  spend_rank: number;
}

/**
 * MerchantAlerts - Identifies unusual spending patterns with specific merchants
 * Flags: Single large purchases, frequent high spending, high average discretionary spending
 * Helps prevent overspending and identify problematic merchant relationships
 */
export default function MerchantAlerts() {
  const [alerts, setAlerts] = useState<MerchantAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'SINGLE_LARGE_PURCHASE' | 'FREQUENT_HIGH_SPEND' | 'HIGH_AVG_DISCRETIONARY' | 'VERY_LARGE_PURCHASE'>('all');

  useEffect(() => {
    const fetchMerchantAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/merchant-alerts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch merchant alerts');
        }
        
        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error('Error fetching merchant alerts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantAlerts();
  }, []);

  // Filter alerts based on selected filter
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.spending_alert === filter);

  // Get alert type configuration
  const getAlertConfig = (alertType: string) => {
    switch (alertType) {
      case 'SINGLE_LARGE_PURCHASE':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '💳',
          title: 'Single Large Purchase',
          description: 'One-time large purchase that exceeds normal spending patterns'
        };
      case 'FREQUENT_HIGH_SPEND':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '🔄',
          title: 'Frequent High Spending',
          description: 'Multiple high-value transactions with this merchant'
        };
      case 'HIGH_AVG_DISCRETIONARY':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '🎯',
          title: 'High Average Discretionary',
          description: 'Consistently high spending on discretionary categories'
        };
      case 'VERY_LARGE_PURCHASE':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: '🚨',
          title: 'Very Large Purchase',
          description: 'Exceptionally large purchase requiring attention'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '📊',
          title: 'Normal',
          description: 'Normal spending pattern'
        };
    }
  };

  // Calculate summary statistics
  const summary = {
    totalAlerts: alerts.length,
    totalAmount: alerts.reduce((sum, alert) => sum + parseFloat(alert.total_spent), 0),
    highRisk: alerts.filter(alert => 
      alert.spending_alert === 'SINGLE_LARGE_PURCHASE' || 
      alert.spending_alert === 'VERY_LARGE_PURCHASE'
    ).length
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Merchant Spending Alerts</h3>
            <p className="text-sm text-gray-600">
              Unusual spending patterns detected with {alerts.length} merchants
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-3 sm:mt-0 flex space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-red-600">{summary.highRisk}</div>
              <div className="text-gray-500">High Risk</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{summary.totalAlerts}</div>
              <div className="text-gray-500">Total Alerts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                ₹{summary.totalAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-gray-500">Total Amount</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Alerts', count: alerts.length },
            { key: 'SINGLE_LARGE_PURCHASE', label: 'Large Purchases', count: alerts.filter(a => a.spending_alert === 'SINGLE_LARGE_PURCHASE').length },
            { key: 'FREQUENT_HIGH_SPEND', label: 'Frequent Spending', count: alerts.filter(a => a.spending_alert === 'FREQUENT_HIGH_SPEND').length },
            { key: 'HIGH_AVG_DISCRETIONARY', label: 'High Average', count: alerts.filter(a => a.spending_alert === 'HIGH_AVG_DISCRETIONARY').length },
            { key: 'VERY_LARGE_PURCHASE', label: 'Very Large', count: alerts.filter(a => a.spending_alert === 'VERY_LARGE_PURCHASE').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                filter === key ? 'bg-indigo-200 text-indigo-900' : 'bg-gray-200 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎉</div>
            <p>No merchant alerts found for the selected filter</p>
            <p className="text-sm">Your spending patterns look normal with merchants</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert, index) => {
              const alertConfig = getAlertConfig(alert.spending_alert);
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${alertConfig.borderColor} ${alertConfig.bgColor} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className={`text-2xl ${alertConfig.color}`}>
                        {alertConfig.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {alert.merchant}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${alertConfig.bgColor} ${alertConfig.color}`}>
                            {alertConfig.title}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.category_name} • {alert.transaction_count} transactions
                        </p>
                        
                        {/* Spending Details */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Spent:</span>
                            <div className="font-semibold text-gray-900">
                              ₹{parseFloat(alert.total_spent).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Average:</span>
                            <div className="font-semibold text-gray-900">
                              ₹{parseFloat(alert.avg_transaction).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Largest:</span>
                            <div className="font-semibold text-red-600">
                              ₹{parseFloat(alert.max_transaction).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Spend Rank:</span>
                            <div className="font-semibold text-blue-600">
                              #{alert.spend_rank}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {alertConfig.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                      View Transactions
                    </button>
                    <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors">
                      Set Spending Limit
                    </button>
                    <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors">
                      Analyze Pattern
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with Insights */}
      {alerts.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium text-gray-900 mb-2">💡 Merchant Insights</h4>
            <ul className="space-y-1">
              <li>• Consider setting spending limits for high-risk merchants</li>
              <li>• Review recurring subscriptions and memberships</li>
              <li>• Compare merchant spending with previous months</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}