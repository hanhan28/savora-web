const SUB_URL = "https://ibnjhwxbqlyhkjpkfrsw.supabase.co";
const SUB_KEY = "sb_publishable_Us0NGJasDrvjL5--kowjIw_z80sVhkE";
const sbClient = supabase.createClient(SUB_URL, SUB_KEY);

let cart = {};
let orderMode = "pickup";
let paymentMethod = "";

// MASTER DATA MENU
const menuSavora = [
  // RISOL ROGUT
  {
    id: 1,
    cat: "rogut",
    name: "Risol Rogut isi 3",
    price: 15000,
    desc: "Isi 3 pcs Risol Rogut",
  },
  {
    id: 2,
    cat: "rogut",
    name: "Risol Rogut isi 5",
    price: 25000,
    desc: "Isi 5 pcs Risol Rogut",
  },
  {
    id: 3,
    cat: "rogut",
    name: "Risol Rogut isi 7",
    price: 35000,
    desc: "Isi 7 pcs Risol Rogut",
  },
  {
    id: 4,
    cat: "rogut",
    name: "Risol Rogut Satuan",
    price: 7000,
    desc: "1 pcs Risol Rogut",
  },
  // RISOL MAYO
  {
    id: 5,
    cat: "mayo",
    name: "Risol Mayo isi 3",
    price: 15000,
    desc: "Isi 3 pcs Risol Mayo",
  },
  {
    id: 6,
    cat: "mayo",
    name: "Risol Mayo isi 5",
    price: 25000,
    desc: "Isi 5 pcs Risol Mayo",
  },
  {
    id: 7,
    cat: "mayo",
    name: "Risol Mayo isi 7",
    price: 35000,
    desc: "Isi 7 pcs Risol Mayo",
  },
  {
    id: 8,
    cat: "mayo",
    name: "Risol Mayo Satuan",
    price: 7000,
    desc: "1 pcs Risol Mayo",
  },
  // TASO ORIGINAL
  {
    id: 9,
    cat: "taso-ori",
    name: "Taso Original isi 3",
    price: 15000,
    desc: "Isi 3 pcs Taso Original",
  },
  {
    id: 10,
    cat: "taso-ori",
    name: "Taso Original isi 5",
    price: 25000,
    desc: "Isi 5 pcs Taso Original",
  },
  {
    id: 11,
    cat: "taso-ori",
    name: "Taso Original isi 7",
    price: 35000,
    desc: "Isi 7 pcs Taso Original",
  },
  {
    id: 12,
    cat: "taso-ori",
    name: "Taso Original Satuan",
    price: 6000,
    desc: "1 pcs Taso Original",
  },
  // TASO LUMER
  {
    id: 13,
    cat: "taso-lumer",
    name: "Taso Lumer isi 3",
    price: 17000,
    desc: "Isi 3 pcs Taso Lumer",
  },
  {
    id: 14,
    cat: "taso-lumer",
    name: "Taso Lumer isi 5",
    price: 28000,
    desc: "Isi 5 pcs Taso Lumer",
  },
  {
    id: 15,
    cat: "taso-lumer",
    name: "Taso Lumer isi 7",
    price: 39000,
    desc: "Isi 7 pcs Taso Lumer",
  },
  {
    id: 16,
    cat: "taso-lumer",
    name: "Taso Lumer Satuan",
    price: 7000,
    desc: "1 pcs Taso Lumer",
  },
];

function renderMenu(filter = "all") {
  const container = document.getElementById("menu-container");
  container.innerHTML = "";
  const filtered =
    filter === "all" ? menuSavora : menuSavora.filter((m) => m.cat === filter);

  filtered.forEach((m) => {
    container.innerHTML += `
            <div class="menu-item bg-gray-50 dark:bg-white/5 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 flex items-center gap-4">
                <div class="flex-1">
                    <h3 class="text-sm font-bold">${m.name}</h3>
                    <p class="text-[10px] text-gray-500">${m.desc}</p>
                    <p class="text-gold font-bold mt-1">Rp ${m.price.toLocaleString()}</p>
                </div>
                <button onclick="addToCart('${m.name}', ${m.price})" class="w-10 h-10 rounded-full gold-btn text-white shadow-lg">+</button>
            </div>
        `;
  });
}

// Inisialisasi awal
renderMenu();

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  document.getElementById("theme-icon").innerText =
    document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
}

function setOrderMode(mode) {
  orderMode = mode;
  document.getElementById("btn-pickup").className =
    mode === "pickup"
      ? "flex-1 py-3 rounded-xl font-bold text-sm bg-gold text-white"
      : "flex-1 py-3 rounded-xl font-bold text-sm text-gray-400";
  document.getElementById("btn-delivery").className =
    mode === "delivery"
      ? "flex-1 py-3 rounded-xl font-bold text-sm bg-gold text-white"
      : "flex-1 py-3 rounded-xl font-bold text-sm text-gray-400";
  document
    .getElementById("pickup-location")
    .classList.toggle("hidden", mode !== "pickup");
  document
    .getElementById("delivery-address")
    .classList.toggle("hidden", mode !== "delivery");
}

