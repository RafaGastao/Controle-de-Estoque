const $ = (s) => document.querySelector(s);
let data = { items: [], history: [] };
let revision = 0;
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (response.status === 401) {
    location.replace("/login.html");
    throw Error("Sua sessão terminou. Entre novamente.");
  }
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 409) await loadInventory();
    throw Error(body.error || "Não foi possível concluir.");
  }
  return body;
}
async function loadInventory() {
  const result = await api("/api/inventory");
  data = validate(result.data);
  revision = result.revision;
  render();
}
let view = "stock",
  mode = "new",
  editing = null;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const low = (i) => i.quantity <= i.minimum;
const stamp = (s) =>
  new Date(s).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
function validate(d) {
  if (!d || !Array.isArray(d.items) || !Array.isArray(d.history))
    throw Error("Arquivo inválido.");
  const ids = new Set();
  for (const i of d.items) {
    if (
      typeof i.id !== "string" ||
      ids.has(i.id) ||
      typeof i.name !== "string" ||
      !i.name.trim() ||
      typeof i.category !== "string" ||
      !["kg", "g", "L", "mL", "un"].includes(i.unit) ||
      !Number.isFinite(i.quantity) ||
      i.quantity < 0 ||
      !Number.isFinite(i.minimum) ||
      i.minimum < 0
    )
      throw Error("Ingredientes inválidos.");
    ids.add(i.id);
  }
  for (const m of d.history) {
    if (
      typeof m.name !== "string" ||
      !["entrada", "saída"].includes(m.type) ||
      !Number.isFinite(m.amount) ||
      m.amount <= 0 ||
      typeof m.unit !== "string" ||
      !Number.isFinite(Date.parse(m.date)) ||
      typeof m.note !== "string"
    )
      throw Error("Histórico inválido.");
  }
  return d;
}
async function persist(next) {
  const result = await api("/api/inventory", {
    method: "PUT",
    body: JSON.stringify({ data: next, revision }),
  });
  data = result.data;
  revision = result.revision;
  return true;
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 3000);
}
function render() {
  const count = data.items.filter(low).length;
  $("#total").textContent = data.items.length;
  $("#healthy").textContent = data.items.length - count;
  $("#low").textContent = count;
  $("#nav-count").textContent = count;
  $("#moves").textContent = data.history.filter(
    (m) =>
      new Date(m.date).toLocaleDateString() === new Date().toLocaleDateString(),
  ).length;
  $("#notice").hidden = !count;
  $("#notice").innerHTML =
    `⚠ <strong>${count} ingrediente${count > 1 ? "s" : ""} precisa${count > 1 ? "m" : ""} de reposição.</strong> Confira o estoque mínimo para planejar suas compras. <button id="see-alerts">Ver alertas →</button>`;
  if (count) $("#see-alerts").onclick = () => changeView("alerts");
  const titles = {
    stock: [
      "Estoque de ingredientes",
      "Uma visão clara do que sua cozinha tem e do que precisa.",
      "Seus ingredientes",
    ],
    history: [
      "Movimentações",
      "Acompanhe cada entrada e saída da sua cozinha.",
      "Histórico de movimentações",
    ],
    alerts: [
      "Alertas de estoque",
      "Organize as reposições para manter sua cozinha em dia.",
      "Ingredientes para repor",
    ],
  };
  $("#view-title").textContent = titles[view][0];
  $("#view-description").textContent = titles[view][1];
  $("#panel-title").textContent = titles[view][2];
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#category").hidden = view === "history";
  $("#status").hidden = view !== "stock";
  const query = $("#search").value.toLocaleLowerCase("pt-BR");
  let list;
  if (view === "history") {
    list = data.history.filter((m) =>
      m.name.toLocaleLowerCase("pt-BR").includes(query),
    );
    $("#thead").innerHTML =
      "<tr><th>INGREDIENTE</th><th>MOVIMENTAÇÃO</th><th>QUANTIDADE</th><th>DATA E HORA</th><th>OBSERVAÇÃO</th></tr>";
    $("#rows").innerHTML = list
      .map(
        (m) =>
          `<tr><td><strong>${esc(m.name)}</strong></td><td><span class="badge ${m.type === "saída" ? "low" : ""}">${m.type === "entrada" ? "↗ Entrada" : "↘ Saída"}</span></td><td>${fmt(m.amount)} ${esc(m.unit)}</td><td>${stamp(m.date)}</td><td>${esc(m.note) || "—"}</td></tr>`,
      )
      .join("");
  } else {
    list = data.items
      .filter(
        (i) =>
          i.name.toLocaleLowerCase("pt-BR").includes(query) &&
          (!$("#category").value || i.category === $("#category").value) &&
          (view !== "alerts" || low(i)) &&
          (view !== "stock" ||
            !$("#status").value ||
            ($("#status").value === "ok"
              ? !low(i)
              : $("#status").value === "zero"
                ? i.quantity === 0
                : low(i))),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    $("#thead").innerHTML =
      "<tr><th>INGREDIENTE</th><th>CATEGORIA</th><th>DISPONÍVEL</th><th>ESTOQUE MÍNIMO</th><th>SITUAÇÃO</th><th>AÇÕES</th></tr>";
    $("#rows").innerHTML = list
      .map(
        (i) =>
          `<tr><td><div class="ingredient"><span class="tile">${esc(i.name[0].toUpperCase())}</span><strong>${esc(i.name)}</strong></div></td><td class="muted">${esc(i.category)}</td><td><strong>${fmt(i.quantity)}</strong> <span class="muted">${esc(i.unit)}</span></td><td class="muted">${fmt(i.minimum)} ${esc(i.unit)}</td><td><span class="badge ${i.quantity === 0 ? "zero" : low(i) ? "low" : ""}">${i.quantity === 0 ? "Sem estoque" : low(i) ? "Estoque baixo" : "Em dia"}</span></td><td><div class="row-actions"><button data-action="in" data-id="${esc(i.id)}" aria-label="Entrada de ${esc(i.name)}">＋</button><button data-action="out" data-id="${esc(i.id)}" aria-label="Saída de ${esc(i.name)}">−</button><button data-action="edit" data-id="${esc(i.id)}">Editar</button></div></td></tr>`,
      )
      .join("");
  }
  if (!list.length)
    $("#rows").innerHTML =
      `<tr><td colspan="6" class="empty"><strong>${data.items.length ? (view === "alerts" ? "Tudo em dia por aqui!" : "Nenhum resultado encontrado") : "Sua cozinha começa aqui"}</strong>${data.items.length ? "Os ingredientes que correspondem a este filtro aparecerão aqui." : "Cadastre seu primeiro ingrediente para acompanhar o estoque e as reposições."}</td></tr>`;
  $("#result-count").textContent =
    view === "history"
      ? "Todas as entradas e saídas registradas"
      : "Quantidades atualizadas a cada movimentação";
  $("#footer-count").textContent =
    `${list.length} ${view === "history" ? "movimentação(ões)" : "ingrediente(s)"}`;
}
function changeView(v) {
  view = v;
  $("#search").value = "";
  $("#category").value = "";
  $("#status").value = "";
  render();
}
const categories = [
  "Hortifruti",
  "Proteínas",
  "Grãos e cereais",
  "Laticínios",
  "Temperos",
  "Bebidas",
  "Outros",
];
function label(text, html) {
  return `<label>${text}${html}</label>`;
}
function openForm(type, id) {
  mode = type;
  editing = id || null;
  $("#error").textContent = "";
  $("#form").reset();
  const item = data.items.find((i) => i.id === id);
  if (type === "new" || type === "edit") {
    $("#dialog-title").textContent =
      type === "new" ? "Novo ingrediente" : "Editar ingrediente";
    $("#fields").innerHTML =
      label(
        "Nome do ingrediente",
        `<input name="name" required maxlength="80" value="${esc(item?.name || "")}" placeholder="Ex.: Arroz branco">`,
      ) +
      label(
        "Categoria",
        `<select name="category">${categories.map((c) => `<option ${item?.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>`,
      ) +
      label(
        "Unidade de medida",
        `<select name="unit" ${type === "edit" ? "disabled" : ""}>${["kg", "g", "L", "mL", "un"].map((u) => `<option ${item?.unit === u ? "selected" : ""}>${u}</option>`).join("")}</select>`,
      ) +
      (type === "new"
        ? label(
            "Quantidade inicial",
            '<input name="quantity" type="number" min="0" max="999999999" step="0.001" value="0" required>',
          )
        : "") +
      label(
        "Estoque mínimo · alerta quando o saldo atingir este valor",
        `<input name="minimum" type="number" min="0" max="999999999" step="0.001" value="${item?.minimum || 0}" required>`,
      );
  } else {
    if (!data.items.length) {
      toast("Cadastre um ingrediente primeiro.");
      return;
    }
    $("#dialog-title").textContent = "Registrar movimentação";
    $("#fields").innerHTML =
      label(
        "Ingrediente",
        `<select name="item">${data.items.map((i) => `<option value="${esc(i.id)}" ${id === i.id ? "selected" : ""}>${esc(i.name)} · ${fmt(i.quantity)} ${esc(i.unit)} disponíveis</option>`).join("")}</select>`,
      ) +
      label(
        "Tipo de movimentação",
        `<select name="type"><option value="entrada">Entrada de produtos</option><option value="saída" ${type === "out" ? "selected" : ""}>Saída de produtos</option></select>`,
      ) +
      label(
        "Quantidade na unidade do ingrediente",
        '<input name="amount" type="number" min="0.001" max="999999999" step="0.001" required placeholder="0">',
      ) +
      label(
        "Observação (opcional)",
        '<input name="note" maxlength="160" placeholder="Ex.: Compra ou consumo da cozinha">',
      );
  }
  $("#dialog").showModal();
}
$("#form").onsubmit = async (e) => {
  e.preventDefault();
  const submitButton = e.target.querySelector("button[type=submit]");
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  const f = new FormData(e.target),
    next = structuredClone(data),
    now = new Date().toISOString();
  try {
    if (mode === "new" || mode === "edit") {
      const name = f.get("name").trim(),
        minimum = Number(f.get("minimum"));
      if (!name) throw Error("Informe o nome do ingrediente.");
      if (
        next.items.some(
          (i) =>
            i.id !== editing &&
            i.name.toLocaleLowerCase("pt-BR") ===
              name.toLocaleLowerCase("pt-BR"),
        )
      )
        throw Error("Já existe um ingrediente com esse nome.");
      if (mode === "edit") {
        Object.assign(
          next.items.find((i) => i.id === editing),
          { name, category: f.get("category"), minimum },
        );
      } else {
        const i = {
          id: crypto.randomUUID(),
          name,
          category: f.get("category"),
          unit: f.get("unit"),
          minimum,
          quantity: Number(f.get("quantity")),
        };
        next.items.push(i);
        if (i.quantity > 0)
          next.history.unshift({
            id: crypto.randomUUID(),
            itemId: i.id,
            name: i.name,
            unit: i.unit,
            type: "entrada",
            amount: i.quantity,
            date: now,
            note: "Estoque inicial",
          });
      }
    } else {
      const i = next.items.find((i) => i.id === f.get("item")),
        amount = Number(f.get("amount")),
        type = f.get("type");
      if (!i || !Number.isFinite(amount) || amount <= 0)
        throw Error("Informe uma quantidade válida.");
      if (type === "saída" && amount > i.quantity)
        throw Error(
          `Saldo insuficiente. Disponível: ${fmt(i.quantity)} ${i.unit}.`,
        );
      i.quantity =
        Math.round(
          (i.quantity + (type === "entrada" ? amount : -amount)) * 1000,
        ) / 1000;
      next.history.unshift({
        id: crypto.randomUUID(),
        itemId: i.id,
        name: i.name,
        unit: i.unit,
        type,
        amount,
        date: now,
        note: f.get("note").trim(),
      });
    }
    validate(next);
    if (!(await persist(next))) return;
    $("#dialog").close();
    render();
    toast(
      mode === "new"
        ? "Ingrediente cadastrado."
        : mode === "edit"
          ? "Ingrediente atualizado."
          : "Movimentação registrada.",
    );
  } catch (err) {
    $("#error").textContent = err.message;
  } finally {
    submitButton.disabled = false;
  }
};
document
  .querySelectorAll("[data-view]")
  .forEach((b) => (b.onclick = () => changeView(b.dataset.view)));
$("#new").onclick = () => openForm("new");
$("#movement").onclick = () => openForm("move");
$("#rows").onclick = (e) => {
  const b = e.target.closest("[data-action]");
  if (b) openForm(b.dataset.action, b.dataset.id);
};
$("#close").onclick = $("#cancel").onclick = () => $("#dialog").close();
["search", "category", "status"].forEach((id) =>
  $("#" + id).addEventListener(id === "search" ? "input" : "change", render),
);
$("#today").textContent = new Date().toLocaleDateString("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
$("#backup").onclick = () => {
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `casa-de-madeira-estoque-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#restore").onclick = () => $("#file").click();
$("#file").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    const incoming = validate(JSON.parse(await file.text()));
    if (
      confirm(
        `Restaurar ${incoming.items.length} ingredientes e ${incoming.history.length} movimentações? Os dados atuais serão substituídos.`,
      )
    ) {
      if (await persist(incoming)) {
        render();
        toast("Backup restaurado.");
      }
    }
  } catch (err) {
    alert("Não foi possível restaurar o backup: " + err.message);
  } finally {
    e.target.value = "";
  }
};
$("#logout").onclick = async () => {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
    location.replace("/login.html");
  } catch (error) {
    toast(error.message);
  }
};
async function refresh() {
  try {
    await loadInventory();
  } catch (error) {
    toast(error.message);
  }
}
window.addEventListener("focus", refresh);
setInterval(() => {
  if (!document.hidden && !$("#dialog").open) refresh();
}, 30000);
refresh();
