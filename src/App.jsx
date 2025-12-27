import React, { useState, useMemo } from 'react';

const SnackLandingPage = () => {
  const [currentProvider, setCurrentProvider] = useState('');
  const [requestsPerDay, setRequestsPerDay] = useState(10000);
  const [avgInputTokens, setAvgInputTokens] = useState(500);
  const [avgOutputTokens, setAvgOutputTokens] = useState(200);
  const [selectedModel, setSelectedModel] = useState('llama-3.1-70b');
  const [latencyRequirement, setLatencyRequirement] = useState('flexible');
  const [showCalculation, setShowCalculation] = useState(false);
  
  // Modal states
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', useCase: '' });
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [uploadSubmitted, setUploadSubmitted] = useState(false);

  // Real pricing data - Dec 2024
  // Latency = TTFT (time to first token) in ms, based on Artificial Analysis & FriendliAI benchmarks
  const providerData = {
    'llama-3.1-70b': {
      'Together': { input: 0.88, output: 0.88, latency: 500, rateLimit: null },
      'Fireworks': { input: 0.90, output: 0.90, latency: 400, rateLimit: null },
      'Groq': { input: 0.59, output: 0.79, latency: 450, rateLimit: '6k tokens/min' },
      'Baseten': { input: 0.95, output: 0.95, latency: 400, rateLimit: null },
      'Replicate': { input: 0.65, output: 0.65, latency: 500, rateLimit: null },
      'AWS Bedrock': { input: 0.72, output: 0.72, latency: 300, rateLimit: null },
    },
    'llama-3.1-8b': {
      'Together': { input: 0.18, output: 0.18, latency: 100, rateLimit: null },
      'Fireworks': { input: 0.20, output: 0.20, latency: 80, rateLimit: null },
      'Groq': { input: 0.05, output: 0.08, latency: 50, rateLimit: '6k tokens/min' },
      'Baseten': { input: 0.20, output: 0.20, latency: 100, rateLimit: null },
      'Replicate': { input: 0.20, output: 0.20, latency: 150, rateLimit: null },
      'AWS Bedrock': { input: 0.22, output: 0.22, latency: 120, rateLimit: null },
    },
    'deepseek-r1': {
      'Together': { input: 3.00, output: 7.00, latency: 600, rateLimit: null, note: 'Full 671B R1' },
      'Fireworks': { input: 3.00, output: 8.00, latency: 2000, rateLimit: null, note: 'Full 671B R1' },
      'Groq': { input: 0.70, output: 0.80, latency: 200, rateLimit: '6k tokens/min', warning: 'Distilled 70B — not full R1' },
      'AWS Bedrock': { input: 1.35, output: 5.40, latency: 1500, rateLimit: null },
    },
    'deepseek-v3': {
      'Together': { input: 0.50, output: 1.50, latency: 400, rateLimit: null },
      'Fireworks': { input: 0.50, output: 1.50, latency: 500, rateLimit: null },
      'Baseten': { input: 0.30, output: 0.45, latency: 450, rateLimit: null, note: 'V3.2 — latest' },
      'AWS Bedrock': { input: 0.50, output: 1.50, latency: 600, rateLimit: null },
    },
    'mixtral-8x7b': {
      'Together': { input: 0.24, output: 0.24, latency: 350, rateLimit: null },
      'Fireworks': { input: 0.20, output: 0.20, latency: 300, rateLimit: null },
      'Groq': { input: 0.24, output: 0.24, latency: 150, rateLimit: '6k tokens/min' },
      'Baseten': { input: 0.25, output: 0.25, latency: 350, rateLimit: null },
      'Replicate': { input: 0.30, output: 0.30, latency: 400, rateLimit: null },
      'AWS Bedrock': { input: 0.45, output: 0.70, latency: 500, rateLimit: null },
    },
  };

  const modelLabels = {
    'llama-3.1-70b': 'Llama 3.1 70B',
    'llama-3.1-8b': 'Llama 3.1 8B',
    'deepseek-r1': 'DeepSeek R1',
    'deepseek-v3': 'DeepSeek V3',
    'mixtral-8x7b': 'Mixtral 8x7B',
  };

  const latencyThresholds = {
    'strict': 500,      // Real-time chat: <500ms feels instant
    'moderate': 1000,   // Interactive apps: <1s is acceptable
    'flexible': 999999, // Batch/async: no latency requirement
  };

  const calculations = useMemo(() => {
    const pricing = providerData[selectedModel] || {};
    const monthlyRequests = requestsPerDay * 30;
    const inputTokensPerMonth = (monthlyRequests * avgInputTokens) / 1_000_000;
    const outputTokensPerMonth = (monthlyRequests * avgOutputTokens) / 1_000_000;
    const maxLatency = latencyThresholds[latencyRequirement];

    const results = Object.entries(pricing).map(([provider, data]) => {
      const inputCost = inputTokensPerMonth * data.input;
      const outputCost = outputTokensPerMonth * data.output;
      const totalCost = inputCost + outputCost;
      const meetsLatency = data.latency <= maxLatency;
      
      return { 
        provider, 
        totalCost, 
        inputCost, 
        outputCost,
        latency: data.latency,
        meetsLatency,
        rateLimit: data.rateLimit,
        note: data.note,
        warning: data.warning,
        inputRate: data.input,
        outputRate: data.output,
      };
    });

    return results.sort((a, b) => {
      if (a.meetsLatency && !b.meetsLatency) return -1;
      if (!a.meetsLatency && b.meetsLatency) return 1;
      return a.totalCost - b.totalCost;
    });
  }, [requestsPerDay, avgInputTokens, avgOutputTokens, selectedModel, latencyRequirement]);

  const viableOptions = calculations.filter(c => c.meetsLatency);
  const cheapestViable = viableOptions[0];
  const currentProviderData = currentProvider ? calculations.find(c => c.provider === currentProvider) : null;
  
  const savings = currentProviderData && cheapestViable && currentProviderData.provider !== cheapestViable.provider
    ? currentProviderData.totalCost - cheapestViable.totalCost
    : null;
  
  const savingsPercent = savings && currentProviderData 
    ? ((savings / currentProviderData.totalCost) * 100).toFixed(0)
    : null;

  const monthlyRequests = requestsPerDay * 30;
  const inputTokensPerMonth = (monthlyRequests * avgInputTokens) / 1_000_000;
  const outputTokensPerMonth = (monthlyRequests * avgOutputTokens) / 1_000_000;

  const availableProviders = Object.keys(providerData[selectedModel] || {});

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    console.log('Waitlist email:', email);
    setWaitlistSubmitted(true);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    console.log('Lead form:', formData);
    setUploadSubmitted(true);
  };

  // Cookie logo SVG component
  const CookieLogo = ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M85 35 Q95 45 85 55" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle cx="35" cy="40" r="5" fill="currentColor"/>
      <circle cx="55" cy="35" r="5" fill="currentColor"/>
      <circle cx="40" cy="60" r="5" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>

      {/* Navigation */}
      <nav className="px-8 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <CookieLogo className="w-8 h-8 text-stone-800" />
          <span 
            className="text-2xl font-bold text-stone-800 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            snack
          </span>
        </div>
        <button 
          onClick={() => setShowWaitlistModal(true)}
          className="text-stone-600 hover:text-stone-900 transition text-sm"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Get early access →
        </button>
      </nav>

      {/* Hero */}
      <div className="text-center px-8 pt-12 pb-8 max-w-3xl mx-auto">
        <h1 
          className="text-5xl md:text-6xl font-bold text-stone-800 mb-6 leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
        >
          You're overpaying<br />for inference.
        </h1>
        <p className="text-xl text-stone-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          Find out by how much.
        </p>
      </div>

      {/* Calculator */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        
        {/* Box 1: Input Section - Two Column */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-6">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Your workload
          </p>
          
          <div className="grid grid-cols-2 gap-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div>
              <label className="block text-sm text-stone-500 mb-1.5">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setCurrentProvider('');
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              >
                {Object.entries(modelLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-500 mb-1.5">What are you using today?</label>
              <select
                value={currentProvider}
                onChange={(e) => setCurrentProvider(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              >
                <option value="">Select current provider...</option>
                {availableProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-500 mb-1.5">Requests per day</label>
              <input
                type="number"
                value={requestsPerDay}
                onChange={(e) => setRequestsPerDay(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              />
            </div>
            
            <div>
              <label className="block text-sm text-stone-500 mb-1.5">Latency requirement</label>
              <select
                value={latencyRequirement}
                onChange={(e) => setLatencyRequirement(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              >
                <option value="strict">Real-time (&lt;500ms) - Chat, code completion</option>
                <option value="moderate">Interactive (&lt;1s) - Most apps</option>
                <option value="flexible">Flexible - Batch/async</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-stone-500 mb-1.5">Avg input tokens</label>
              <input
                type="number"
                value={avgInputTokens}
                onChange={(e) => setAvgInputTokens(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              />
            </div>
            
            <div>
              <label className="block text-sm text-stone-500 mb-1.5">Avg output tokens</label>
              <input
                type="number"
                value={avgOutputTokens}
                onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Box 2: Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6">
          <div className="px-6 py-4 flex justify-between items-center border-b border-stone-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Monthly cost by provider — {modelLabels[selectedModel]}
            </span>
            <button 
              onClick={() => setShowCalculation(!showCalculation)}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              {showCalculation ? 'Hide math' : 'Show math'}
            </button>
          </div>

          {showCalculation && (
            <div className="px-6 py-3 bg-stone-50 border-b border-stone-100 font-mono text-xs text-stone-500">
              <div>Monthly requests = {requestsPerDay.toLocaleString()} × 30 = {monthlyRequests.toLocaleString()}</div>
              <div>Input: {inputTokensPerMonth.toFixed(1)}M tokens · Output: {outputTokensPerMonth.toFixed(1)}M tokens</div>
              <div className="text-stone-400 mt-1">Cost = (input M × $/M) + (output M × $/M)</div>
            </div>
          )}
          
          <div className="divide-y divide-stone-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {calculations.map((calc, index) => (
              <div
                key={calc.provider}
                className={`px-6 py-3.5 flex items-center justify-between transition ${
                  !calc.meetsLatency ? 'opacity-40' : ''
                } ${calc.provider === currentProvider ? 'bg-blue-50 border-l-2 border-blue-400' : ''} ${
                  index === 0 && calc.meetsLatency ? 'bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {index === 0 && calc.meetsLatency && (
                        <span className="bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded">Cheapest</span>
                      )}
                      {calc.provider === currentProvider && (
                        <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">Current</span>
                      )}
                      <span className="text-stone-800 font-medium">{calc.provider}</span>
                    </div>
                    {calc.warning && (
                      <span className="text-xs text-amber-600 mt-0.5">⚠️ {calc.warning}</span>
                    )}
                    {calc.rateLimit && (
                      <span className="text-xs text-amber-600 mt-0.5">⚠️ Rate limit: {calc.rateLimit}</span>
                    )}
                    {calc.note && !calc.warning && (
                      <span className="text-xs text-stone-400 mt-0.5">{calc.note}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right text-xs text-stone-400">
                    <div>{calc.latency}ms TTFT</div>
                    <div className={calc.meetsLatency ? 'text-emerald-600' : 'text-red-400'}>
                      {calc.meetsLatency ? '✓ meets latency' : '✗ too slow'}
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <span className="text-xl text-stone-800">${calc.totalCost.toFixed(0)}</span>
                    <span className="text-stone-400 text-sm">/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer inside results box */}
          <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100">
            <p className="text-xs text-amber-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Estimates based on published pricing (Dec 2024). Actual costs and latency vary by load and usage patterns.
            </p>
          </div>
        </div>

        {/* Box 3: Savings Callout */}
        {savings > 0 ? (
          <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  If you switched from {currentProvider} → {cheapestViable.provider}
                </p>
                <p 
                  className="text-4xl font-bold text-emerald-900 mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  ~${savings.toFixed(0)}<span className="text-xl text-emerald-600 font-normal">/mo potential savings</span>
                </p>
              </div>
              <div className="text-right">
                <p 
                  className="text-5xl font-bold text-emerald-700"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  ~{savingsPercent}%
                </p>
                <p className="text-sm text-emerald-600" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>less</p>
              </div>
            </div>
          </div>
        ) : currentProvider ? (
          <div className="bg-stone-100 rounded-2xl border border-stone-200 p-6 mb-6">
            <p className="text-stone-600" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Looks like you're already on the cheapest option that meets your requirements.
            </p>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl border border-stone-200 border-dashed p-6 mb-6 text-center">
            <p className="text-stone-400" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Select your current provider above to see potential savings
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
            <h2 
              className="text-2xl md:text-3xl font-bold text-stone-800 mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Want real numbers?
            </h2>
            <p className="text-stone-500 mb-8 max-w-lg mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Upload your traffic logs and we'll benchmark against live endpoints — real latency, real costs, your actual workload.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="bg-stone-900 text-white font-medium px-8 py-3 rounded-lg hover:bg-stone-800 transition"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Upload sample traffic →
              </button>
              <button 
                onClick={() => setShowWaitlistModal(true)}
                className="border border-stone-300 text-stone-700 font-medium px-8 py-3 rounded-lg hover:border-stone-400 hover:bg-stone-50 transition"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Join the waitlist
              </button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-stone-400" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                Coming: Real-time benchmarks
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                Coming: Automatic routing
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-stone-400 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <p>Prices change frequently. Data from public sources.</p>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowWaitlistModal(false)}>
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#FAF7F2' }}
          >
            {!waitlistSubmitted ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <CookieLogo className="w-6 h-6 text-stone-800" />
                  <span 
                    className="text-xl font-bold text-stone-800"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    snack
                  </span>
                </div>
                <h3 
                  className="text-2xl font-bold text-stone-800 mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Get early access
                </h3>
                <p className="text-stone-500 mb-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  We'll let you know when Snack is ready for you.
                </p>
                <form onSubmit={handleWaitlistSubmit}>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 mb-4"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white font-medium py-3 rounded-lg hover:bg-stone-800 transition"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    Join waitlist
                  </button>
                </form>
                <button 
                  onClick={() => setShowWaitlistModal(false)}
                  className="w-full mt-3 text-stone-500 text-sm hover:text-stone-700"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  Maybe later
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">🍪</div>
                <h3 
                  className="text-2xl font-bold text-stone-800 mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  You're on the list!
                </h3>
                <p className="text-stone-500 mb-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  We'll reach out when it's your turn.
                </p>
                <button 
                  onClick={() => {
                    setShowWaitlistModal(false);
                    setWaitlistSubmitted(false);
                    setEmail('');
                  }}
                  className="text-stone-600 hover:text-stone-800"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Traffic Modal - Lead capture form */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowUploadModal(false)}>
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#FAF7F2' }}
          >
            {!uploadSubmitted ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <CookieLogo className="w-6 h-6 text-stone-800" />
                  <span 
                    className="text-xl font-bold text-stone-800"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    snack
                  </span>
                </div>
                <h3 
                  className="text-2xl font-bold text-stone-800 mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Let's get you set up
                </h3>
                <p className="text-stone-500 mb-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Tell us a bit about what you're building and we'll reach out within 2 business days.
                </p>
                
                <form onSubmit={handleUploadSubmit} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-stone-500 mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-stone-500 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-stone-500 mb-1.5">Tell us about your use case</label>
                      <textarea
                        rows={3}
                        required
                        value={formData.useCase}
                        onChange={(e) => setFormData({...formData, useCase: e.target.value})}
                        placeholder="What are you building? What models are you using? What's your biggest inference pain point?"
                        className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 resize-none"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white font-medium py-3 rounded-lg hover:bg-stone-800 transition mt-6"
                  >
                    Get started →
                  </button>
                </form>
                
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="w-full mt-3 text-stone-500 text-sm hover:text-stone-700"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  Maybe later
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">✨</div>
                <h3 
                  className="text-2xl font-bold text-stone-800 mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  We're on it!
                </h3>
                <p className="text-stone-500 mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  We'll reach out to {formData.email} within 2 business days.
                </p>
                <p className="text-stone-400 text-sm mb-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  Thanks for your interest, {formData.name.split(' ')[0]}!
                </p>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadSubmitted(false);
                    setFormData({ name: '', email: '', useCase: '' });
                  }}
                  className="text-stone-600 hover:text-stone-800"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnackLandingPage;