function filterMenu(cat, e) {
  renderMenu(cat);
  document
    .querySelectorAll(".category-pill")
    .forEach((p) => p.classList.remove("active"));
  e.target.classList.add("active");
}

function addToCart(name, price) {
  if (cart[name]) cart[name].qty += 1;
  else cart[name] = { price: price, qty: 1 };
  updateStickyCart();
  document.getElementById("sticky-cart").style.transform = "translateY(0)";
}

function changeQty(name, delta) {
  if (cart[name]) {
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    renderModalItems();
    updateStickyCart();
  }
}

function deleteItem(name) {
  delete cart[name];
  renderModalItems();
  updateStickyCart();
  if (Object.keys(cart).length === 0) closeCheckout();
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
    document.getElementById("sticky-cart").style.transform = "translateY(200%)";
}

function renderModalItems() {
  const list = document.getElementById("modal-items");
  let html = "";
  let total = 0;
  for (const [name, data] of Object.entries(cart)) {
    total += data.price * data.qty;
    html += `
            <div class="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                <div class="flex-1">
                    <h4 class="text-xs font-bold uppercase">${name}</h4>
                    <p class="text-[10px] text-gold font-bold">Rp ${(data.price * data.qty).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center bg-white dark:bg-white/10 rounded-lg border dark:border-white/20">
                        <button onclick="changeQty('${name}', -1)" class="px-2 py-1 text-gold font-bold">-</button>
                        <span class="text-xs font-bold w-6 text-center">${data.qty}</span>
                        <button onclick="changeQty('${name}', 1)" class="px-2 py-1 text-gold font-bold">+</button>
                    </div>
                    <button onclick="deleteItem('${name}')" class="text-red-500 p-1">Hapus</button>
                </div>
            </div>`;
  }
  list.innerHTML = html;
  document.getElementById("modal-total").innerText =
    `Rp ${total.toLocaleString()}`;
}

function setPayment(method, e) {
  paymentMethod = method;
  document
    .querySelectorAll(".pay-btn")
    .forEach((btn) => btn.classList.remove("border-gold", "bg-gold/10"));
  e.target.classList.add("border-gold", "bg-gold/10");
}

function openCheckout() {
  if (Object.keys(cart).length === 0) return;
  document.getElementById("checkout-modal").classList.remove("hidden");
  renderModalItems();
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.add("hidden");
}

async function handleOrderProcess() {
  const name = document.getElementById("cust-name").value;
  const address =
    orderMode === "pickup"
      ? document.getElementById("pickup-location").value
      : document.getElementById("delivery-address").value;
  if (!name || !address || !paymentMethod || Object.keys(cart).length === 0)
    return alert("Mohon lengkapi data!");

  const btn = document.getElementById("btn-finish");
  const originalText = btn.innerText;
  btn.innerText = "Menyimpan Pesanan...";
  btn.disabled = true;

  try {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const tglCode = `${dd}${mm}${yy}`;
    let nextOrder = "001";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await sbClient
      .from("tr_transaksi")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString());
    nextOrder = String((count || 0) + 1).padStart(3, "0");

    const noTrans = `SV-${tglCode}-${nextOrder}`;
    const total = Object.values(cart).reduce(
      (acc, curr) => acc + curr.price * curr.qty,
      0,
    );
    const itemsSummary = Object.entries(cart)
      .map(([name, data]) => `${name} (${data.qty}x)`)
      .join(", ");

    // Simpan ke Supabase
    const { error: insertError } = await sbClient.from("tr_transaksi").insert([
      {
        tr_notrans: noTrans,
        tr_nama: name,
        tr_orderan: `${itemsSummary} [${orderMode.toUpperCase()}: ${address}]`,
        tr_total_bayar: total,
        tr_metodebayar: paymentMethod,
      },
    ]);

    if (insertError) throw insertError;

    // --- TRIK AMPUH ANTI POPUP ---
    const waMsg = `Halo Savora! Saya ${name} ingin order ${noTrans}:%0A%0A- Menu: ${itemsSummary}%0A- Mode: ${orderMode.toUpperCase()}%0A- Alamat: ${address}%0A- Pembayaran: ${paymentMethod}%0A- Total: Rp ${total.toLocaleString()}`;
    const waUrl = `https://wa.me/6285247763672?text=${waMsg}`;

    // Ubah tombol jadi tombol WhatsApp yang harus diklik user
    btn.innerText = "KLIK UNTUK KIRIM KE WHATSAPP";
    btn.disabled = false;
    btn.style.background = "#25D366"; // Warna Hijau WA
    btn.onclick = function () {
      window.location.href = waUrl;
    };

    alert(
      "Pesanan Tersimpan! Silakan klik tombol hijau untuk mengirim detail ke WhatsApp.",
    );
  } catch (err) {
    console.error(err);
    alert("Gagal koneksi database, coba lagi Lek!");
    btn.innerText = originalText;
    btn.disabled = false;
  }
}
