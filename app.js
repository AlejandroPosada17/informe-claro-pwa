// --- Variables globales ---
let datosHoja1 = {};
let datosHoja2 = {};
let evidencias1 = [null, null, null, null];
let evidencias2 = [null, null, null, null, null, null];
let firmas = [null];

// --- Utilidades ---
function toBase64(file, cb) {
  const reader = new FileReader();
  reader.onload = e => cb(reader.result);
  reader.readAsDataURL(file);
}

// --- Renderiza la pantalla inicial ---
function renderHoja1() {
  document.getElementById('app').innerHTML = `
    <form id="form1">
      <img src="logo-claro.png" alt="Logo Claro" style="width:100px;display:block;margin:auto;">
      <h2>Estado General de Estación</h2>
      <label>Nombre de estación*</label>
      <input name="nombreEstacion" required />
      <label>Categoría*</label>
      <input name="categoria" required />
      <label>Zona*</label>
      <input name="zona" required />
      <label>Responsable*</label>
      <input name="responsable" required />
      <label>Departamento*</label>
      <input name="departamento" required />
      <label>Fecha de ejecución*</label>
      <input name="fechaEjecucion" type="date" required />
      <label>Dirección*</label>
      <input name="direccion" required />
      <hr>
      <label>Áreas comunes y locativos</label>
      <table>
        <thead>
          <tr>
            <th>Ítem</th>
            <th>¿Sí/No?</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody id="tabla-items"></tbody>
      </table>
      <label>Observaciones generales</label>
      <textarea name="observaciones"></textarea>
      <hr>
      <label>Evidencias fotográficas</label>
      <div id="evidencias1"></div>
      <hr>
      <label>Firma del funcionario*</label>
      <div>
        <canvas id="firma1" width="300" height="80"></canvas>
        <button type="button" id="limpiarFirma1">Limpiar firma</button>
      </div>
      <label>Nombre*</label>
      <input name="nombreFuncionario" required />
      <label>Fecha elaboración informe*</label>
      <input name="fechaElaboracion" type="date" required />
      <button type="submit">Siguiente</button>
    </form>
  `;

  // Tabla de ítems
  const items = [
    "HALLAZGOS EN LA TORRE, Pintura, Corrosión, Línea de vida (Evidenciar para SI)",
    "HALLAZGO EN PANORÁMICA DE LA ESTACION (Evidenciar para SI)",
    "HALLAZGO EN LA ENTRADA PRINCIPAL, PUERTAS (Evidenciar para SI)",
    "EXTINTOR VENCIDO O DETERIORADO (Evidenciar para SI)",
    "HALLAZGO EN OBRA CIVIL (edificaciones, goteras, escalerillas, techos) (Evidenciar para SI)",
    "NECESIDAD DE PODA O FUMIGACION (Evidenciar para SI)",
    "PLAGAS EN SITIO (ratas, aves, serpientes, abejas, otro) (Evidenciar para SI)",
    "PROBLEMA CON LUCES EXTERNAS, INTERNAS (Evidenciar para SI)",
    "EVIDENCIA DE HURTOS (Equipos faltantes)",
    "HALLAZGOS EN ENTORNO, CONCERTINAS Y CERRAMIENTOS (Evidenciar para SI)",
    "PORCENTAJE DE TANQUES DE COMBUSTIBLE",
    "Se encuentran elementos abandonados en la estación(elementos de implementación, renovación, otros)?",
    "Se encuentran basuras, escombros dentro de la estación?"
  ];
  let html = '';
  for (let i = 0; i < items.length; i++) {
    html += `<tr>
      <td>${items[i]}</td>
      <td>
        <select name="item${i}" required>
          <option value="">-</option>
          <option>SÍ</option>
          <option>NO</option>
        </select>
      </td>
      <td>
        <input name="descItem${i}" />
      </td>
    </tr>`;
  }
  document.getElementById('tabla-items').innerHTML = html;

  // Evidencias
  let evHtml = '';
  for (let i = 0; i < 4; i++) {
    evHtml += `
      <label>Evidencia ${i+1}</label>
      <input type="file" accept="image/*" id="foto1_${i}" />
      <img id="prev1_${i}" class="preview" style="display:none"/>
      <input id="desc1_${i}" placeholder="Descripción evidencia ${i+1}" />
    `;
  }
  document.getElementById('evidencias1').innerHTML = evHtml;
  for (let i = 0; i < 4; i++) {
    document.getElementById(`foto1_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias1[i] = b64;
          document.getElementById(`prev1_${i}`).src = b64;
          document.getElementById(`prev1_${i}`).style.display = 'block';
        });
      }
    };
  }

  // Firma
  let canvas = document.getElementById('firma1');
  let ctx = canvas.getContext('2d');
  let drawing = false;
  canvas.onmousedown = e => { drawing = true; ctx.beginPath(); };
  canvas.onmouseup = e => { drawing = false; firmas[0] = canvas.toDataURL(); };
  canvas.onmousemove = e => {
    if (!drawing) return;
    let rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  // Touch
  canvas.addEventListener('touchstart', e => { drawing = true; ctx.beginPath(); });
  canvas.addEventListener('touchend', e => { drawing = false; firmas[0] = canvas.toDataURL(); });
  canvas.addEventListener('touchmove', e => {
    if (!drawing) return;
    let rect = canvas.getBoundingClientRect();
    let touch = e.touches[0];
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault();
  }, { passive: false });
  document.getElementById('limpiarFirma1').onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    firmas[0] = null;
  };

  // Submit
  document.getElementById('form1').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    datosHoja1 = Object.fromEntries(fd.entries());
    datosHoja1.items = [];
    for (let i = 0; i < items.length; i++) {
      datosHoja1.items.push({
        respuesta: fd.get(`item${i}`),
        descripcion: fd.get(`descItem${i}`)
      });
    }
    datosHoja1.evidencias = [];
    for (let i = 0; i < 4; i++) {
      datosHoja1.evidencias.push({
        img: evidencias1[i],
        desc: document.getElementById(`desc1_${i}`).value
      });
    }
    datosHoja1.firma = firmas[0];
    renderHoja2();
  };
}

function renderHoja2() {
  document.getElementById('app').innerHTML = `
    <form id="form2">
      <h2>Actividad Técnica en Estación</h2>
      <label>Regional*</label>
      <input name="regional" required />
      <label>Tipo de estación*</label>
      <select name="tipoEstacion" required>
        <option value="">Tipo de estación</option>
        <option>TORRE CUADRADA</option>
        <option>TORRE TRIANGULAR</option>
        <option>MONOPOLO</option>
        <option>TERRAZA</option>
        <option>POSTE</option>
        <option>INDOOR</option>
        <option>VALLA</option>
      </select>
      <label>Fecha ejecución*</label>
      <input name="fechaEjecucion" type="date" required />
      <label>Tipo de sitio*</label>
      <select name="tipoSitio" required>
        <option value="">Tipo de sitio</option>
        <option>PROPIO</option>
        <option>ARRENDADO</option>
      </select>
      <label>Fecha fin de actividad*</label>
      <input name="fechaFinActividad" type="date" required />
      <label>Técnico*</label>
      <input name="tecnico" required />
      <label>¿Implica exclusión?*</label>
      <select name="exclusion" required>
        <option value="">¿Implica exclusión?</option>
        <option>SÍ</option>
        <option>NO</option>
      </select>
      <label>Tipo de actividad*</label>
      <select name="tipoActividad" required>
        <option value="">Tipo de actividad</option>
        <option>EMERGENCIA</option>
        <option>CORRECTIVO</option>
      </select>
      <label>Tipo de equipo en falla*</label>
      <select name="tipoEquipoFalla" required>
        <option value="">Tipo de equipo en falla</option>
        <option>TX</option>
        <option>ENERGÍA</option>
        <option>HARDWARE</option>
        <option>SOFTWARE</option>
        <option>HURTO</option>
        <option>CLIMATICOS</option>
      </select>
      <label>Marca</label>
      <input name="marca" />
      <label>Modelo</label>
      <input name="modelo" />
      <label>¿Presenta afectación de servicios?*</label>
      <select name="afectacionServicios" required>
        <option value="">¿Presenta afectación de servicios?</option>
        <option>SÍ</option>
        <option>NO</option>
      </select>
      <label>¿Cambio?*</label>
      <select name="cambio" required>
        <option value="">¿Cambio?</option>
        <option>SÍ</option>
        <option>NO</option>
      </select>
      <label>¿Instalación?*</label>
      <select name="instalacion" required>
        <option value="">¿Instalación?</option>
        <option>SÍ</option>
        <option>NO</option>
      </select>
      <label>Descripción de la falla</label>
      <textarea name="descripcionFalla"></textarea>
      <label>Descripción de la solución</label>
      <textarea name="descripcionSolucion"></textarea>
      <hr>
      <label>Repuestos retirados/instalados</label>
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serial</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tabla-repuestos"></tbody>
      </table>
      <button type="button" id="agregarRepuesto">Agregar repuesto</button>
      <hr>
      <label>Evidencias fotográficas</label>
      <div id="evidencias2"></div>
      <label>¿Falla resuelta?*</label>
      <select name="fallaResuelta" required>
        <option value="">¿Falla resuelta?</option>
        <option>SÍ</option>
        <option>NO</option>
      </select>
      <label>Observaciones de la actividad</label>
      <textarea name="observacionesActividad"></textarea>
      <button type="submit">Generar PDF</button>
      <button type="button" id="volver1">Volver</button>
    </form>
  `;
  // Repuestos
  let repuestos = [];
  function renderRepuestos() {
    let html = '';
    for (let i = 0; i < repuestos.length; i++) {
      html += `<tr>
        <td><input value="${repuestos[i].descripcion||''}" onchange="this.parentNode.parentNode.repuesto.descripcion=this.value" /></td>
        <td><input value="${repuestos[i].marca||''}" onchange="this.parentNode.parentNode.repuesto.marca=this.value" /></td>
        <td><input value="${repuestos[i].modelo||''}" onchange="this.parentNode.parentNode.repuesto.modelo=this.value" /></td>
        <td><input value="${repuestos[i].serial||''}" onchange="this.parentNode.parentNode.repuesto.serial=this.value" /></td>
        <td><button type="button" onclick="this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);repuestos.splice(${i},1);">🗑️</button></td>
      </tr>`;
    }
    document.getElementById('tabla-repuestos').innerHTML = html;
    // Hack para vincular inputs a repuestos
    Array.from(document.querySelectorAll('#tabla-repuestos tr')).forEach((tr, i) => tr.repuesto = repuestos[i]);
  }
  document.getElementById('agregarRepuesto').onclick = () => {
    repuestos.push({descripcion:'',marca:'',modelo:'',serial:''});
    renderRepuestos();
  };
  renderRepuestos();

  // Evidencias
  let evHtml = '';
  for (let i = 0; i < 6; i++) {
    evHtml += `
      <label>Evidencia ${i+1}</label>
      <input type="file" accept="image/*" id="foto2_${i}" />
      <img id="prev2_${i}" class="preview" style="display:none"/>
      <input id="desc2_${i}" placeholder="Descripción evidencia ${i+1}" />
    `;
  }
  document.getElementById('evidencias2').innerHTML = evHtml;
  for (let i = 0; i < 6; i++) {
    document.getElementById(`foto2_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias2[i] = b64;
          document.getElementById(`prev2_${i}`).src = b64;
          document.getElementById(`prev2_${i}`).style.display = 'block';
        });
      }
    };
  }

  // Submit
  document.getElementById('form2').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    datosHoja2 = Object.fromEntries(fd.entries());
    datosHoja2.repuestos = repuestos;
    datosHoja2.evidencias = [];
    for (let i = 0; i < 6; i++) {
      datosHoja2.evidencias.push({
        img: evidencias2[i],
        desc: document.getElementById(`desc2_${i}`).value
      });
    }
    renderPdf();
  };
  document.getElementById('volver1').onclick = renderHoja1;
}

