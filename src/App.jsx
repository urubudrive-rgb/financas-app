import { useState, useMemo, useEffect } from "react";

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

const CATEGORIES = [
  { id: "lazer", label: "🎮 Lazer", color: "#E054B6", type: "expense" },
  { id: "emergencia", label: "🚨 Emergência", color: "#E05454", type: "expense" },
  { id: "transporte", label: "🚗 Transporte", color: "#54A8E0", type: "expense" },
  { id: "mercado", label: "🛒 Mercado", color: "#E0A254", type: "expense" },
  { id: "academia", label: "🏋️ Academia", color: "#54C97E", type: "expense" },
  { id: "projeto_pesquisa", label: "🔬 Projeto de Pesquisa", color: "#2ECC71", type: "income" },
  { id: "outros_entrada", label: "💰 Outras Entradas", color: "#1ABC9C", type: "income" },
];

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const formatBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const initialTransactions = [
  { id: 1, type: "income", category: "projeto_pesquisa", desc: "Projeto de pesquisa junho", amount: 4500, date: "2026-06-05" },
  { id: 2, type: "expense", category: "mercado", desc: "Supermercado", amount: 380, date: "2026-06-08" },
  { id: 3, type: "expense", category: "transporte", desc: "Combustível", amount: 160, date: "2026-06-08" },
  { id: 4, type: "expense", category: "academia", desc: "Mensalidade academia", amount: 100, date: "2026-06-01" },
];

const initialDebts = [];

