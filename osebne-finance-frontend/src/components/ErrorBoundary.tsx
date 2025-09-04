import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };
    static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
    componentDidCatch(error: any, info: any) { console.error('UI error:', error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 16 }}>
                    <h2>Napaka v uporabniškem vmesniku</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error || '')}</pre>
                    <p>Odpri DevTools → Console za podrobnosti.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
