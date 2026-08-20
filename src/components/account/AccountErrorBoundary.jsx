import React, { Component } from 'react';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default class AccountErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Account ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-apex-red/10 border border-apex-red/30 text-apex-red flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
              Unable to Load Account Section
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              We encountered a temporary issue while loading this page. Please refresh or return to your account overview.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>

            <Link
              to="/account"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Account Overview</span>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
