import { useEffect } from "react";
import "./invoice.css";

const APP_DEEP_LINK = "mobile://more/setup";

export default function ConnectReturnPage() {
  useEffect(() => {
    window.location.replace(APP_DEEP_LINK);
  }, []);

  return (
    <main className="payment-page">
      <h1>Stripe setup complete</h1>
      <p>Return to the Invo app to continue.</p>
      <a href={APP_DEEP_LINK}>Open Invo</a>
    </main>
  );
}
