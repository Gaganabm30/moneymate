import {
  useEffect,
  useState,
} from "react";

import Layout from "../components/common/Layout";

import {
  createGoal,
  deleteGoal,
  getGoals,
} from "../services/goalService";

function Goals() {
  const [goals, setGoals] = useState([]);

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "",
    targetDate: "",
  });

  const load = async () => {
    try {
      const data = await getGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load goals:", err);
      setGoals([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        savedAmount: Number(form.savedAmount || 0),
      };

      if (form.targetDate) {
        payload.targetDate = form.targetDate;
      }

      await createGoal(payload);

      setForm({
        name: "",
        targetAmount: "",
        savedAmount: "",
        targetDate: "",
      });

      load();
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            SAVINGS GOALS
          </p>

          <h1>Turn plans into progress</h1>
        </div>
      </div>

      <form
        className="card goal-form"
        onSubmit={submit}
      >
        <input
          placeholder="Goal name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          required
        />

        <input
          type="number"
          placeholder="Target amount"
          value={form.targetAmount}
          onChange={(e) =>
            setForm({
              ...form,
              targetAmount:
                e.target.value,
            })
          }
          required
        />

        <input
          type="number"
          placeholder="Already saved"
          value={form.savedAmount}
          onChange={(e) =>
            setForm({
              ...form,
              savedAmount:
                e.target.value,
            })
          }
        />

        <input
          type="date"
          value={form.targetDate}
          onChange={(e) =>
            setForm({
              ...form,
              targetDate:
                e.target.value,
            })
          }
        />

        <button className="primary-button">
          Create goal
        </button>
      </form>

      <div className="goal-grid">
        {goals.map((goal) => {
          const percentage = Math.min(
            Math.round(
              (goal.savedAmount /
                goal.targetAmount) *
                100
            ),
            100
          );

          return (
            <div
              className="card"
              key={goal._id}
            >
              <div className="row-between">
                <h2>{goal.name}</h2>

                <button
                  className="delete-button"
                  onClick={async () => {
                    await deleteGoal(goal._id);
                    load();
                  }}
                >
                  Delete
                </button>
              </div>

              <h3>
                ₹
                {goal.savedAmount.toLocaleString(
                  "en-IN"
                )}{" "}
                / ₹
                {goal.targetAmount.toLocaleString(
                  "en-IN"
                )}
              </h3>

              <div className="progress">
                <div
                  className="progress-value"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p>{percentage}% complete</p>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default Goals;