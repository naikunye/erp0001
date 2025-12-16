import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#030508] text-slate-400 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">系统遇到了一点问题</h2>
            <p className="text-sm mb-6 text-slate-500">System encountered an unexpected error.</p>
            
            <div className="bg-black/50 rounded-lg p-4 mb-6 text-left overflow-auto max-h-32 border border-slate-800">
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Error Details:</p>
                <code className="text-xs text-red-400 font-mono break-all block">
                    {error?.message || "Unknown error occurred"}
                </code>
            </div>

            <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
                >
                  <Home className="w-4 h-4" /> 返回首页
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <RefreshCw className="w-4 h-4" /> 刷新页面
                </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}