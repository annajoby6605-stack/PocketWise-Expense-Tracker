
import { useEffect, useState } from "react";
import { Wallet, Plus, Pencil, Trash2, IndianRupee, X } from "lucide-react";
import "./index.css";

const API = "http://localhost:5000/api/expenses";
const categories = ["Food", "Travel", "Bills", "Shopping", "Other"];
const today = new Date().toLocaleDateString("en-CA");
const emptyForm = { title: "", amount: "", category: "Food", date: today };

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  async function loadExpenses() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Could not load expenses");
      setExpenses(await response.json());
    } catch {
      setMessage("Cannot connect to backend. Check whether server.js is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.date ||
        !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setMessage("Enter a title, valid positive amount and date.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            title: form.title.trim(),
            amount: Number(form.amount)
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Operation failed");

      setMessage(editingId ? "Expense updated successfully!" : "Expense added successfully!");
      setForm({ ...emptyForm });
      setEditingId(null);
      await loadExpenses();
    } catch (error) {
      setMessage(error.message || "Could not save expense.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(expense) {
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toLocaleDateString("en-CA")
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");

      setMessage("Expense deleted successfully!");
      if (editingId === id) {
        setEditingId(null);
        setForm({ ...emptyForm });
      }
      await loadExpenses();
    } catch (error) {
      setMessage(error.message || "Could not delete expense.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Wallet size={25} /></div>
          <div>
            <h2>PocketWise</h2>
            <p>PERSONAL FINANCE TRACKER</p>
          </div>
        </div>
        <span className="live-tag">● Your money, your control</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">YOUR FINANCIAL DASHBOARD</p>
        <h1>Track every rupee.</h1>
        <p className="subtitle">Keep your daily spending organised, one expense at a time.</p>
      </section>

      <section className="summary">
        <div className="summary-icon"><IndianRupee size={25} /></div>
        <div>
          <p>Total Amount Spent</p>
          <h2>₹{total.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</h2>
          <span>Across {expenses.length} expense{expenses.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="summary-decoration">₹</div>
      </section>

      <section className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? "UPDATE RECORD" : "NEW RECORD"}</p>
              <h2>{editingId ? "Edit expense" : "Add an expense"}</h2>
            </div>
            {editingId && (
              <button className="icon-btn" onClick={cancelEdit} title="Cancel edit">
                <X size={19} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Expense title</label>
            <input id="title" name="title" placeholder="e.g. Lunch with friends"
              value={form.title} onChange={updateField} maxLength={100} required />

            <label htmlFor="amount">Amount (₹)</label>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01"
              placeholder="0.00" value={form.amount} onChange={updateField} required />

            <div className="two-fields">
              <div>
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={updateField}>
                  {categories.map(category => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="date">Date</label>
                <input id="date" name="date" type="date" value={form.date}
                  onChange={updateField} required />
              </div>
            </div>

            <button className="primary-btn" type="submit" disabled={saving}>
              <Plus size={18} />
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Expense"}
            </button>

            {editingId && (
              <button type="button" className="cancel-btn" onClick={cancelEdit}>
                Cancel Editing
              </button>
            )}
          </form>

          {message && <p className="message" role="status">{message}</p>}
        </section>

        <section className="panel list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR RECORDS</p>
              <h2>Recent expenses</h2>
            </div>
            <span className="count">{expenses.length} total</span>
          </div>

          {loading ? (
            <p className="empty">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Wallet size={28} /></div>
              <h3>No expenses yet</h3>
              <p>Add your first expense using the form.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>EXPENSE</th><th>DATE</th><th>AMOUNT</th><th>ACTIONS</th></tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense._id}>
                      <td>
                        <strong>{expense.title}</strong>
                        <span className="category">{expense.category}</span>
                      </td>
                      <td>{new Date(expense.date).toLocaleDateString("en-IN")}</td>
                      <td className="amount">₹{Number(expense.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</td>
                      <td>
                        <div className="actions">
                          <button className="action-btn edit-btn" title="Edit expense"
                            aria-label="Edit expense" onClick={() => startEdit(expense)}>
                            <Pencil size={16} />
                          </button>
                          <button className="action-btn delete-btn" title="Delete expense"
                            aria-label="Delete expense" onClick={() => deleteExpense(expense._id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="list-note">Your expenses are saved in MongoDB Atlas.</p>
        </section>
      </section>

      <footer>POCKETWISE · Spend thoughtfully. Save confidently.</footer>
    </main>
  );
}

export default App;
