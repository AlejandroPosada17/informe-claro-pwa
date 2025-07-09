// --- Variables globales ---
let datosHoja1 = JSON.parse(localStorage.getItem('datosHoja1') || '{}');
let datosHoja2 = JSON.parse(localStorage.getItem('datosHoja2') || '{}');
let evidencias1 = [null, null, null, null];
let evidencias2 = [null, null, null, null, null, null];
let firmas = [null];

// Eliminamos LOGO_BASE64 y volvemos a usar la ruta del archivo

// --- Utilidades ---
function toBase64(file, cb) {
  const reader = new FileReader();
  reader.onload = e => cb(reader.result);
  reader.readAsDataURL(file);
}
function guardarLocal() {
  // Guardar solo los datos de texto, sin imágenes
  let d1 = {...datosHoja1};
  let d2 = {...datosHoja2};
  delete d1.evidencias;
  delete d1.firma;
  delete d2.evidencias;
  localStorage.setItem('datosHoja1', JSON.stringify(d1));
  localStorage.setItem('datosHoja2', JSON.stringify(d2));
}
function validarHoja1(datos) {
  if (!datos) return false;
  const requeridos = [
    'nombreEstacion', 'categoria', 'zona', 'responsable', 'departamento',
    'fechaEjecucion', 'direccion', 'nombreFuncionario', 'fechaElaboracion'
  ];
  for (let k of requeridos) if (!datos[k] || datos[k].trim() === "") return false;
  if (!Array.isArray(datos.items) || datos.items.length !== 13) return false;
  for (let i = 0; i < 13; i++) {
    if (!datos.items[i] || !datos.items[i].respuesta || datos.items[i].respuesta.trim() === "") return false;
  }
  if (!firmas[0]) return false;
  return true;
}
function validarHoja2(datos) {
  if (!datos) return false;
  const requeridos = [
    'regional', 'tipoEstacion', 'fechaEjecucion', 'tipoSitio', 'fechaFinActividad',
    'tecnico', 'exclusion', 'tipoActividad', 'tipoEquipoFalla',
    'afectacionServicios', 'cambio', 'instalacion', 'fallaResuelta'
  ];
  for (let k of requeridos) if (!datos[k] || datos[k].trim() === "") return false;
  return true;
}

// --- Cámara emergente ---
function abrirCamara(callback) {
  let facingMode = "environment";
  let stream = null;
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  overlay.style.zIndex = 9999;
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const video = document.createElement('video');
  video.style.width = '90vw';
  video.style.maxWidth = '400px';
  video.style.borderRadius = '8px';
  video.autoplay = true;

  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.gap = '8px';
  btns.style.marginTop = '8px';

  const btnFlip = document.createElement('button');
  btnFlip.textContent = 'Cambiar cámara';
  btnFlip.type = 'button';

  const btnCapture = document.createElement('button');
  btnCapture.textContent = 'Capturar';
  btnCapture.type = 'button';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancelar';
  btnCancel.type = 'button';

  btns.appendChild(btnFlip);
  btns.appendChild(btnCapture);
  btns.appendChild(btnCancel);

  overlay.appendChild(video);
  overlay.appendChild(btns);
  document.body.appendChild(overlay);

  function startStream() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode } }).then(s => {
      stream = s;
      video.srcObject = stream;
      video.play();
    }).catch(() => {
      alert('No se pudo acceder a la cámara.');
      document.body.removeChild(overlay);
    });
  }
  startStream();

  btnFlip.onclick = () => {
    facingMode = (facingMode === "environment") ? "user" : "environment";
    startStream();
  };
  btnCapture.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg');
    if (stream) stream.getTracks().forEach(track => track.stop());
    document.body.removeChild(overlay);
    callback(b64);
  };
  btnCancel.onclick = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    document.body.removeChild(overlay);
  };
}

