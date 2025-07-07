// --- Variables globales ---
let datosHoja1 = JSON.parse(localStorage.getItem('datosHoja1') || '{}');
let datosHoja2 = JSON.parse(localStorage.getItem('datosHoja2') || '{}');
let evidencias1 = [null, null, null, null];
let evidencias2 = [null, null, null, null, null, null];
let firmas = [null];

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
  for (let k of requeridos) if (!datos[k]) return false;
  if (!Array.isArray(datos.items) || datos.items.length !== 13) return false;
  for (let i = 0; i < 13; i++) {
    if (!datos.items[i] || !datos.items[i].respuesta) return false;
  }
  if (!datos.firma) return false;
  return true;
}
function validarHoja2(datos) {
  if (!datos) return false;
  const requeridos = [
    'regional', 'tipoEstacion', 'fechaEjecucion', 'tipoSitio', 'fechaFinActividad',
    'tecnico', 'exclusion', 'tipoActividad', 'tipoEquipoFalla',
    'afectacionServicios', 'cambio', 'instalacion', 'fallaResuelta'
  ];
  for (let k of requeridos) if (!datos[k]) return false;
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
        <button type="button" id="camara1_${i}">Cámara</button>
        <button type="button" id="galeria1_${i}">Galería</button>
        <input type="file" accept="image/*" id="file1_${i}" />
      </div>
      <img id="prev1_${i}" class="preview" style="display:${evidencias1[i]?'block':'none'}" src="${evidencias1[i]||''}"/>
      <input id="desc1_${i}" placeholder="Descripción evidencia ${i+1}" value="${datosHoja1.evidencias?.[i]?.desc||''}" />
    `;
  }
  document.getElementById('evidencias1').innerHTML = evHtml;
  for (let i = 0; i < 4; i++) {
    // Galería
    document.getElementById(`galeria1_${i}`).onclick = () => {
      document.getElementById(`file1_${i}`).click();
    };
    document.getElementById(`file1_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias1[i] = b64;
          document.getElementById(`prev1_${i}`).src = b64;
          document.getElementById(`prev1_${i}`).style.display = 'block';
        });
      }
    };
    // Cámara
    document.getElementById(`camara1_${i}`).onclick = () => {
      abrirCamara((b64) => {
        evidencias1[i] = b64;
        document.getElementById(`prev1_${i}`).src = b64;
        document.getElementById(`prev1_${i}`).style.display = 'block';
      });
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
        <option${datosHoja2.fallaResuelta==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.fallaResuelta==='NO'?' selected':''}>NO</option>
      </select>
      <label>Observaciones de la actividad</label>
      <textarea name="observacionesActividad">${datosHoja2.observacionesActividad||''}</textarea>
      <button type="submit">Generar PDF</button>
      <button type="button" id="volver1">Volver</button>
    </form>
  `;
  // Repuestos
  let repuestos = datosHoja2.repuestos || [];
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
    Array.from(document.querySelectorAll('#tabla-repuestos tr')).forEach((tr, i) => tr.repuesto = repuestos[i]);
  }
  document.getElementById('agregarRepuesto').onclick = () => {
    repuestos.push({descripcion:'',marca:'',modelo:'',serial:''});
    renderRepuestos();
    datosHoja2.repuestos = repuestos;
    guardarLocal();
  };
  renderRepuestos();

  // Evidencias
  let evHtml = '';
  for (let i = 0; i < 6; i++) {
    evHtml += `
      <label>Evidencia ${i+1}</label>
      <div class="evidencia-btns">
        <button type="button" id="camara2_${i}">Cámara</button>
        <button type="button" id="galeria2_${i}">Galería</button>
        <input type="file" accept="image/*" id="file2_${i}" />
      </div>
      <img id="prev2_${i}" class="preview" style="display:${evidencias2[i]?'block':'none'}" src="${evidencias2[i]||''}"/>
      <input id="desc2_${i}" placeholder="Descripción evidencia ${i+1}" value="${datosHoja2.evidencias?.[i]?.desc||''}" />
    `;
  }
  document.getElementById('evidencias2').innerHTML = evHtml;
  for (let i = 0; i < 6; i++) {
    // Galería
    document.getElementById(`galeria2_${i}`).onclick = () => {
      document.getElementById(`file2_${i}`).click();
    };
    document.getElementById(`file2_${i}`).onchange = e => {
      if (e.target.files[0]) {
        toBase64(e.target.files[0], b64 => {
          evidencias2[i] = b64;
          document.getElementById(`prev2_${i}`).src = b64;
          document.getElementById(`prev2_${i}`).style.display = 'block';
        });
      }
    };
    // Cámara
    document.getElementById(`camara2_${i}`).onclick = () => {
      abrirCamara((b64) => {
        evidencias2[i] = b64;
        document.getElementById(`prev2_${i}`).src = b64;
        document.getElementById(`prev2_${i}`).style.display = 'block';
      });
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
    guardarLocal();
    if (validarHoja2(datosHoja2)) {
      renderPrevisualizacion();
    } else {
      alert('Por favor, completa todos los campos requeridos.');
    }
  };
  document.getElementById('volver1').onclick = renderHoja1;
}

// ... El resto del código (previsualización, generación de PDF, etc.) permanece igual ...
// Si necesitas el archivo completo con todas las funciones, avísame y te lo entrego íntegro.

function renderPrevisualizacion() {
  document.getElementById('app').innerHTML = `
    <h2>Previsualización del informe</h2>
    <div class="paginador">
      <button id="btnPag1" class="active">Página 1</button>
      <button id="btnPag2">Página 2</button>
    </div>
    <div class="previsualizacion-pdf" id="previsualizacion-pdf">
      <div id="html-pagina1"></div>
      <div id="html-pagina2" style="display:none"></div>
    </div>
    <button id="descargar">Descargar PDF</button>
    <button id="editar">Editar datos</button>
  `;

  renderHtmlInstitucional('html-pagina1', datosHoja1, datosHoja2, 1);
  renderHtmlInstitucional('html-pagina2', datosHoja1, datosHoja2, 2);

  setTimeout(() => {
    html2canvas(document.getElementById('html-pagina1'), {backgroundColor: "#fff"}).then(canvas1 => {
      document.getElementById('html-pagina1').innerHTML = '';
      canvas1.style.width = '100%';
      canvas1.style.height = 'auto';
      document.getElementById('html-pagina1').appendChild(canvas1);
      html2canvas(document.getElementById('html-pagina2'), {backgroundColor: "#fff"}).then(canvas2 => {
        document.getElementById('html-pagina2').innerHTML = '';
        canvas2.style.width = '100%';
        canvas2.style.height = 'auto';
        document.getElementById('html-pagina2').appendChild(canvas2);
      });
    });
  }, 500);

  document.getElementById('btnPag1').onclick = () => {
    document.getElementById('html-pagina1').style.display = '';
    document.getElementById('html-pagina2').style.display = 'none';
    document.getElementById('btnPag1').classList.add('active');
    document.getElementById('btnPag2').classList.remove('active');
  };
  document.getElementById('btnPag2').onclick = () => {
    document.getElementById('html-pagina1').style.display = 'none';
    document.getElementById('html-pagina2').style.display = '';
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
function renderHtmlInstitucional(divId, hoja1, hoja2, pagina) {
  let html = '';
  if (pagina === 1) {
    html = `
      <div style="width:700px;min-height:990px;border:1px solid #e30613;padding:32px 32px 60px 32px;box-sizing:border-box;position:relative;background:#fff;">
        <img src="logo-claro.png" style="width:70px;position:absolute;top:32px;left:32px;">
        <div style="text-align:center;font-weight:bold;font-size:18px;color:#e30613;">CLARO OPERACIÓN Y MANTENIMIENTO<br>ESTADO GENERAL DE SITIO</div>
        <table style="width:100%;margin-top:32px;">
          <tr>
            <td><b>Nombre de estación:</b> ${hoja1.nombreEstacion||''}</td>
            <td><b>Categoría:</b> ${hoja1.categoria||''}</td>
            <td><b>Zona:</b> ${hoja1.zona||''}</td>
          </tr>
          <tr>
            <td><b>Responsable:</b> ${hoja1.responsable||''}</td>
            <td><b>Departamento:</b> ${hoja1.departamento||''}</td>
            <td><b>Fecha de ejecución:</b> ${hoja1.fechaEjecucion||''}</td>
          </tr>
          <tr>
            <td colspan="3"><b>Dirección:</b> ${hoja1.direccion||''}</td>
          </tr>
        </table>
        <div style="margin-top:16px;font-weight:bold;color:#e30613;">ÁREAS COMUNES Y LOCATIVOS</div>
        <table style="width:100%;font-size:11px;">
          <tr>
            <th>Ítem</th>
            <th>¿Sí/No?</th>
            <th>Descripción</th>
          </tr>
          ${hoja1.items?.map((item,i)=>`
            <tr>
              <td>${i+1}</td>
              <td>${item.respuesta||''}</td>
              <td>${item.descripcion||''}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top:8px;"><b>Observaciones generales:</b> ${hoja1.observaciones||''}</div>
        <div style="margin-top:16px;font-weight:bold;color:#e30613;">EVIDENCIA FOTOGRÁFICA</div>
        <div style="display:flex;gap:8px;">
          ${hoja1.evidencias?.map(ev=>ev.img?`<div><img src="${ev.img}" style="width:120px;height:80px;object-fit:cover;"><div style="font-size:10px;">${ev.desc||''}</div></div>`:'').join('')}
        </div>
        <div style="margin-top:16px;">
          <b>Firma funcionario:</b><br>
          ${hoja1.firma?`<img src="${hoja1.firma}" style="width:120px;height:40px;">`:''}
        </div>
        <div><b>Nombre:</b> ${hoja1.nombreFuncionario||''}</div>
        <div><b>Fecha elaboración informe:</b> ${hoja1.fechaElaboracion||''}</div>
        <div style="position:absolute;bottom:16px;left:32px;color:#e30613;font-size:11px;">Clasificación: Uso Interno. Documento Claro Colombia</div>
      </div>
    `;
  } else {
    html = `
      <div style="width:700px;min-height:990px;border:1px solid #e30613;padding:32px 32px 60px 32px;box-sizing:border-box;position:relative;background:#fff;">
        <img src="logo-claro.png" style="width:70px;position:absolute;top:32px;left:32px;">
        <div style="text-align:center;font-weight:bold;font-size:18px;color:#e30613;">ACTIVIDAD TÉCNICA EN ESTACIÓN</div>
        <table style="width:100%;margin-top:32px;">
          <tr>
            <td><b>Regional:</b> ${hoja2.regional||''}</td>
            <td><b>Tipo de estación:</b> ${hoja2.tipoEstacion||''}</td>
            <td><b>Fecha ejecución:</b> ${hoja2.fechaEjecucion||''}</td>
          </tr>
          <tr>
            <td><b>Tipo de sitio:</b> ${hoja2.tipoSitio||''}</td>
            <td><b>Fecha fin actividad:</b> ${hoja2.fechaFinActividad||''}</td>
            <td><b>Técnico:</b> ${hoja2.tecnico||''}</td>
          </tr>
          <tr>
            <td><b>¿Implica exclusión?:</b> ${hoja2.exclusion||''}</td>
            <td><b>Tipo de actividad:</b> ${hoja2.tipoActividad||''}</td>
            <td><b>Tipo de equipo en falla:</b> ${hoja2.tipoEquipoFalla||''}</td>
          </tr>
          <tr>
            <td><b>Marca:</b> ${hoja2.marca||''}</td>
            <td><b>Modelo:</b> ${hoja2.modelo||''}</td>
            <td><b>¿Presenta afectación de servicios?:</b> ${hoja2.afectacionServicios||''}</td>
          </tr>
          <tr>
            <td><b>¿Cambio?:</b> ${hoja2.cambio||''}</td>
            <td><b>¿Instalación?:</b> ${hoja2.instalacion||''}</td>
            <td></td>
          </tr>
        </table>
        <div style="margin-top:8px;"><b>Descripción de la falla:</b> ${hoja2.descripcionFalla||''}</div>
        <div style="margin-top:8px;"><b>Descripción de la solución:</b> ${hoja2.descripcionSolucion||''}</div>
        <div style="margin-top:16px;font-weight:bold;color:#e30613;">CAMBIO DE REPUESTOS Y/O PARTES</div>
        <table style="width:100%;font-size:11px;">
          <tr>
            <th>Descripción</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serial</th>
          </tr>
          ${(hoja2.repuestos||[]).map(rep=>`
            <tr>
              <td>${rep.descripcion||''}</td>
              <td>${rep.marca||''}</td>
              <td>${rep.modelo||''}</td>
              <td>${rep.serial||''}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top:16px;font-weight:bold;color:#e30613;">EVIDENCIA FOTOGRÁFICA DE LA ACTIVIDAD</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${(hoja2.evidencias||[]).map(ev=>ev.img?`<div><img src="${ev.img}" style="width:120px;height:80px;object-fit:cover;"><div style="font-size:10px;">${ev.desc||''}</div></div>`:'').join('')}
        </div>
        <div style="margin-top:8px;"><b>¿Falla resuelta?:</b> ${hoja2.fallaResuelta||''}</div>
        <div><b>Observaciones de la actividad:</b> ${hoja2.observacionesActividad||''}</div>
        <div style="position:absolute;bottom:16px;left:32px;color:#e30613;font-size:11px;">Clasificación: Uso Interno. Documento Claro Colombia</div>
      </div>
    `;
  }
  document.getElementById(divId).innerHTML = html;
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
  renderHtmlInstitucional('pdf-html1', hoja1, hoja2, 1);
  renderHtmlInstitucional('pdf-html2', hoja1, hoja2, 2);

  setTimeout(() => {
    html2canvas(div1, {backgroundColor: "#fff", scale:2}).then(canvas1 => {
      html2canvas(div2, {backgroundColor: "#fff", scale:2}).then(canvas2 => {
        pdf.addImage(canvas1.toDataURL('image/jpeg',0.92), 'JPEG', 0, 0, 700, 990);
        pdf.addPage([700,990]);
        pdf.addImage(canvas2.toDataURL('image/jpeg',0.92), 'JPEG', 0, 0, 700, 990);
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
