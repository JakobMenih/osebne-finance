import { Component, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
    state = { error: undefined as Error | undefined };
    static getDerivedStateFromError(error: Error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div className="p-6">
                    <h1>Ups, nekaj je šlo narobe.</h1>
                    <p>Poskusi osvežiti stran ali se prijaviti znova.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
