import {
  useEffect,
  useState,
} from "react";

import Layout from "../components/common/Layout";

import { getAnalytics } from "../services/analyticsService";

function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  if (!data) {
    return (
      <Layout>
        Loading analytics...
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            MONEY INTELLIGENCE
          </p>

          <h1>Understand your spending</h1>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <h2>Money Leak Detector</h2>

          {data.moneyLeaks.map((leak) => (
            <div
              className="insight-item"
              key={leak.name}
            >
              <strong>{leak.name}</strong>

              <p>
                {leak.count} transactions • ₹
                {leak.total.toLocaleString(
                  "en-IN"
                )}
              </p>

              <p className="muted">
                Potential yearly saving: ₹
                {leak.potentialYearlySaving.toLocaleString(
                  "en-IN"
                )}
              </p>
            </div>
          ))}

          {!data.moneyLeaks.length && (
            <p className="muted">
              Add more transactions to detect
              repeated spending.
            </p>
          )}
        </div>

        <div className="card">
          <h2>Unusual spending</h2>

          {data.anomalies.map(
            (anomaly, index) => (
              <div
                className="insight-item"
                key={index}
              >
                <strong>
                  ₹
                  {anomaly.transaction.amount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

                <p>
                  {
                    anomaly.transaction
                      .category
                  }
                </p>

                <p className="muted">
                  Typical average: ₹
                  {anomaly.average.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            )
          )}

          {!data.anomalies.length && (
            <p className="muted">
              No unusual spending detected.
            </p>
          )}
        </div>

        <div className="card">
          <h2>Recurring expenses</h2>

          {data.recurring.map(
            (item, index) => (
              <div
                className="insight-item"
                key={index}
              >
                <strong>{item.name}</strong>

                <p>
                  ₹
                  {item.monthlyCost.toLocaleString(
                    "en-IN"
                  )}{" "}
                  / month
                </p>

                <p className="muted">
                  ₹
                  {item.yearlyCost.toLocaleString(
                    "en-IN"
                  )}{" "}
                  / year
                </p>
              </div>
            )
          )}

          {!data.recurring.length && (
            <p className="muted">
              No recurring expenses detected
              yet.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Analytics;