export default function App() {
  const [transactions, setTransactions] = useLocalStorage("financas_transactions", initialTransactions);
  const [debts, setDebts] = useLocalStorage("financas_debts", initialDebts);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({ type: "expense", category: "mercado", desc: "", amount: "", date: new Date().toISOString().slice(0,10) });
  const [debtForm, setDebtForm] = useState({ desc: "", amount: "", dueDate: "", paid: false });
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDebtId, setEditDebtId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteDebtConfirm, setDeleteDebtConfirm] = useState(null);

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  }), [transactions, filterMonth, filterYear]);

  const filteredDebts = useMemo(() => debts.filter(d => {
    if (!d.dueDate) return true;
    const dt = new Date(d.dueDate);
    return dt.getMonth() === filterMonth && dt.getFullYear() === filterYear;
  }), [debts, filterMonth, filterYear]);

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalDebt = filteredDebts.filter(d => !d.paid).reduce((s, d) => s + d.amount, 0);
  const totalDebtPaid = filteredDebts.filter(d => d.paid).reduce((s, d) => s + d.amount, 0);
  const balance = totalIncome - totalExpense - totalDebt;

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });
    return map;
  }, [filtered]);

  const handleSubmit = () => {
    if (!form.desc || !form.amount || !form.date) return;
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return;
    if (editId !== null) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...t, ...form, amount: amt } : t));
      setEditId(null);
    } else {
      setTransactions(prev => [...prev, { ...form, amount: amt, id: Date.now() }]);
    }
    setForm({ type: "expense", category: "mercado", desc: "", amount: "", date: new Date().toISOString().slice(0,10) });
    setShowForm(false);
  };

  const handleDebtSubmit = () => {
    if (!debtForm.desc || !debtForm.amount) return;
    const amt = parseFloat(debtForm.amount);
    if (isNaN(amt) || amt <= 0) return;
    if (editDebtId !== null) {
      setDebts(prev => prev.map(d => d.id === editDebtId ? { ...d, ...debtForm, amount: amt } : d));
      setEditDebtId(null);
    } else {
      setDebts(prev => [...prev, { ...debtForm, amount: amt, id: Date.now(), paid: false }]);
    }
    setDebtForm({ desc: "", amount: "", dueDate: "", paid: false });
    setShowDebtForm(false);
  };

  const toggleDebtPaid = (id) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, paid: !d.paid } : d));
  };

  const startEdit = (t) => {
    setForm({ type: t.type, category: t.category, desc: t.desc, amount: String(t.amount), date: t.date });
    setEditId(t.id);
    setShowForm(true);
    setActiveTab("lancamentos");
  };

  const startEditDebt = (d) => {
    setDebtForm({ desc: d.desc, amount: String(d.amount), dueDate: d.dueDate || "", paid: d.paid });
    setEditDebtId(d.id);
    setShowDebtForm(true);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const deleteDebt = (id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    setDeleteDebtConfirm(null);
  };

  const getCat = (id) => CATEGORIES.find(c => c.id === id) || { label: id, color: "#aaa" };
  const availableCategories = CATEGORIES.filter(c => c.type === form.type);
  const expenseCategories = CATEGORIES.filter(c => c.type === "expense");
  const incomeCategories = CATEGORIES.filter(c => c.type === "income");
  const maxCatAmount = Math.max(...Object.values(byCategory), 1);

< truncated lines 142-399 >
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>VALOR (R$)</label>
                    <input type="number" value={debtForm.amount} onChange={e => setDebtForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00"
                      style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#F0EDE8", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>VENCIMENTO (opcional)</label>
                    <input type="date" value={debtForm.dueDate} onChange={e => setDebtForm(f => ({ ...f, dueDate: e.target.value }))}
                      style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#F0EDE8", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                </div>
                <button onClick={handleDebtSubmit}
                  style={{ width: "100%", background: "#E05454", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 0", cursor: "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "inherit", marginTop: 4 }}>
                  {editDebtId !== null ? "Salvar Alterações" : "Adicionar Dívida"}
                </button>
              </div>
            )}

            <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, overflow: "hidden" }}>
              {filteredDebts.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>
                  Nenhuma dívida em {MONTHS[filterMonth]}. Clique em "+ Nova Dívida" para adicionar.
                </div>
              )}
              {filteredDebts.map((d, i) => {
                const isOverdue = d.dueDate && !d.paid && new Date(d.dueDate + "T00:00:00") < new Date();
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                    borderBottom: i < filteredDebts.length - 1 ? "1px solid #222" : "none",
                    background: deleteDebtConfirm === d.id ? "#2A0F0F" : d.paid ? "#0F1A0F" : "transparent",
                    opacity: d.paid ? 0.6 : 1 }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleDebtPaid(d.id)}
                      style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${d.paid ? "#2ECC71" : "#E05454"}`,
                        background: d.paid ? "#2ECC71" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#FFF" }}>
                      {d.paid ? "✓" : ""}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: d.paid ? "#888" : "#DDD", textDecoration: d.paid ? "line-through" : "none", marginBottom: 2 }}>{d.desc}</div>
                      <div style={{ fontSize: 11, color: isOverdue ? "#E05454" : "#555" }}>
                        {d.dueDate ? `Venc. ${new Date(d.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}${isOverdue ? " ⚠️ Vencida" : ""}` : "Sem vencimento"}
                        {d.paid && " · ✅ Paga"}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: "bold", color: d.paid ? "#2ECC71" : "#E05454", marginRight: 8 }}>
                      {formatBRL(d.amount)}
                    </div>
                    {deleteDebtConfirm === d.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => deleteDebt(d.id)}
                          style={{ background: "#E05454", color: "#FFF", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Confirmar</button>
                        <button onClick={() => setDeleteDebtConfirm(null)}
                          style={{ background: "#333", color: "#AAA", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Cancelar</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => startEditDebt(d)}
                          style={{ background: "#222", color: "#888", border: "1px solid #333", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>✏️</button>
                        <button onClick={() => setDeleteDebtConfirm(d.id)}
                          style={{ background: "#222", color: "#888", border: "1px solid #333", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CATEGORIAS */}
        {activeTab === "categorias" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: "#D4AF7A", marginBottom: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>📤 Categorias de Gastos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {expenseCategories.map(cat => {
                  const val = byCategory[cat.id] || 0;
                  const count = filtered.filter(t => t.category === cat.id).length;
                  return (
                    <div key={cat.id} style={{ background: "#1A1A1A", border: `1px solid ${val > 0 ? cat.color + "55" : "#222"}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#CCC", marginBottom: 2 }}>{cat.label}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{count} lançamento{count !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: val > 0 ? cat.color : "#444" }}>{formatBRL(val)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#D4AF7A", marginBottom: 14, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>📥 Categorias de Entradas</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {incomeCategories.map(cat => {
                  const val = byCategory[cat.id] || 0;
                  const count = filtered.filter(t => t.category === cat.id).length;
                  return (
                    <div key={cat.id} style={{ background: "#1A1A1A", border: `1px solid ${val > 0 ? cat.color + "55" : "#222"}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#CCC", marginBottom: 2 }}>{cat.label}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{count} lançamento{count !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: val > 0 ? cat.color : "#444" }}>{formatBRL(val)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 24, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: "#D4AF7A", marginBottom: 14, fontWeight: "bold" }}>Resumo do Mês — {MONTHS[filterMonth]}/{filterYear}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>TOTAL ENTRADAS</div>
                  <div style={{ fontSize: 18, color: "#2ECC71", fontWeight: "bold" }}>{formatBRL(totalIncome)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>TOTAL GASTOS</div>
                  <div style={{ fontSize: 18, color: "#E07B54", fontWeight: "bold" }}>{formatBRL(totalExpense)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>DÍVIDAS A PAGAR</div>
                  <div style={{ fontSize: 18, color: "#E05454", fontWeight: "bold" }}>{formatBRL(totalDebt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>SALDO REAL</div>
                  <div style={{ fontSize: 18, color: balance >= 0 ? "#D4AF7A" : "#E05454", fontWeight: "bold" }}>{formatBRL(balance)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