// --- Renderiza la pantalla inicial ---
function renderHoja1() {
  document.getElementById('app').innerHTML = `
    <form id="form1">
      <img src="logo-claro.png" alt="Logo Claro" style="width:100px;display:block;margin:auto;">
      <h2>Estado General de Estación</h2>
      <label>Nombre de estación*</label>
      <input name="nombreEstacion" required value="${datosHoja1.nombreEstacion||''}" />
      <label>Categoría*</label>
      <input name="categoria" required value="${datosHoja1.categoria||''}" />
      <label>Zona*</label>
      <input name="zona" required value="${datosHoja1.zona||''}" />
      <label>Responsable*</label>
      <input name="responsable" required value="${datosHoja1.responsable||''}" />
      <label>Departamento*</label>
      <input name="departamento" required value="${datosHoja1.departamento||''}" />
      <label>Fecha de ejecución*</label>
      <input name="fechaEjecucion" type="date" required value="${datosHoja1.fechaEjecucion||''}" />
      <label>Dirección*</label>
      <input name="direccion" required value="${datosHoja1.direccion||''}" />
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
      <textarea name="observaciones">${datosHoja1.observaciones||''}</textarea>
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
      <input name="nombreFuncionario" required value="${datosHoja1.nombreFuncionario||''}" />
      <label>Fecha elaboración informe*</label>
      <input name="fechaElaboracion" type="date" required value="${datosHoja1.fechaElaboracion||''}" />
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
  let itemsGuardados = datosHoja1.items || [];
  for (let i = 0; i < items.length; i++) {
    html += `<tr>
      <td>${items[i]}</td>
      <td>
        <select name="item${i}" required>
          <option value="">-</option>
          <option${itemsGuardados[i]?.respuesta==='SÍ'?' selected':''}>SÍ</option>
          <option${itemsGuardados[i]?.respuesta==='NO'?' selected':''}>NO</option>
        </select>
      </td>
      <td>
        <input name="descItem${i}" value="${itemsGuardados[i]?.descripcion||''}" />
      </td>
    </tr>`;
  }
  document.getElementById('tabla-items').innerHTML = html;

  // Evidencias
  let evHtml = '';
  for (let i = 0; i < 4; i++) {
    evHtml += `
      <label>Evidencia ${i+1}</label>
      <div class="evidencia-btns">
        <button type="button" id="tomarfoto1_${i}">Tomar foto</button>
        <input type="file" accept="image/*" capture="environment" id="filecam1_${i}" style="display:none;" />
        <button type="button" id="abrirfotos1_${i}">Abrir fotos</button>
        <input type="file" accept="image/*" id="filegal1_${i}" style="display:none;" />
      </div>
      <img id="prev1_${i}" class="preview" style="display:${evidencias1[i]?'block':'none'}" src="${evidencias1[i]||''}"/>
      <input id="desc1_${i}" placeholder="Descripción evidencia ${i+1}" value="${datosHoja1.evidencias?.[i]?.desc||''}" />
    `;
  }
  document.getElementById('evidencias1').innerHTML = evHtml;
  for (let i = 0; i < 4; i++) {
    document.getElementById(`tomarfoto1_${i}`).onclick = () => {
      document.getElementById(`filecam1_${i}`).click();
    };
    document.getElementById(`filecam1_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias1[i] = b64;
          document.getElementById(`prev1_${i}`).src = b64;
          document.getElementById(`prev1_${i}`).style.display = 'block';
        });
      }
    };
    document.getElementById(`abrirfotos1_${i}`).onclick = () => {
      document.getElementById(`filegal1_${i}`).click();
    };
    document.getElementById(`filegal1_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
        evidencias1[i] = b64;
        document.getElementById(`prev1_${i}`).src = b64;
        document.getElementById(`prev1_${i}`).style.display = 'block';
      });
      }
    };
    document.getElementById(`desc1_${i}`).oninput = guardarLocal;
  }

  // Firma
  let canvas = document.getElementById('firma1');
  let ctx = canvas.getContext('2d');
  if (firmas[0]) {
    let img = new window.Image();
    img.onload = () => ctx.drawImage(img, 0, 0, 300, 80);
    img.src = firmas[0];
  }
  let drawing = false;
  canvas.onmousedown = e => { drawing = true; ctx.beginPath(); };
  canvas.onmouseup = e => { drawing = false; firmas[0] = canvas.toDataURL(); datosHoja1.firma = firmas[0]; guardarLocal(); };
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
  canvas.addEventListener('touchend', e => { drawing = false; firmas[0] = canvas.toDataURL(); datosHoja1.firma = firmas[0]; guardarLocal(); });
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
    datosHoja1.firma = null;
    guardarLocal();
  };

  // Guardado en cada cambio
  Array.from(document.querySelectorAll('#form1 input, #form1 textarea, #form1 select')).forEach(el => {
    el.oninput = () => {
      const fd = new FormData(document.getElementById('form1'));
      datosHoja1 = Object.fromEntries(fd.entries());
      datosHoja1.items = [];
      for (let i = 0; i < items.length; i++) {
        datosHoja1.items.push({
          respuesta: fd.get(`item${i}`),
          descripcion: fd.get(`descItem${i}`)
        });
      }
      guardarLocal();
    };
  });

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
    // Guardar evidencias y descripciones en datosHoja1
    datosHoja1.evidencias = [];
    for (let i = 0; i < 4; i++) {
      datosHoja1.evidencias.push({
        img: evidencias1[i],
        desc: document.getElementById(`desc1_${i}`).value
      });
    }
    // Guardar firma
    datosHoja1.firma = firmas[0];
    guardarLocal();
    if (validarHoja1(datosHoja1)) {
      renderHoja2();
    } else {
      alert('Por favor, completa todos los campos requeridos.');
    }
  };
}

function renderHoja2() {
  document.getElementById('app').innerHTML = `
    <form id="form2">
      <h2>Actividad Técnica en Estación</h2>
      <label>Regional*</label>
      <input name="regional" required value="${datosHoja2.regional||''}" />
      <label>Tipo de estación*</label>
      <select name="tipoEstacion" required>
        <option value="">Tipo de estación</option>
        <option${datosHoja2.tipoEstacion==='TORRE CUADRADA'?' selected':''}>TORRE CUADRADA</option>
        <option${datosHoja2.tipoEstacion==='TORRE TRIANGULAR'?' selected':''}>TORRE TRIANGULAR</option>
        <option${datosHoja2.tipoEstacion==='MONOPOLO'?' selected':''}>MONOPOLO</option>
        <option${datosHoja2.tipoEstacion==='TERRAZA'?' selected':''}>TERRAZA</option>
        <option${datosHoja2.tipoEstacion==='POSTE'?' selected':''}>POSTE</option>
        <option${datosHoja2.tipoEstacion==='INDOOR'?' selected':''}>INDOOR</option>
        <option${datosHoja2.tipoEstacion==='VALLA'?' selected':''}>VALLA</option>
      </select>
      <label>Fecha ejecución*</label>
      <input name="fechaEjecucion" type="date" required value="${datosHoja2.fechaEjecucion||''}" />
      <label>Tipo de sitio*</label>
      <select name="tipoSitio" required>
        <option value="">Tipo de sitio</option>
        <option${datosHoja2.tipoSitio==='PROPIO'?' selected':''}>PROPIO</option>
        <option${datosHoja2.tipoSitio==='ARRENDADO'?' selected':''}>ARRENDADO</option>
      </select>
      <label>Fecha fin de actividad*</label>
      <input name="fechaFinActividad" type="date" required value="${datosHoja2.fechaFinActividad||''}" />
      <label>Técnico*</label>
      <input name="tecnico" required value="${datosHoja2.tecnico||''}" />
      <label>¿Implica exclusión?*</label>
      <select name="exclusion" required>
        <option value="">¿Implica exclusión?</option>
        <option${datosHoja2.exclusion==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.exclusion==='NO'?' selected':''}>NO</option>
      </select>
      <label>Tipo de actividad*</label>
      <select name="tipoActividad" required>
        <option value="">Tipo de actividad</option>
        <option${datosHoja2.tipoActividad==='EMERGENCIA'?' selected':''}>EMERGENCIA</option>
        <option${datosHoja2.tipoActividad==='CORRECTIVO'?' selected':''}>CORRECTIVO</option>
      </select>
      <label>Tipo de equipo en falla*</label>
      <select name="tipoEquipoFalla" required>
        <option value="">Tipo de equipo en falla</option>
        <option${datosHoja2.tipoEquipoFalla==='TX'?' selected':''}>TX</option>
        <option${datosHoja2.tipoEquipoFalla==='ENERGÍA'?' selected':''}>ENERGÍA</option>
        <option${datosHoja2.tipoEquipoFalla==='HARDWARE'?' selected':''}>HARDWARE</option>
        <option${datosHoja2.tipoEquipoFalla==='SOFTWARE'?' selected':''}>SOFTWARE</option>
        <option${datosHoja2.tipoEquipoFalla==='HURTO'?' selected':''}>HURTO</option>
        <option${datosHoja2.tipoEquipoFalla==='CLIMATICOS'?' selected':''}>CLIMATICOS</option>
      </select>
      <label>Marca</label>
      <input name="marca" value="${datosHoja2.marca||''}" />
      <label>Modelo</label>
      <input name="modelo" value="${datosHoja2.modelo||''}" />
      <label>¿Presenta afectación de servicios?*</label>
      <select name="afectacionServicios" required>
        <option value="">¿Presenta afectación de servicios?</option>
        <option${datosHoja2.afectacionServicios==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.afectacionServicios==='NO'?' selected':''}>NO</option>
      </select>
      <label>¿Cambio?*</label>
      <select name="cambio" required>
        <option value="">¿Cambio?</option>
        <option${datosHoja2.cambio==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.cambio==='NO'?' selected':''}>NO</option>
      </select>
      <label>¿Instalación?*</label>
      <select name="instalacion" required>
        <option value="">¿Instalación?</option>
        <option${datosHoja2.instalacion==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.instalacion==='NO'?' selected':''}>NO</option>
      </select>
      <label>Descripción de la falla</label>
      <textarea name="descripcionFalla">${datosHoja2.descripcionFalla||''}</textarea>
      <label>Descripción de la solución</label>
      <textarea name="descripcionSolucion">${datosHoja2.descripcionSolucion||''}</textarea>
      <hr>
      <label>Repuestos retirados/instalados</label>
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serial</th>
          </tr>
        </thead>
        <tbody id="tabla-repuestos"></tbody>
      </table>
      <hr>
      <label>Evidencias fotográficas</label>
      <div id="evidencias2"></div>
      <label>¿Falla resuelta?*</label>
      <select name="fallaResuelta" required>
        <option value="">¿Falla resuelta?</option>
        <option${datosHoja2.fallaResuelta==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.fallaResuelta==='NO'?' selected':''}>NO</option>
      </select>
      <label>Observaciones de la actividad</label>
      <textarea name="observacionesActividad">${datosHoja2.observacionesActividad||''}</textarea>
      <button type="submit">Generar PDF</button>
      <button type="button" id="volver1">Volver</button>
    </form>
  `;
  // Repuestos: 4 filas fijas, sin agregar/eliminar
  let repuestos = datosHoja2.repuestos || [];
  while (repuestos.length < 4) repuestos.push({descripcion:'',marca:'',modelo:'',serial:''});
  repuestos = repuestos.slice(0,4);
  datosHoja2.repuestos = repuestos;
  function renderRepuestos() {
    let html = '';
    for (let i = 0; i < 4; i++) {
      html += `<tr>
        <td><input value="${repuestos[i].descripcion||''}" onchange="this.parentNode.parentNode.repuesto.descripcion=this.value" /></td>
        <td><input value="${repuestos[i].marca||''}" onchange="this.parentNode.parentNode.repuesto.marca=this.value" /></td>
        <td><input value="${repuestos[i].modelo||''}" onchange="this.parentNode.parentNode.repuesto.modelo=this.value" /></td>
        <td><input value="${repuestos[i].serial||''}" onchange="this.parentNode.parentNode.repuesto.serial=this.value" /></td>
      </tr>`;
    }
    document.getElementById('tabla-repuestos').innerHTML = html;
    Array.from(document.querySelectorAll('#tabla-repuestos tr')).forEach((tr, i) => tr.repuesto = repuestos[i]);
  }
  renderRepuestos();

  // Evidencias
  let evHtml = '';
  for (let i = 0; i < 6; i++) {
    evHtml += `
      <label>Evidencia ${i+1}</label>
      <div class="evidencia-btns">
        <button type="button" id="tomarfoto2_${i}">Tomar foto</button>
        <input type="file" accept="image/*" capture="environment" id="filecam2_${i}" style="display:none;" />
        <button type="button" id="abrirfotos2_${i}">Abrir fotos</button>
        <input type="file" accept="image/*" id="filegal2_${i}" style="display:none;" />
      </div>
      <img id="prev2_${i}" class="preview" style="display:${evidencias2[i]?'block':'none'}" src="${evidencias2[i]||''}"/>
      <input id="desc2_${i}" placeholder="Descripción evidencia ${i+1}" value="${datosHoja2.evidencias?.[i]?.desc||''}" />
    `;
  }
  document.getElementById('evidencias2').innerHTML = evHtml;
  for (let i = 0; i < 6; i++) {
    document.getElementById(`tomarfoto2_${i}`).onclick = () => {
      document.getElementById(`filecam2_${i}`).click();
    };
    document.getElementById(`filecam2_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias2[i] = b64;
          document.getElementById(`prev2_${i}`).src = b64;
          document.getElementById(`prev2_${i}`).style.display = 'block';
        });
      }
    };
    document.getElementById(`abrirfotos2_${i}`).onclick = () => {
      document.getElementById(`filegal2_${i}`).click();
    };
    document.getElementById(`filegal2_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
        evidencias2[i] = b64;
        document.getElementById(`prev2_${i}`).src = b64;
        document.getElementById(`prev2_${i}`).style.display = 'block';
      });
      }
    };
    document.getElementById(`desc2_${i}`).oninput = guardarLocal;
  }

  // Guardado en cada cambio
  Array.from(document.querySelectorAll('#form2 input, #form2 textarea, #form2 select')).forEach(el => {
    el.oninput = () => {
      const fd = new FormData(document.getElementById('form2'));
      datosHoja2 = Object.fromEntries(fd.entries());
      datosHoja2.repuestos = repuestos;
      guardarLocal();
    };
  });

  // Submit
  document.getElementById('form2').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    datosHoja2 = Object.fromEntries(fd.entries());
    datosHoja2.repuestos = repuestos;
    // Guardar evidencias y descripciones en datosHoja2
    datosHoja2.evidencias = [];
    for (let i = 0; i < 6; i++) {
      datosHoja2.evidencias.push({
        img: evidencias2[i],
        desc: document.getElementById(`desc2_${i}`).value
      });
    }
    guardarLocal();
    if (validarHoja2(datosHoja2)) {
      renderPrevisualizacion();
    } else {
      alert('Por favor, completa todos los campos requeridos.');
    }
  };
  document.getElementById('volver1').onclick = renderHoja1;
}

function renderPrevisualizacion() {
  document.getElementById('app').innerHTML = `
    <h2>Previsualización del informe</h2>
    <div class="paginador">
      <button id="btnPag1" class="active">Página 1</button>
      <button id="btnPag2">Página 2</button>
    </div>
    <div class="previsualizacion-pdf" id="previsualizacion-pdf">
      <div id="canvas-container1" style="display:block;text-align:center;visibility:hidden;"></div>
      <div id="canvas-container2" style="display:none;text-align:center;visibility:hidden;"></div>
    </div>
    <div style="display:flex;justify-content:center;gap:16px;margin-top:16px;">
    <button id="descargar">Descargar PDF</button>
    <button id="editar">Editar datos</button>
    </div>
  `;

  // Loader/progress bar overlay en toda la ventana
  let loaderOverlay = document.createElement('div');
  loaderOverlay.id = 'loader-overlay-pdf';
  loaderOverlay.style.position = 'fixed';
  loaderOverlay.style.top = '0';
  loaderOverlay.style.left = '0';
  loaderOverlay.style.width = '100vw';
  loaderOverlay.style.height = '100vh';
  loaderOverlay.style.display = 'flex';
  loaderOverlay.style.alignItems = 'center';
  loaderOverlay.style.justifyContent = 'center';
  loaderOverlay.style.zIndex = '9999';
  loaderOverlay.style.background = 'rgba(255,255,255,0.85)';
  loaderOverlay.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">Generando previsualización...</div>
      <div style="width:220px;height:16px;background:#eee;border-radius:8px;overflow:hidden;display:inline-block;">
        <div id="loader-bar" style="height:100%;width:0%;background:#e30613;transition:width 0.3s;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(loaderOverlay);

  // Loader/progress bar logic
  let loaderBar = document.getElementById('loader-bar');
  let loaderInterval = null;
  let progress = 0;
  loaderBar.style.width = '0%';
  loaderInterval = setInterval(() => {
    progress += Math.random() * 10 + 5;
    if (progress > 90) progress = 90;
    loaderBar.style.width = progress + '%';
  }, 200);
  function finishLoader() {
    if (loaderInterval) clearInterval(loaderInterval);
    if (loaderBar) loaderBar.style.width = '100%';
    setTimeout(() => {
      if (loaderOverlay && loaderOverlay.parentNode) loaderOverlay.parentNode.removeChild(loaderOverlay);
      document.getElementById('canvas-container1').style.visibility = 'visible';
      document.getElementById('canvas-container2').style.visibility = 'visible';
    }, 350);
  }

  renderHtmlInstitucional(document.getElementById('canvas-container1'), datosHoja1, datosHoja2, 1);
  renderHtmlInstitucional(document.getElementById('canvas-container2'), datosHoja1, datosHoja2, 2);

  // Renderizar canvas para ambas páginas
  setTimeout(() => {
    // Página 1
    let tempDiv1 = document.createElement('div');
    tempDiv1.style.position = 'absolute';
    tempDiv1.style.left = '-9999px';
    tempDiv1.id = 'html-pagina1';
    document.body.appendChild(tempDiv1);
    renderHtmlInstitucional(tempDiv1, datosHoja1, datosHoja2, 1);

    html2canvas(tempDiv1, {backgroundColor: "#fff", useCORS: true}).then(c1 => {
      let cont1 = document.getElementById('canvas-container1');
      while (cont1.firstChild) cont1.removeChild(cont1.firstChild);
      c1.style.width = '100%';
      c1.style.height = 'auto';
      cont1.appendChild(c1);
      document.body.removeChild(tempDiv1);
      // Página 2
      let tempDiv2 = document.createElement('div');
      tempDiv2.style.position = 'absolute';
      tempDiv2.style.left = '-9999px';
      tempDiv2.id = 'html-pagina2';
      document.body.appendChild(tempDiv2);
      renderHtmlInstitucional(tempDiv2, datosHoja1, datosHoja2, 2);
      html2canvas(tempDiv2, {backgroundColor: "#fff", useCORS: true}).then(c2 => {
        let cont2 = document.getElementById('canvas-container2');
        while (cont2.firstChild) cont2.removeChild(cont2.firstChild);
        c2.style.width = '100%';
        c2.style.height = 'auto';
        cont2.appendChild(c2);
        document.body.removeChild(tempDiv2);
        finishLoader();
      });
    });
  }, 100);

  // Botones de paginación
  document.getElementById('btnPag1').onclick = () => {
    document.getElementById('canvas-container1').style.display = 'block';
    document.getElementById('canvas-container2').style.display = 'none';
    document.getElementById('btnPag1').classList.add('active');
    document.getElementById('btnPag2').classList.remove('active');
  };
  document.getElementById('btnPag2').onclick = () => {
    document.getElementById('canvas-container1').style.display = 'none';
    document.getElementById('canvas-container2').style.display = 'block';
    document.getElementById('btnPag2').classList.add('active');
    document.getElementById('btnPag1').classList.remove('active');
  };

  document.getElementById('descargar').onclick = () => {
    generarPDF(datosHoja1, datosHoja2, () => {
      localStorage.removeItem('datosHoja1');
      localStorage.removeItem('datosHoja2');
      setTimeout(() => {
        datosHoja1 = {};
        datosHoja2 = {};
        evidencias1 = [null, null, null, null];
        evidencias2 = [null, null, null, null, null, null];
        firmas = [null];
        renderHoja1();
      }, 1000);
    });
  };
  document.getElementById('editar').onclick = renderHoja1;
}

// --- Renderiza el HTML institucional con los datos ---
function renderHtmlInstitucional(divElem, hoja1, hoja2, pagina) {
  let html = '';
  if (pagina === 1) {
    // --- FORMATO INSTITUCIONAL PAGINA 1 ---
    html = `
      <div style="width:900px;min-height:990px;border:3px solid #000;background:#fff;font-family:Arial,sans-serif;color:#000;box-sizing:border-box;position:relative;">
        <div style="display:flex;align-items:center;padding:8px 16px 0 16px;">
          <img src="logo-claro.png" style="width:70px;height:70px;">
          <div style="flex:1;text-align:center;">
            <div style="font-weight:bold;color:#000;font-size:18px;line-height:1.2;">
              CLARO OPERACION Y MANTENIMIENTO<br>
              PERSONAL PROPIO - PROVEEDORES<br>
              ESTADO GENERAL DE SITIO
            </div>
          </div>
        </div>
        <div style="margin:8px 0 0 0;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">INFORMACION GENERAL</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">NOMBRE DE ESTACIÓN:</td>
              <td style="border:1px solid #000;width:30%;">${hoja1.nombreEstacion||''}</td>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">CATEGORIA:</td>
              <td style="border:1px solid #000;width:30%;">${hoja1.categoria||''}</td>
          </tr>
          <tr>
              <td style="border:1px solid #000;font-weight:bold;">ZONA:</td>
              <td style="border:1px solid #000;">${hoja1.zona||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">RESPONSABLE:</td>
              <td style="border:1px solid #000;">${hoja1.responsable||''}</td>
          </tr>
          <tr>
              <td style="border:1px solid #000;font-weight:bold;">DEPARTAMENTO:</td>
              <td style="border:1px solid #000;">${hoja1.departamento||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">FECHA EJECUCIÓN:</td>
              <td style="border:1px solid #000;">${hoja1.fechaEjecucion||''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">DIRECCIÓN:</td>
              <td style="border:1px solid #000;" colspan="3">${hoja1.direccion||''}</td>
          </tr>
        </table>
        </div>
        <div style="margin-top:8px;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">AREAS COMUNES Y LOCATIVOS</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <tr>
              <th style="border:1px solid #000;background:#e30613;color:#fff;">ITEM</th>
              <th style="border:1px solid #000;background:#e30613;color:#fff;">¿SI/NO?</th>
              <th style="border:1px solid #000;background:#e30613;color:#fff;">DESCRIPCION/COMENTARIOS</th>
          </tr>
            ${(() => {
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
              return items.map((item, i) => `
            <tr>
                  <td style='border:1px solid #000;'>${item}</td>
                  <td style='border:1px solid #000;text-align:center;'>${hoja1.items?.[i]?.respuesta||''}</td>
                  <td style='border:1px solid #000;'>${hoja1.items?.[i]?.descripcion||''}</td>
            </tr>
              `).join('');
            })()}
        </table>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">OBSERVACIONES GENERALES</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:48px;vertical-align:top;">${hoja1.observaciones||''}</td>
            </tr>
          </table>
        </div>
        <div style="margin-top:8px;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">EVIDENCIA FOTOGRAFICA</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr>
              <th style="border:1px solid #000;">EVIDENCIA 1 (describir)</th>
              <th style="border:1px solid #000;">EVIDENCIA 2 (describir)</th>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja1.evidencias?.[0]?.img ? `<img src="${hoja1.evidencias[0].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja1.evidencias?.[1]?.img ? `<img src="${hoja1.evidencias[1].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja1.evidencias?.[0]?.desc||''}</td>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja1.evidencias?.[1]?.desc||''}</td>
            </tr>
            <tr>
              <th style="border:1px solid #000;">EVIDENCIA 3 (describir)</th>
              <th style="border:1px solid #000;">EVIDENCIA 4 (describir)</th>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja1.evidencias?.[2]?.img ? `<img src="${hoja1.evidencias[2].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja1.evidencias?.[3]?.img ? `<img src="${hoja1.evidencias[3].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja1.evidencias?.[2]?.desc||''}</td>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja1.evidencias?.[3]?.desc||''}</td>
            </tr>
          </table>
        </div>
        <div style="display:flex;align-items:flex-start;margin-top:8px;">
          <div style="width:50%;">
            <div style="font-weight:bold;font-size:12px;">FIRMA FUNCIONARIO</div>
            <div style="height:40px;margin-bottom:4px;text-align:center;">
              ${hoja1.firma ? `<img src="${hoja1.firma}" style="max-height:38px;max-width:100%;border:1px solid #000;">` : ''}
      </div>
          </div>
          <div style="width:50%;padding-left:24px;">
            <div style="font-weight:bold;font-size:12px;">NOMBRE</div>
            <div style="height:24px;">${hoja1.nombreFuncionario||''}</div>
            <div style="font-weight:bold;font-size:12px;">FECHA ELABORACION INFORME</div>
            <div style="height:24px;">${hoja1.fechaElaboracion||''}</div>
          </div>
        </div>
      </div>
      <div style="width:900px;text-align:center;margin:0 auto;font-size:11px;color:#000;">Clasificación: Uso Interno. Documento Claro Colombia</div>
    `;
  } else {
    // --- FORMATO INSTITUCIONAL PAGINA 2 ---
    html = `
      <div style="width:900px;min-height:1200px;border:3px solid #000;background:#fff;font-family:Arial,sans-serif;color:#000;box-sizing:border-box;position:relative;">
        <div style="display:flex;align-items:center;padding:8px 16px 0 16px;">
          <img src="logo-claro.png" style="width:70px;height:70px;">
          <div style="flex:1;text-align:center;">
            <div style="font-weight:bold;color:#000;font-size:18px;line-height:1.2;">
              OPERACION Y MANTENIMIENTO<br>
              SITE OWNER CLARO<br>
              MANTENIMIENTO CORRECTIVO Y EMERGENCIAS
            </div>
          </div>
        </div>
        <div style="margin:8px 0 0 0;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">INFORMACION GENERAL</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">NOMBRE DE ESTACIÓN:</td>
              <td style="border:1px solid #000;width:30%;">${hoja1.nombreEstacion||''}</td>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">REGIONAL:</td>
              <td style="border:1px solid #000;width:30%;">${hoja2.regional||''}</td>
          </tr>
          <tr>
              <td style="border:1px solid #000;font-weight:bold;">TIPO DE ESTACION:</td>
              <td style="border:1px solid #000;">${hoja2.tipoEstacion||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">FECHA EJECUCIÓN:</td>
              <td style="border:1px solid #000;">${hoja2.fechaEjecucion||''}</td>
          </tr>
          <tr>
              <td style="border:1px solid #000;font-weight:bold;">TIPO DE SITIO (Propio, Arrendado):</td>
              <td style="border:1px solid #000;">${hoja2.tipoSitio||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">FECHA FIN ACTIVIDAD:</td>
              <td style="border:1px solid #000;">${hoja2.fechaFinActividad||''}</td>
          </tr>
          <tr>
              <td style="border:1px solid #000;font-weight:bold;">TECNICO:</td>
              <td style="border:1px solid #000;">${hoja2.tecnico||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">IMPLICA EXCLUSION?</td>
              <td style="border:1px solid #000;">${hoja2.exclusion||''}</td>
          </tr>
          </table>
        </div>
        <div style="margin-top:8px;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">INFORMACION DE LA ACTIVIDAD</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tr>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">TIPO DE ACTIVIDAD:</td>
              <td style="border:1px solid #000;width:30%;">${hoja2.tipoActividad||''}</td>
              <td style="border:1px solid #000;font-weight:bold;width:20%;">TIPO DE EQUIPO EN FALLA:</td>
              <td style="border:1px solid #000;width:30%;">${hoja2.tipoEquipoFalla||''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">MARCA:</td>
              <td style="border:1px solid #000;">${hoja2.marca||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">MODELO:</td>
              <td style="border:1px solid #000;">${hoja2.modelo||''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">PRESENTA AFECTACION DE SERVICIOS:</td>
              <td style="border:1px solid #000;">${hoja2.afectacionServicios||''}</td>
              <td style="border:1px solid #000;font-weight:bold;">CAMBIO:</td>
              <td style="border:1px solid #000;">${hoja2.cambio||''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">INSTALACION:</td>
              <td style="border:1px solid #000;">${hoja2.instalacion||''}</td>
              <td style="border:1px solid #000;" colspan="2"></td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">DESCRIPCION DE LA FALLA</td>
              <td style="border:1px solid #000;" colspan="3">${hoja2.descripcionFalla||''}</td>
            </tr>
            <tr>
              <td style="border:1px solid #000;font-weight:bold;">DESCRIPCION DE LA SOLUCION</td>
              <td style="border:1px solid #000;" colspan="3">${hoja2.descripcionSolucion||''}</td>
          </tr>
        </table>
        </div>
        <div style="margin-top:8px;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">CAMBIO DE REPUESTOS Y/O PARTES (Para los casos que aplique)</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <tr>
              <th style="border:1px solid #000;">Descripción</th>
              <th style="border:1px solid #000;">Marca</th>
              <th style="border:1px solid #000;">Modelo</th>
              <th style="border:1px solid #000;">Serial</th>
          </tr>
            ${(() => {
              const reps = (hoja2.repuestos||[]).filter(r=>r.descripcion||r.marca||r.modelo||r.serial);
              if (reps.length > 0) {
                return reps.map(rep=>`
            <tr>
                    <td style="border:1px solid #000;height:32px;">${rep.descripcion||''}</td>
                    <td style="border:1px solid #000;height:32px;">${rep.marca||''}</td>
                    <td style="border:1px solid #000;height:32px;">${rep.modelo||''}</td>
                    <td style="border:1px solid #000;height:32px;">${rep.serial||''}</td>
            </tr>
                `).join('');
              } else {
                return `<tr><td style='border:1px solid #000;height:32px;'>&nbsp;</td><td style='border:1px solid #000;height:32px;'>&nbsp;</td><td style='border:1px solid #000;height:32px;'>&nbsp;</td><td style='border:1px solid #000;height:32px;'>&nbsp;</td></tr>`;
              }
            })()}
        </table>
        </div>
        <div style="margin-top:8px;">
          <div style="background:#e30613;color:#fff;font-weight:bold;text-align:center;padding:2px 0;font-size:14px;border:1px solid #000;border-bottom:none;">EVIDENCIA FOTOGRÁFICA DE LA ACTIVIDAD</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr>
              <th style="border:1px solid #000;">EVIDENCIA DE LA FALLA (CMTS EN CORTO)</th>
              <th style="border:1px solid #000;">EVIDENCIA (RETIRO DEL CMTS ENCORTO)</th>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[0]?.img ? `<img src="${hoja2.evidencias[0].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[1]?.img ? `<img src="${hoja2.evidencias[1].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[0]?.desc||''}</td>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[1]?.desc||''}</td>
            </tr>
            <tr>
              <th style="border:1px solid #000;">EVIDENCIA (INSTALACION NUEVO CMTS)</th>
              <th style="border:1px solid #000;">EVIDENCIA (CMTS ENPRODUCION)</th>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[2]?.img ? `<img src="${hoja2.evidencias[2].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
              <td style="border:1px solid #000;height:240px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[3]?.img ? `<img src="${hoja2.evidencias[3].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[2]?.desc||''}</td>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[3]?.desc||''}</td>
            </tr>
            <tr>
              <th style="border:1px solid #000;">EVIDENCIA ADICIONAL</th>
              <th style="border:1px solid #000;">EVIDENCIA ADICIONAL</th>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:160px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[4]?.img ? `<img src="${hoja2.evidencias[4].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
              <td style="border:1px solid #000;height:160px;text-align:center;vertical-align:middle;">
                ${hoja2.evidencias?.[5]?.img ? `<img src="${hoja2.evidencias[5].img}" style="max-width:95%;max-height:95%;object-fit:contain;">` : ''}
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[4]?.desc||''}</td>
              <td style="border:1px solid #000;height:24px;"><b>Descripción:</b> ${hoja2.evidencias?.[5]?.desc||''}</td>
            </tr>
          </table>
      </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">
          <tr>
            <td style="border:1px solid #000;font-weight:bold;width:20%;">FALLA RESUELTA:</td>
            <td style="border:1px solid #000;width:30%;">${hoja2.fallaResuelta||''}</td>
          </tr>
          <tr>
            <td colspan="2" style="border:1px solid #000;font-weight:bold;">OBSERVACIONES DE LA ACTIVIDAD</td>
          </tr>
          <tr>
            <td colspan="2" style="border:1px solid #000;height:48px;vertical-align:top;">${hoja2.observacionesActividad||''}</td>
          </tr>
        </table>
      </div>
      <div style="width:900px;text-align:center;margin:0 auto;font-size:11px;color:#000;">Clasificación: Uso Interno. Documento Claro Colombia</div>
    `;
  }
  divElem.innerHTML = html;
}

// --- Genera el PDF con el formato institucional ---
function generarPDF(hoja1, hoja2, cb) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:'pt',format:[700,990]});
  let div1 = document.createElement('div');
  div1.style.position = 'absolute';
  div1.style.left = '-9999px';
  div1.id = 'pdf-html1';
  document.body.appendChild(div1);
  let div2 = document.createElement('div');
  div2.style.position = 'absolute';
  div2.style.left = '-9999px';
  div2.id = 'pdf-html2';
  document.body.appendChild(div2);
  renderHtmlInstitucional(div1, hoja1, hoja2, 1);
  renderHtmlInstitucional(div2, hoja1, hoja2, 2);

  setTimeout(() => {
    html2canvas(div1, {backgroundColor: "#fff", scale:3, useCORS: true}).then(canvas1 => {
      html2canvas(div2, {backgroundColor: "#fff", scale:3, useCORS: true}).then(canvas2 => {
        pdf.addImage(canvas1.toDataURL('image/jpeg',1.0), 'JPEG', 0, 0, 700, 990);
        pdf.addPage([700,990]);
        pdf.addImage(canvas2.toDataURL('image/jpeg',1.0), 'JPEG', 0, 0, 700, 990);
        pdf.save('informe-claro.pdf');
        document.body.removeChild(div1);
        document.body.removeChild(div2);
        if (cb) cb();
      });
    });
  }, 500);
}

// --- Flujo de inicio seguro ---
if (validarHoja1(datosHoja1)) {
  if (validarHoja2(datosHoja2)) {
    renderPrevisualizacion();
  } else {
    renderHoja2();
  }
} else {
  renderHoja1();
}
