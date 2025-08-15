"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Placeholder data - replace with real data from your API
  const portfolioROI = {
    current: 12.5,
    target: 10.0,
    progress: 125, // percentage of target achieved
    trend: "+2.3%",
    period: "YTD"
  };

  const revenueLeakage = {
    amount: 1.24,
    currency: "M",
    growth: "+18%",
    period: "vs Q3",
    items: [
      { category: "Pricing Optimization", value: 520000 },
      { category: "Contract Compliance", value: 380000 },
      { category: "Discount Management", value: 340000 }
    ]
  };

  const efficiencyGains = {
    hours: 2847,
    growth: "+34%",
    period: "vs Q3",
    categories: [
      { name: "Planning & Analysis", hours: 1240, icon: "📊" },
      { name: "Data Processing", hours: 892, icon: "⚡" },
      { name: "Report Generation", hours: 715, icon: "📋" }
    ]
  };

  const CircularProgress = ({ percentage, size = 200, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{portfolioROI.current}%</div>
            <div className="text-sm text-white/70">Portfolio ROI</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute top-32 right-10 w-80 h-80 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-1000"></div>
      <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-2000"></div>

      {/* Main Content */}
      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Executive Dashboard
            </h1>
            {/* Agent Status - Small Corner Indicator */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/90 font-medium">Agent Online</span>
              </div>
            </div>
          </div>
          <p className="text-xl text-white/70 font-light">
            Strategic Performance Overview • {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary Component - Portfolio ROI */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/30 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/25">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Portfolio ROI Performance</h2>
                  <p className="text-white/70">Target Achievement: {portfolioROI.progress}%</p>
                </div>
                <div className="text-right">
                  <div className="backdrop-blur-md bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2">
                    <span className="text-green-300 font-semibold">{portfolioROI.trend} {portfolioROI.period}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="flex-1 flex justify-center mb-6 lg:mb-0">
                  <CircularProgress percentage={portfolioROI.progress} size={240} strokeWidth={12} />
                </div>
                
                <div className="lg:ml-8 space-y-6">
                  <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
                    <h3 className="text-white/70 text-sm font-medium mb-2">Current ROI</h3>
                    <div className="text-3xl font-bold text-white">{portfolioROI.current}%</div>
                  </div>
                  
                  <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
                    <h3 className="text-white/70 text-sm font-medium mb-2">Target ROI</h3>
                    <div className="text-3xl font-bold text-white">{portfolioROI.target}%</div>
                  </div>

                  <div className="backdrop-blur-md bg-green-500/20 border border-green-400/30 rounded-2xl p-6">
                    <h3 className="text-green-300 text-sm font-medium mb-2">Outperformance</h3>
                    <div className="text-3xl font-bold text-green-300">+{(portfolioROI.current - portfolioROI.target).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Components */}
          <div className="space-y-8">
            {/* Revenue Leakage Prevented */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/30 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/25">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Revenue Protection</h2>
                <div className="backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-3 py-1">
                  <span className="text-emerald-300 text-sm font-semibold">{revenueLeakage.growth} {revenueLeakage.period}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-1">
                  ${revenueLeakage.amount}{revenueLeakage.currency}
                </div>
                <p className="text-white/70 text-sm">Revenue Leakage Prevented (YTD)</p>
              </div>

              <div className="space-y-3">
                {revenueLeakage.items.map((item, index) => (
                  <div key={index} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">{item.category}</span>
                      <span className="text-white font-semibold">${(item.value / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Gains */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/30 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:bg-white/25">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Efficiency Gains</h2>
                <div className="backdrop-blur-md bg-blue-500/20 border border-blue-400/30 rounded-lg px-3 py-1">
                  <span className="text-blue-300 text-sm font-semibold">{efficiencyGains.growth} {efficiencyGains.period}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-1">
                  {efficiencyGains.hours.toLocaleString()}
                </div>
                <p className="text-white/70 text-sm">Hours Saved in Automation</p>
              </div>

              <div className="space-y-3">
                {efficiencyGains.categories.map((category, index) => (
                  <div key={index} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-white/80 text-sm">{category.name}</span>
                      </div>
                      <span className="text-white font-semibold">{category.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-white/70">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">System Operational</span>
              </div>
              <div className="text-sm">Last Updated: {currentTime.toLocaleTimeString()}</div>
            </div>
            <div className="text-sm">Helios MVP • Executive Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
}