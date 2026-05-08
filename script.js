const SUB_URL = "https://ibnjhwxbqlyhkjpkfrsw.supabase.co";
const SUB_KEY = "sb_publishable_Us0NGJasDrvjL5--kowjIw_z80sVhkE";
const sbClient = supabase.createClient(SUB_URL, SUB_KEY);

let cart = {};
let orderMode = "pickup";
let paymentMethod = "";
let menuFromDB = [];

async function fetchMenu() {
  try {
    const { data, error } = await sbClient
      .from("ms_menu")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    menuFromDB = data;
    renderMenu();
  } catch (e) {
    console.error(e);
  }
}

function renderMenu(filter = "all") {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";
  const filtered =
    filter === "all"
      ? menuFromDB
      : menuFromDB.filter((m) => m.menu_cat === filter);
  filtered.forEach((m) => {
    let divisor = 1;
    if (m.menu_name.toLowerCase().includes("isi 3")) divisor = 3;
    else if (m.menu_name.toLowerCase().includes("isi 5")) divisor = 5;
    else if (m.menu_name.toLowerCase().includes("isi 7")) divisor = 7;
    const slots = Math.floor(m.menu_stock_pcs / divisor);
    container.innerHTML += `
            <div class="menu-card bg-white dark:bg-dark-card p-4 rounded-[2rem] flex items-center gap-4 shadow-sm border dark:border-white/5">
                <img src="${m.menu_img}" alt="${m.menu_name}" class="menu-card-img shadow-sm">
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-[11px] font-bold uppercase tracking-tight leading-tight">${m.menu_name}</h3>
                        <span class="text-[7px] font-black px-2 py-1 rounded bg-slate-50 dark:bg-white/5 text-slate-400 uppercase">Stock: ${slots}</span>
                    </div>
                    <p class="text-[8px] text-slate-400 mb-3">${m.menu_desc}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-gold font-black text-xs tracking-tighter">Rp ${m.menu_price.toLocaleString()}</span>
                        <button onclick="addToCart('${m.menu_name}', ${m.menu_price})" class="w-9 h-9 rounded-full gold-gradient text-white text-xs shadow-lg active:scale-90 transition-all"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>`;
  });
}

function addToCart(name, price) {
  if (cart[name]) cart[name].qty += 1;
  else cart[name] = { price, qty: 1 };
  updateStickyCart();
  document.getElementById("sticky-cart").style.transform =
    "translateY(0) translateX(-50%)";
}

function updateStickyCart() {
  const items = Object.values(cart);
  const totalQty = items.reduce((acc, curr) => acc + curr.qty, 0);
  const totalPrice = items.reduce(
    (acc, curr) => acc + curr.price * curr.qty,
    0,
  );
  document.getElementById("cart-count").innerText = totalQty;
  document.getElementById("cart-total").innerText =
    `Rp ${totalPrice.toLocaleString()}`;
  if (totalQty === 0)
    document.getElementById("sticky-cart").style.transform =
      "translateY(200%) translateX(-50%)";
}

function renderModalItems() {
  const list = document.getElementById("modal-items");
  let total = 0;
  list.innerHTML = Object.entries(cart)
    .map(([name, data]) => {
      total += data.price * data.qty;
      return `
            <div class="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-2xl">
                <div class="flex-1 text-xs font-bold uppercase">${name}<br><span class="text-gold font-black text-[10px]">Rp ${(data.price * data.qty).toLocaleString()}</span></div>
                <div class="flex items-center gap-3">
                    <button onclick="changeQty('${name}', -1)" class="w-7 h-7 rounded bg-white dark:bg-white/10 font-bold text-xs">-</button>
                    <span class="text-xs font-bold">${data.qty}</span>
                    <button onclick="changeQty('${name}', 1)" class="w-7 h-7 rounded bg-white dark:bg-white/10 font-bold text-xs">+</button>
                </div>
            </div>`;
    })
    .join("");
  document.getElementById("modal-total").innerText =
    `Rp ${total.toLocaleString()}`;
}

