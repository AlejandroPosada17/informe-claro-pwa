document.addEventListener("DOMContentLoaded", () => {
  const form1 = document.getElementById("form1");
  const form2 = document.getElementById("form2");
  const volver1 = document.getElementById("volver1");

  // Generar la tabla de 13 ítems automáticamente
  const tabla13 = document.getElementById("tabla13");
  for (let i = 1; i <= 13; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>Ítem ${i}
        <select name="item_${i}_respuesta">
          <option>SI</option>
          <option>NO</option>
        </select>
        <input name="item_${i}_comentario" placeholder="Comentario..." />
      </label>
    `;
    tabla13.appendChild(div);
  }

  // Firma
  const canvas = document.getElementById("firmaCanvas");
  const ctx = canvas.getContext("2d");
  let dibujando = false;

  canvas.addEventListener("mousedown", () => dibujando = true);
  canvas.addEventListener("mouseup", () => dibujando = false);
  canvas.addEventListener("mousemove", dibujar);
  canvas.addEventListener("touchstart", e => {
    dibujando = true;
    e.preventDefault();
  });
  canvas.addEventListener("touchend", () => dibujando = false);
  canvas.addEventListener("touchmove", e => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    dibujarManual(t.clientX - rect.left, t.clientY - rect.top);
    e.preventDefault();
  });

  function dibujar(e) {
    if (!dibujando) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function dibujarManual(x, y) {
    if (!dibujando) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  document.getElementById("limpiarFirma").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Navegación
  form1.addEventListener("submit", e => {
    e.preventDefault();
    form1.style.display = "none";
    form2.style.display = "block";
  });

  volver1.addEventListener("click", () => {
    form2.style.display = "none";
    form1.style.display = "block";
  });

  form2.addEventListener("submit", e => {
    e.preventDefault();
    alert("Aquí se generará el PDF en la siguiente etapa.");
    // Aquí vendrá la función para generar el PDF con jsPDF
  });

  document.getElementById("agregarRepuesto").addEventListener("click", () => {
    const contenedor = document.getElementById("repuestos");
    const div = document.createElement("div");
    div.innerHTML = `
      <input name="repuesto_descripcion[]" placeholder="Descripción" />
      <input name="repuesto_marca[]" placeholder="Marca" />
      <input name="repuesto_modelo[]" placeholder="Modelo" />
      <input name="repuesto_serial[]" placeholder="Serial" />
    `;
    contenedor.appendChild(div);
  });
});
