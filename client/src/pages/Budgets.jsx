import {
  useEffect,
  useState,
} from "react";

import Layout from "../components/common/Layout";

import {
  createBudget,
  deleteBudget,
  getBudgets,
} from "../services/budgetService";

function Budgets() {
  const now = new Date();

  const [budgets, setBudgets] = useState([]);

  const [form, setForm] = useState({
    category: "Food",
    limit: "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const load = async () => {
    setBudgets(await getBudgets());
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    await createBudget({
      ...form,
      limit: Number(form.limit),
    });

    setForm({
      ...form,
      limit: "",
    });

    load();
  };

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            BUDGETS
          </p>

          <h1>Plan before you spend</h1>
        </div>
      </div>

      <form
        className="card inline-form"
        onSubmit={submit}
      >
        <select
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
        >
          <option>Food</option>
          <option>Travel</option>
          <option>Shopping</option>
          <option>Entertainment</option>
          <option>Bills</option>
          <option>Health</option>
        </select>

        <input
          type="number"
          placeholder="Monthly limit"
          value={form.limit}
          onChange={(e) =>
            setForm({
              ...form,
              limit: e.target.value,
            })
          }
          required
        />

        <button className="primary-button">
          Set budget
        </button>
      </form>

      <div className="budget-grid">
        {budgets.map((budget) => (
          <div
            className="card budget-card"
            key={budget._id}
          >
            <div className="row-between">
              <h3>{budget.category}</h3>

              <button
                className="delete-button"
                onClick={async () => {
                  await deleteBudget(
                    budget._id
                  );

                  load();
                }}
              >
                Remove
              </button>
            </div>

            <h2>
              ₹{budget.spent.toLocaleString("en-IN")}
              <span className="muted">
                {" "}
                / ₹
                {budget.limit.toLocaleString(
                  "en-IN"
                )}
              </span>
            </h2>

            <div className="progress">
              <div
                className="progress-value"
                style={{
                  width: `${Math.min(
                    budget.percentage,
                    100
                  )}%`,
                }}
              />
            </div>

            <p>
              {budget.percentage}% used
            </p>

            {budget.percentage >= 100 && (
              <p className="warning">
                Budget exceeded
              </p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default Budgets;