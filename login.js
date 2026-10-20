const form = document.querySelector("#login-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  const error = document.querySelector("#login-error");
  button.disabled = true;
  button.textContent = "Entrando…";
  error.textContent = "";
  try {
    const values = new FormData(form);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: values.get("username"),
        password: values.get("password"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "Não foi possível entrar.");
    location.replace("/index.html");
  } catch (failure) {
    error.textContent = failure.message;
    button.disabled = false;
    button.textContent = "Entrar no estoque";
  }
});
