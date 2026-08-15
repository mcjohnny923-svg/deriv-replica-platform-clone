
const PortfolioSummary = () => {
  return (
    <div className="flex items-center space-x-6">
      <div className="text-right">
        <div className="text-sm text-gray-400">Balance</div>
        <div className="text-lg font-semibold text-white">$10,000.00</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-400">P&L Today</div>
        <div className="text-lg font-semibold text-green-400">+$250.00</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-400">Open Positions</div>
        <div className="text-lg font-semibold text-white">3</div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
