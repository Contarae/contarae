import { Component, Suspense } from "react";

export default class PortalRoute extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <main style={{ padding: 32 }} role="alert"><p>No fue posible abrir el portal.</p><button type="button" onClick={() => window.location.reload()}>Reintentar</button></main>;
    }
    return <Suspense fallback={<main role="status" style={{ padding: 32 }}>Cargando portal...</main>}>{this.props.children}</Suspense>;
  }
}