function changeQty(name, delta) {
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  renderModalItems();
  updateStickyCart();
  if (Object.keys(cart).length === 0) closeCheckout();
}

function setOrderMode(mode) {
  orderMode = mode;
  document.getElementById("btn-pickup").className =
    mode === "pickup"
      ? "flex-1 py-3 rounded-xl font-bold text-[10px] bg-gold text-white shadow-lg"
      : "flex-1 py-3 rounded-xl font-bold text-[10px] text-slate-400";
  document.getElementById("btn-delivery").className =
    mode === "delivery"
      ? "flex-1 py-3 rounded-xl font-bold text-[10px] bg-gold text-white shadow-lg"
      : "flex-1 py-3 rounded-xl font-bold text-[10px] text-slate-400";
  document
    .getElementById("delivery-address")
    .classList.toggle("hidden", mode !== "delivery");
}

function setPayment(method, e) {
  paymentMethod = method;
  document
    .querySelectorAll(".pay-btn")
    .forEach((b) => b.classList.remove("border-gold", "bg-gold/10"));
  e.target.classList.add("border-gold", "bg-gold/10");
}

async function handleOrderProcess() {
  const name = document.getElementById("cust-name").value;
  const address = document.getElementById("delivery-address").value;
  if (!name || (orderMode === "delivery" && !address) || !paymentMethod)
    return alert("Lengkapi data!");

  const btn = document.getElementById("btn-finish");
  btn.innerText = "PROSES...";
  btn.disabled = true;

  try {
    const now = new Date();
    const tglStr = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}`;

    // LOGIKA ANTI-RESET: Ambil data untuk dicek manual
    const { data: allData, error: fetchErr } = await sbClient
      .from("tr_transaksi")
      .select("tr_notrans")
      .order("id", { ascending: false })
      .limit(100);

    if (fetchErr) throw fetchErr;

    const prefix = `SV-${tglStr}`;
    // Pastikan kodingan bisa membedakan mana orderan hari ini
    const todayTrans = allData.filter(
      (x) => x.tr_notrans && x.tr_notrans.startsWith(prefix),
    );

    const nextNum = todayTrans.length + 1;
    const noTrans = `${prefix}-${String(nextNum).padStart(3, "0")}`;

    const total = Object.values(cart).reduce((a, c) => a + c.price * c.qty, 0);
    const items = Object.entries(cart)
      .map(([n, d]) => `${n} (${d.qty}x)`)
      .join(", ");

    const { error: insErr } = await sbClient.from("tr_transaksi").insert([
      {
        tr_notrans: noTrans,
        tr_nama: name,
        tr_orderan: items,
        tr_total_bayar: total,
        tr_metodebayar: paymentMethod,
        tr_tipe: orderMode.toUpperCase(),
        tr_alamat: address || "Pickup Indogrosir",
      },
    ]);

    if (insErr) throw insErr;
    window.location.href = `https://wa.me/628970250533?text=Halo Savora! Saya ${name} order ${noTrans}:%0A- Menu: ${items}%0A- Mode: ${orderMode.toUpperCase()}%0A- Bayar: ${paymentMethod}%0A- Total: Rp ${total.toLocaleString()}`;
  } catch (e) {
    console.error(e);
    alert("Gagal!");
    btn.innerText = "COBA LAGI";
    btn.disabled = false;
  }
}

function filterMenu(cat, e) {
  renderMenu(cat);
  document
    .querySelectorAll(".category-pill")
    .forEach((p) => p.classList.remove("active"));
  e.target.classList.add("active");
}

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  document.getElementById("theme-icon").innerText =
    document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
}

function openCheckout() {
  document.getElementById("checkout-modal").classList.remove("hidden");
  renderModalItems();
}
function closeCheckout() {
  document.getElementById("checkout-modal").classList.add("hidden");
}

fetchMenu();
setOrderMode("pickup");