function renderPdf() {
  document.getElementById('app').innerHTML = `
    <h2>Previsualización PDF</h2>
    <div id="pdf-preview"></div>
    <button id="descargar">Descargar PDF</button>
    <button id="volver2">Volver a editar</button>
  `;
  setTimeout(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'pt',format:'a4'});
    // Logo
    const img = new Image();
    img.src = 'logo-claro.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 30, 30, 60, 60);
      doc.setFont('Arial','bold');
      doc.setTextColor(227,6,19);
      doc.setFontSize(16);
      doc.text('CLARO OPERACIÓN Y MANTENIMIENTO', 110, 50);
      doc.setFontSize(13);
      doc.text('ESTADO GENERAL DE SITIO', 110, 70);
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      let y = 100;
      // Hoja 1
      [
        ['Nombre de estación', datosHoja1.nombreEstacion],
        ['Categoría', datosHoja1.categoria],
        ['Zona', datosHoja1.zona],
        ['Responsable', datosHoja1.responsable],
        ['Departamento', datosHoja1.departamento],
        ['Fecha de ejecución', datosHoja1.fechaEjecucion],
        ['Dirección', datosHoja1.direccion]
      ].forEach(([k,v]) => { doc.text(`${k}: ${v||''}`, 30, y); y+=16; });
      y+=8;
      doc.setTextColor(227,6,19);
      doc.text('ÁREAS COMUNES Y LOCATIVOS', 30, y); y+=14;
      doc.setTextColor(0,0,0);
      datosHoja1.items.forEach((item,i) => {
        doc.text(`${i+1}. ${item.respuesta||'-'} - ${item.descripcion||''}`, 35, y);
        y+=12;
      });
      y+=8;
      doc.text('Observaciones generales:', 30, y); y+=12;
      doc.text(datosHoja1.observaciones||'', 35, y); y+=20;
      // Evidencias
      for (let i = 0; i < 4; i++) {
        if (datosHoja1.evidencias[i].img) {
          doc.addImage(datosHoja1.evidencias[i].img, 'JPEG', 30+(i*120), y, 100, 60);
          doc.text(datosHoja1.evidencias[i].desc||'', 30+(i*120), y+70);
        }
      }
      y+=90;
      // Firma
      if (datosHoja1.firma) {
        doc.addImage(datosHoja1.firma, 'PNG', 30, y, 120, 40);
        doc.text('Firma funcionario:', 30, y+50);
        doc.text(datosHoja1.nombreFuncionario||'', 160, y+50);
        doc.text('Fecha elaboración informe:', 30, y+65);
        doc.text(datosHoja1.fechaElaboracion||'', 160, y+65);
      }
      // Pie de página
      doc.setTextColor(227,6,19);
      doc.setFontSize(10);
      doc.text('Clasificación: Uso Interno. Documento Claro Colombia', 30, 820);

      // Segunda hoja
      doc.addPage();
      let y2 = 50;
      doc.addImage(img, 'PNG', 30, 30, 60, 60);
      doc.setFont('Arial','bold');
      doc.setTextColor(227,6,19);
      doc.setFontSize(16);
      doc.text('ACTIVIDAD TÉCNICA EN ESTACIÓN', 110, 50);
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      [
        ['Regional', datosHoja2.regional],
        ['Tipo de estación', datosHoja2.tipoEstacion],
        ['Fecha ejecución', datosHoja2.fechaEjecucion],
        ['Tipo de sitio', datosHoja2.tipoSitio],
        ['Fecha fin de actividad', datosHoja2.fechaFinActividad],
        ['Técnico', datosHoja2.tecnico],
        ['¿Implica exclusión?', datosHoja2.exclusion],
        ['Tipo de actividad', datosHoja2.tipoActividad],
        ['Tipo de equipo en falla', datosHoja2.tipoEquipoFalla],
        ['Marca', datosHoja2.marca],
        ['Modelo', datosHoja2.modelo],
        ['¿Presenta afectación de servicios?', datosHoja2.afectacionServicios],
        ['¿Cambio?', datosHoja2.cambio],
        ['¿Instalación?', datosHoja2.instalacion]
      ].forEach(([k,v]) => { doc.text(`${k}: ${v||''}`, 30, y2); y2+=16; });
      y2+=8;
      doc.text('Descripción de la falla:', 30, y2); y2+=12;
      doc.text(datosHoja2.descripcionFalla||'', 35, y2); y2+=16;
      doc.text('Descripción de la solución:', 30, y2); y2+=12;
      doc.text(datosHoja2.descripcionSolucion||'', 35, y2); y2+=16;
      // Repuestos
      doc.setTextColor(227,6,19);
      doc.text('Repuestos retirados/instalados:', 30, y2); y2+=14;
      doc.setTextColor(0,0,0);
      (datosHoja2.repuestos||[]).forEach((rep,i) => {
        doc.text(`${i+1}. ${rep.descripcion||''} | ${rep.marca||''} | ${rep.modelo||''} | ${rep.serial||''}`, 35, y2);
        y2+=12;
      });
      y2+=8;
      // Evidencias
      for (let i = 0; i < 6; i++) {
        if (datosHoja2.evidencias[i].img) {
          doc.addImage(datosHoja2.evidencias[i].img, 'JPEG', 30+((i%3)*120), y2+Math.floor(i/3)*90, 100, 60);
          doc.text(datosHoja2.evidencias[i].desc||'', 30+((i%3)*120), y2+Math.floor(i/3)*90+70);
        }
      }
      y2+=200;
      doc.text('¿Falla resuelta?:', 30, y2); doc.text(datosHoja2.fallaResuelta||'', 150, y2); y2+=16;
      doc.text('Observaciones de la actividad:', 30, y2); y2+=12;
      doc.text(datosHoja2.observacionesActividad||'', 35, y2); y2+=16;
      // Pie de página
      doc.setTextColor(227,6,19);
      doc.setFontSize(10);
      doc.text('Clasificación: Uso Interno. Documento Claro Colombia', 30, 820);

      // Previsualización
      document.getElementById('pdf-preview').innerHTML = `<iframe width="100%" height="500" src="${doc.output('bloburl')}"></iframe>`;
      document.getElementById('descargar').onclick = () => doc.save('informe-claro.pdf');
      document.getElementById('volver2').onclick = renderHoja2;
    };
  }, 500);
}

// Inicia la app
renderHoja1();
