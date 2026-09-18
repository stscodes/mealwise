import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Apple, Check, ChevronDown, CirclePlus, ClipboardList, Coffee,
  Dumbbell, Leaf, Minus, Plus, Search, ShoppingCart, Trash2, X
} from "lucide-react";
import "./styles.css";

const MEALS = [
  { id: "pre-workout", label: "Pre workout", icon: Dumbbell },
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Leaf },
  { id: "snack", label: "Snack", icon: Apple },
  { id: "dinner", label: "Dinner", icon: ClipboardList }
];

const DEMO_PRODUCTS = [
  {
    code: "demo-oats",
    product_name: "Rolled oats",
    brands: "Demo pantry",
    quantity: "500 g",
    image_front_small_url: "",
    nutriments: { "energy-kcal_100g": 389, proteins_100g: 16.9, carbohydrates_100g: 66.3, fat_100g: 6.9, fiber_100g: 10.6 }
  },
  {
    code: "demo-banana",
    product_name: "Banana",
    brands: "Fresh produce",
    quantity: "1 bunch",
    image_front_small_url: "",
    nutriments: { "energy-kcal_100g": 89, proteins_100g: 1.1, carbohydrates_100g: 22.8, fat_100g: 0.3, fiber_100g: 2.6 }
  },
  {
    code: "demo-yogurt",
    product_name: "Greek yogurt",
    brands: "Demo dairy",
    quantity: "500 g",
    image_front_small_url: "",
    nutriments: { "energy-kcal_100g": 73, proteins_100g: 9.0, carbohydrates_100g: 3.9, fat_100g: 2.0, fiber_100g: 0 }
  }
];

const initialLog = {
  "pre-workout": [],
  breakfast: [],
  lunch: [],
  snack: [],
  dinner: []
};

function loadLog() {
  try {
    const saved = JSON.parse(localStorage.getItem("mealwise-log"));
    return saved && typeof saved === "object" ? { ...initialLog, ...saved } : initialLog;
  } catch {
    return initialLog;
  }
}

function nutrientValue(product, key) {
  const n = product?.nutriments || {};
  return Number(n[`${key}_100g`] ?? n[key] ?? 0) || 0;
}

function productNutrition(product, grams) {
  const factor = Number(grams || 0) / 100;
  return {
    kcal: nutrientValue(product, "energy-kcal") * factor,
    protein: nutrientValue(product, "proteins") * factor,
    carbs: nutrientValue(product, "carbohydrates") * factor,
    fat: nutrientValue(product, "fat") * factor,
    fiber: nutrientValue(product, "fiber") * factor
  };
}

function format(n, digits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(n || 0);
}

