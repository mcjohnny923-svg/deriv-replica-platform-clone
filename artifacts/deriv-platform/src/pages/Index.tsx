
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-[#151717] border-b border-[#323738] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-white">Deriv</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Trade</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Markets</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About us</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Help centre</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                Create free demo account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Trading<br />
            <span className="text-red-500">reimagined</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Trade forex, synthetics, and cryptocurrencies with our award-winning platforms. 
            Start with a demo account and $10,000 virtual money.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg">
                Create free demo account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8 py-4 text-lg">
                Try the demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why choose Deriv</h2>
            <p className="text-xl text-gray-300">Trade with confidence on our award-winning platforms</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced charting</h3>
              <p className="text-gray-400">Comprehensive tools and indicators for technical analysis</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Regulated & secure</h3>
              <p className="text-gray-400">Licensed and regulated by top-tier financial authorities</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast execution</h3>
              <p className="text-gray-400">Lightning-fast trade execution with competitive spreads</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global markets</h3>
              <p className="text-gray-400">Access to forex, stocks, indices, and synthetic markets</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Start trading today</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join millions of traders worldwide. Create your free demo account in minutes.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg">
              Get started for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
