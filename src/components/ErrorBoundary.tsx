import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center p-4">
          <div className="pixel-box p-6 max-w-md text-center flex flex-col gap-3">
            <div className="font-pixel-title text-yellow-300 text-sm">
              BİR BAĞLANTI HATASI OLUŞTU
            </div>
            <p className="text-xs text-slate-300">
              Endişelenme, açtığın sonlar güvende! Sayfayı yenileyip devam edebilirsin.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="pixel-btn px-4 py-2 text-xs font-pixel-title cursor-pointer"
            >
              ↺ TEKRAR DENE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