function App() {
  const [log, setLog] = useState(loadLog);
  const [activeMeal, setActiveMeal] = useState("breakfast");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("mealwise-log", JSON.stringify(log));
  }, [log]);

  const allEntries = useMemo(
    () => MEALS.flatMap(m => log[m.id].map(entry => ({ ...entry, mealId: m.id }))),
    [log]
  );

  const totals = useMemo(() => allEntries.reduce((sum, entry) => {
    const n = productNutrition(entry.product, entry.grams);
    return {
      kcal: sum.kcal + n.kcal,
      protein: sum.protein + n.protein,
      carbs: sum.carbs + n.carbs,
      fat: sum.fat + n.fat,
      fiber: sum.fiber + n.fiber
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }), [allEntries]);

  const cartItems = useMemo(() => {
    const map = new Map();
    allEntries.forEach(entry => {
      const key = entry.product.code || entry.product.product_name;
      if (!map.has(key)) map.set(key, { product: entry.product, grams: 0, meals: [] });
      const item = map.get(key);
      item.grams += Number(entry.grams) || 0;
      if (!item.meals.includes(entry.mealId)) item.meals.push(entry.mealId);
    });
    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      ...value,
      needed: cart[key]?.needed ?? true
    }));
  }, [allEntries, cart]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function searchProducts(event) {
    event?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}&page_size=12&fields=code,product_name,brands,quantity,image_front_small_url,nutriments`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Product search failed");
      const data = await response.json();
      const clean = (data.products || []).filter(p => p.product_name);
      setResults(clean);
      if (!clean.length) setSearchError("No matching products found.");
    } catch {
      setResults([]);
      setSearchError("Could not reach Open Food Facts. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product) {
    setLog(prev => ({
      ...prev,
      [activeMeal]: [
        ...prev[activeMeal],
        { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, product, grams: 100 }
      ]
    }));
    showNotice(`${product.product_name} added to ${MEALS.find(m => m.id === activeMeal).label}.`);
  }

  function addDemo(product) {
    addProduct(product);
  }

  function updateEntry(mealId, entryId, delta) {
    setLog(prev => ({
      ...prev,
      [mealId]: prev[mealId].map(e =>
        e.id === entryId ? { ...e, grams: Math.max(1, Number(e.grams) + delta) } : e
      )
    }));
  }

  function setGrams(mealId, entryId, value) {
    const grams = Math.max(1, Number(value) || 1);
    setLog(prev => ({
      ...prev,
      [mealId]: prev[mealId].map(e => e.id === entryId ? { ...e, grams } : e)
    }));
  }

  function removeEntry(mealId, entryId) {
    setLog(prev => ({ ...prev, [mealId]: prev[mealId].filter(e => e.id !== entryId) }));
  }

  function clearDay() {
    if (!window.confirm("Clear today's meal log?")) return;
    setLog(initialLog);
    setCart({});
    showNotice("Today's log was cleared.");
  }

  function toggleCartItem(key) {
    setCart(prev => ({ ...prev, [key]: { needed: !(prev[key]?.needed ?? true) } }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Leaf size={18} strokeWidth={2.2} /></div>
          <div>
            <div className="brand-name">mealwise</div>
            <div className="brand-sub">simple food logging</div>
          </div>
        </div>
        <div className="top-actions">
          <button className="quiet-button" onClick={clearDay}>Clear day</button>
          <button className="cart-button" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} />
            Shopping list
            <span className="count-pill">{cartItems.filter(i => i.needed).length}</span>
          </button>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <div>
            <p className="eyebrow">TODAY</p>
            <h1>A calmer way to keep track.</h1>
            <p className="hero-copy">Log what you ate, see the nutrition in context, and turn today's products into a practical shopping list.</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Logged today</div>
            <div className="summary-number">{format(totals.kcal)} <span>kcal</span></div>
            <div className="macro-row">
              <span>Protein <b>{format(totals.protein, 1)}g</b></span>
              <span>Carbs <b>{format(totals.carbs, 1)}g</b></span>
              <span>Fat <b>{format(totals.fat, 1)}g</b></span>
            </div>
          </div>
        </section>

        <section className="search-panel">
          <form onSubmit={searchProducts} className="search-form">
            <Search size={19} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products or scan a barcode manually"
              aria-label="Search products"
            />
            <button type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
          </form>
          <div className="search-meta">
            <span>Using Open Food Facts open product data</span>
            <span>Selected meal: <b>{MEALS.find(m => m.id === activeMeal)?.label}</b></span>
          </div>
          {searchError && <div className="search-error">{searchError}</div>}
          {results.length > 0 && (
            <div className="results">
              {results.map(product => (
                <button className="product-result" key={product.code || product.product_name} onClick={() => addProduct(product)}>
                  <div className="product-thumb">
                    {product.image_front_small_url ? <img src={product.image_front_small_url} alt="" /> : <Apple size={20} />}
                  </div>
                  <div className="product-info">
                    <strong>{product.product_name}</strong>
                    <span>{product.brands || "Unbranded"} {product.quantity ? `· ${product.quantity}` : ""}</span>
                  </div>
                  <CirclePlus size={20} />
                </button>
              ))}
            </div>
          )}
          <div className="demo-row">
            <span>Quick demo:</span>
            {DEMO_PRODUCTS.map(p => <button key={p.code} onClick={() => addDemo(p)}>{p.product_name}</button>)}
          </div>
        </section>

        <section className="meal-layout">
          <nav className="meal-tabs" aria-label="Meals">
            {MEALS.map(meal => {
              const Icon = meal.icon;
              const active = activeMeal === meal.id;
              return (
                <button key={meal.id} className={active ? "meal-tab active" : "meal-tab"} onClick={() => setActiveMeal(meal.id)}>
                  <Icon size={17} />
                  <span>{meal.label}</span>
                  <small>{log[meal.id].length}</small>
                </button>
              );
            })}
          </nav>

          <div className="meal-column">
            {MEALS.map(meal => (
              <MealSection
                key={meal.id}
                meal={meal}
                entries={log[meal.id]}
                onUpdate={updateEntry}
                onSetGrams={setGrams}
                onRemove={removeEntry}
                onAdd={() => setActiveMeal(meal.id)}
              />
            ))}
          </div>
        </section>

        <footer className="footer">
          <span>Mealwise is a personal logging tool, not medical advice.</span>
          <span>Nutrition data: Open Food Facts · ODbL</span>
        </footer>
      </main>

      {notice && <div className="toast"><Check size={16} />{notice}</div>}

      {cartOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setCartOpen(false)}>
          <aside className="drawer">
            <div className="drawer-head">
              <div>
                <p className="eyebrow">FROM YOUR LOG</p>
                <h2>Shopping list</h2>
              </div>
              <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close"><X /></button>
            </div>
            <p className="drawer-copy">Products are consolidated across every meal you've logged today.</p>
            <div className="cart-list">
              {cartItems.length === 0 && <div className="empty">Add products to your meals and they will appear here.</div>}
              {cartItems.map(item => (
                <div className={item.needed ? "cart-item" : "cart-item muted"} key={item.key}>
                  <button className="check-box" onClick={() => toggleCartItem(item.key)}>{item.needed && <Check size={14} />}</button>
                  <div className="cart-item-info">
                    <strong>{item.product.product_name}</strong>
                    <span>{format(item.grams)} g · {item.meals.map(id => MEALS.find(m => m.id === id)?.label).join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div><span>{cartItems.filter(i => i.needed).length} items</span><b>Ready to shop</b></div>
              <button className="primary-button" onClick={() => window.print()}><ShoppingCart size={17} /> Print shopping list</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function MealSection({ meal, entries, onUpdate, onSetGrams, onRemove, onAdd }) {
  const Icon = meal.icon;
  const total = entries.reduce((sum, e) => sum + productNutrition(e.product, e.grams).kcal, 0);
  return (
    <section className="meal-section" id={meal.id}>
      <div className="meal-heading">
        <div className="meal-title">
          <div className="meal-icon"><Icon size={18} /></div>
          <div>
            <h2>{meal.label}</h2>
            <span>{entries.length ? `${entries.length} ${entries.length === 1 ? "product" : "products"} · ${format(total)} kcal` : "Nothing logged yet"}</span>
          </div>
        </div>
        <button className="add-button" onClick={onAdd}><Plus size={17} /> Add food</button>
      </div>

      {entries.length === 0 ? (
        <button className="empty-meal" onClick={onAdd}>
          <CirclePlus size={20} />
          <span>Add a product to {meal.label.toLowerCase()}</span>
          <ChevronDown size={16} />
        </button>
      ) : (
        <div className="entry-list">
          {entries.map(entry => {
            const n = productNutrition(entry.product, entry.grams);
            return (
              <div className="entry" key={entry.id}>
                <div className="entry-thumb">
                  {entry.product.image_front_small_url
                    ? <img src={entry.product.image_front_small_url} alt="" />
                    : <Apple size={19} />}
                </div>
                <div className="entry-main">
                  <strong>{entry.product.product_name}</strong>
                  <span>{entry.product.brands || "Product"} · {format(n.kcal)} kcal</span>
                </div>
                <div className="quantity">
                  <button onClick={() => onUpdate(meal.id, entry.id, -25)}><Minus size={14} /></button>
                  <input
                    type="number"
                    min="1"
                    value={entry.grams}
                    onChange={e => onSetGrams(meal.id, entry.id, e.target.value)}
                    aria-label={`${entry.product.product_name} grams`}
                  />
                  <span>g</span>
                  <button onClick={() => onUpdate(meal.id, entry.id, 25)}><Plus size={14} /></button>
                </div>
                <div className="entry-macros">
                  <span>P {format(n.protein, 1)}g</span>
                  <span>C {format(n.carbs, 1)}g</span>
                  <span>F {format(n.fat, 1)}g</span>
                </div>
                <button className="delete-button" onClick={() => onRemove(meal.id, entry.id)} aria-label="Remove"><Trash2 size={17} /></button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
