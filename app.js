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
function renderHoja1(fromHome) {
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:24px;margin-bottom:8px;">
      <button id="backHome1" style="background:#fff;border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0001;cursor:pointer;margin-left:8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#fff"/>
          <path d="M15.5 19L9.5 12L15.5 5" stroke="#e30613" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <img src="logo-claro.png" alt="Logo Claro" style="width:100px;display:block;margin:0 auto;">
      <div style="width:44px;height:44px;"></div>
    </div>
    <form id="form1" novalidate>
      <h2>Estado General de Estación</h2>
      <label>Nombre de estación*</label>
      <input name="nombreEstacion" required value="${datosHoja1.nombreEstacion||''}" />
      <div class="error-msg" id="err-nombreEstacion"></div>
      <label>Categoría*</label>
      <input name="categoria" required value="${datosHoja1.categoria||''}" />
      <div class="error-msg" id="err-categoria"></div>
      <label>Zona*</label>
      <input name="zona" required value="${datosHoja1.zona||''}" />
      <div class="error-msg" id="err-zona"></div>
      <label>Responsable*</label>
      <input name="responsable" required value="${datosHoja1.responsable||''}" />
      <div class="error-msg" id="err-responsable"></div>
      <label>Departamento*</label>
      <input name="departamento" required value="${datosHoja1.departamento||''}" />
      <div class="error-msg" id="err-departamento"></div>
      <label>Fecha de ejecución*</label>
      <input name="fechaEjecucion" type="date" required value="${datosHoja1.fechaEjecucion||''}" />
      <div class="error-msg" id="err-fechaEjecucion"></div>
      <label>Dirección*</label>
      <input name="direccion" required value="${datosHoja1.direccion||''}" />
      <div class="error-msg" id="err-direccion"></div>
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
      <hr>
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
      <div class="error-msg" id="err-firma"></div>
      <label>Nombre*</label>
      <input name="nombreFuncionario" required value="${datosHoja1.nombreFuncionario||''}" />
      <div class="error-msg" id="err-nombreFuncionario"></div>
      <label>Fecha elaboración informe*</label>
      <input name="fechaElaboracion" type="date" required value="${datosHoja1.fechaElaboracion||''}" />
      <div class="error-msg" id="err-fechaElaboracion"></div>
      <button type="submit" style="background:#e30613;color:#fff;">Generar PDF</button>
      <button type="button" id="volverHome1" style="background:#eee;color:#222;">Volver al inicio</button>
    </form>
  `;
  window.scrollTo({top:0,behavior:'auto'});
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
        <div class="error-msg" id="err-item${i}"></div>
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
    mostrarError('err-firma','Por favor, firma el informe');
  };
  // Mueve el error justo debajo del canvas (antes del botón)
  let firmaDiv = canvas.parentNode;
  let errFirma = document.getElementById('err-firma');
  let btnLimpiar = document.getElementById('limpiarFirma1');
  if (firmaDiv && errFirma && btnLimpiar) {
    firmaDiv.insertBefore(errFirma, btnLimpiar);
  }

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

  // Validación personalizada
  function mostrarError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.color = '#e30613'; el.style.fontSize = '0.95em'; }
    // resalta el campo
    if (id.startsWith('err-item')) {
      const idx = parseInt(id.replace('err-item',''));
      const sel = document.querySelector(`select[name="item${idx}"]`);
      if (sel) sel.classList.add('input-error');
    } else {
      const map = {
        'err-nombreEstacion': 'input[name="nombreEstacion"]',
        'err-categoria': 'input[name="categoria"]',
        'err-zona': 'input[name="zona"]',
        'err-responsable': 'input[name="responsable"]',
        'err-departamento': 'input[name="departamento"]',
        'err-fechaEjecucion': 'input[name="fechaEjecucion"]',
        'err-direccion': 'input[name="direccion"]',
        'err-nombreFuncionario': 'input[name="nombreFuncionario"]',
        'err-fechaElaboracion': 'input[name="fechaElaboracion"]',
        'err-firma': '#firma1'
      };
      if (map[id]) {
        const inp = document.querySelector(map[id]);
        if (inp) inp.classList.add('input-error');
      }
    }
  }
  function limpiarError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
    // quita el borde rojo
    if (id.startsWith('err-item')) {
      const idx = parseInt(id.replace('err-item',''));
      const sel = document.querySelector(`select[name="item${idx}"]`);
      if (sel) sel.classList.remove('input-error');
    } else {
      const map = {
        'err-nombreEstacion': 'input[name="nombreEstacion"]',
        'err-categoria': 'input[name="categoria"]',
        'err-zona': 'input[name="zona"]',
        'err-responsable': 'input[name="responsable"]',
        'err-departamento': 'input[name="departamento"]',
        'err-fechaEjecucion': 'input[name="fechaEjecucion"]',
        'err-direccion': 'input[name="direccion"]',
        'err-nombreFuncionario': 'input[name="nombreFuncionario"]',
        'err-fechaElaboracion': 'input[name="fechaElaboracion"]',
        'err-firma': '#firma1'
      };
      if (map[id]) {
        const inp = document.querySelector(map[id]);
        if (inp) inp.classList.remove('input-error');
      }
    }
  }
  function validarCamposHoja1() {
    let fd = new FormData(document.getElementById('form1'));
    let errores = [];
    if (!fd.get('nombreEstacion') || fd.get('nombreEstacion').trim() === '') { mostrarError('err-nombreEstacion','Por favor, ingresa el nombre de la estación'); errores.push('nombreEstacion'); } else limpiarError('err-nombreEstacion');
    if (!fd.get('categoria') || fd.get('categoria').trim() === '') { mostrarError('err-categoria','Selecciona la categoría'); errores.push('categoria'); } else limpiarError('err-categoria');
    if (!fd.get('zona') || fd.get('zona').trim() === '') { mostrarError('err-zona','Ingresa la zona'); errores.push('zona'); } else limpiarError('err-zona');
    if (!fd.get('responsable') || fd.get('responsable').trim() === '') { mostrarError('err-responsable','Ingresa el responsable'); errores.push('responsable'); } else limpiarError('err-responsable');
    if (!fd.get('departamento') || fd.get('departamento').trim() === '') { mostrarError('err-departamento','Ingresa el departamento'); errores.push('departamento'); } else limpiarError('err-departamento');
    if (!fd.get('fechaEjecucion') || fd.get('fechaEjecucion').trim() === '') { mostrarError('err-fechaEjecucion','Ingresa la fecha de ejecución'); errores.push('fechaEjecucion'); } else limpiarError('err-fechaEjecucion');
    if (!fd.get('direccion') || fd.get('direccion').trim() === '') { mostrarError('err-direccion','Ingresa la dirección'); errores.push('direccion'); } else limpiarError('err-direccion');
    // Validar items uno a uno
    for (let i = 0; i < 13; i++) {
      if (!fd.get(`item${i}`) || fd.get(`item${i}`).trim() === '') {
        mostrarError(`err-item${i}`,`Selecciona una opción para el ítem ${i+1}`);
        errores.push(`item${i}`);
      } else {
        limpiarError(`err-item${i}`);
      }
    }
    // Validar firma
    if (!firmas[0]) { mostrarError('err-firma','Por favor, firma el informe'); errores.push('firma'); } else limpiarError('err-firma');
    if (!fd.get('nombreFuncionario') || fd.get('nombreFuncionario').trim() === '') { mostrarError('err-nombreFuncionario','Ingresa el nombre del funcionario'); errores.push('nombreFuncionario'); } else limpiarError('err-nombreFuncionario');
    if (!fd.get('fechaElaboracion') || fd.get('fechaElaboracion').trim() === '') { mostrarError('err-fechaElaboracion','Ingresa la fecha de elaboración'); errores.push('fechaElaboracion'); } else limpiarError('err-fechaElaboracion');
    return errores;
  }
  // Limpiar errores al escribir
  Array.from(document.querySelectorAll('#form1 input, #form1 textarea, #form1 select')).forEach(el => {
    el.oninput = () => {
      switch (el.name) {
        case 'nombreEstacion': limpiarError('err-nombreEstacion'); break;
        case 'categoria': limpiarError('err-categoria'); break;
        case 'zona': limpiarError('err-zona'); break;
        case 'responsable': limpiarError('err-responsable'); break;
        case 'departamento': limpiarError('err-departamento'); break;
        case 'fechaEjecucion': limpiarError('err-fechaEjecucion'); break;
        case 'direccion': limpiarError('err-direccion'); break;
        case 'nombreFuncionario': limpiarError('err-nombreFuncionario'); break;
        case 'fechaElaboracion': limpiarError('err-fechaElaboracion'); break;
        default: break;
      }
      if (el.name && el.name.startsWith('item')) limpiarError(`err-${el.name}`);
    };
  });
  // Submit
  document.getElementById('form1').onsubmit = e => {
    e.preventDefault();
    const errores = validarCamposHoja1();
    if (errores.length > 0) {
      const primer = errores[0];
      let focusEl = null;
      if (primer.startsWith('item')) {
        const idx = parseInt(primer.replace('item',''));
        focusEl = document.querySelector(`select[name="item${idx}"]`);
        if (focusEl) {
          focusEl.focus();
          focusEl.scrollIntoView({behavior:'smooth',block:'center'});
        }
      } else {
        switch (primer) {
          case 'nombreEstacion': focusEl = document.querySelector('input[name="nombreEstacion"]'); break;
          case 'categoria': focusEl = document.querySelector('input[name="categoria"]'); break;
          case 'zona': focusEl = document.querySelector('input[name="zona"]'); break;
          case 'responsable': focusEl = document.querySelector('input[name="responsable"]'); break;
          case 'departamento': focusEl = document.querySelector('input[name="departamento"]'); break;
          case 'fechaEjecucion': focusEl = document.querySelector('input[name="fechaEjecucion"]'); break;
          case 'direccion': focusEl = document.querySelector('input[name="direccion"]'); break;
          case 'firma': focusEl = document.getElementById('firma1'); break;
          case 'nombreFuncionario': focusEl = document.querySelector('input[name="nombreFuncionario"]'); break;
          case 'fechaElaboracion': focusEl = document.querySelector('input[name="fechaElaboracion"]'); break;
          default: break;
        }
        if (focusEl) {
          focusEl.focus();
          focusEl.scrollIntoView({behavior:'smooth',block:'center'});
        }
      }
      return;
    }
    const fd = new FormData(e.target);
    datosHoja1 = Object.fromEntries(fd.entries());
    datosHoja1.items = [];
    for (let i = 0; i < 13; i++) {
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
    guardarLocal();
      renderPrevisualizacion1();
  };
  document.getElementById('volverHome1').onclick = renderHome;
  document.getElementById('backHome1').onclick = renderHome;
}

function renderHoja2(fromHome) {
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:24px;margin-bottom:8px;">
      <button id="backHome2" style="background:#fff;border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0001;cursor:pointer;margin-left:8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#fff"/>
          <path d="M15.5 19L9.5 12L15.5 5" stroke="#e30613" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <img src="logo-claro.png" alt="Logo Claro" style="width:100px;display:block;margin:0 auto;">
      <div style="width:44px;height:44px;"></div>
    </div>
    <form id="form2" novalidate>
      <h2>Actividad Técnica en Estación</h2>
      <label>Nombre de estación*</label>
      <input name="nombreEstacion" required value="${datosHoja2.nombreEstacion||''}" />
      <div class="error-msg" id="err2-nombreEstacion"></div>
      <label>Regional*</label>
      <input name="regional" required value="${datosHoja2.regional||''}" />
      <div class="error-msg" id="err2-regional"></div>
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
      <div class="error-msg" id="err2-tipoEstacion"></div>
      <label>Fecha ejecución*</label>
      <input name="fechaEjecucion" type="date" required value="${datosHoja2.fechaEjecucion||''}" />
      <div class="error-msg" id="err2-fechaEjecucion"></div>
      <label>Tipo de sitio*</label>
      <select name="tipoSitio" required>
        <option value="">Tipo de sitio</option>
        <option${datosHoja2.tipoSitio==='PROPIO'?' selected':''}>PROPIO</option>
        <option${datosHoja2.tipoSitio==='ARRENDADO'?' selected':''}>ARRENDADO</option>
      </select>
      <div class="error-msg" id="err2-tipoSitio"></div>
      <label>Fecha fin de actividad*</label>
      <input name="fechaFinActividad" type="date" required value="${datosHoja2.fechaFinActividad||''}" />
      <div class="error-msg" id="err2-fechaFinActividad"></div>
      <label>Técnico*</label>
      <input name="tecnico" required value="${datosHoja2.tecnico||''}" />
      <div class="error-msg" id="err2-tecnico"></div>
      <label>¿Implica exclusión?*</label>
      <select name="exclusion" required>
        <option value="">¿Implica exclusión?</option>
        <option${datosHoja2.exclusion==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.exclusion==='NO'?' selected':''}>NO</option>
      </select>
      <div class="error-msg" id="err2-exclusion"></div>
      <label>Tipo de actividad*</label>
      <select name="tipoActividad" required>
        <option value="">Tipo de actividad</option>
        <option${datosHoja2.tipoActividad==='EMERGENCIA'?' selected':''}>EMERGENCIA</option>
        <option${datosHoja2.tipoActividad==='CORRECTIVO'?' selected':''}>CORRECTIVO</option>
      </select>
      <div class="error-msg" id="err2-tipoActividad"></div>
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
      <div class="error-msg" id="err2-tipoEquipoFalla"></div>
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
      <div class="error-msg" id="err2-afectacionServicios"></div>
      <label>¿Cambio?*</label>
      <select name="cambio" required>
        <option value="">¿Cambio?</option>
        <option${datosHoja2.cambio==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.cambio==='NO'?' selected':''}>NO</option>
      </select>
      <div class="error-msg" id="err2-cambio"></div>
      <label>¿Instalación?*</label>
      <select name="instalacion" required>
        <option value="">¿Instalación?</option>
        <option${datosHoja2.instalacion==='SÍ'?' selected':''}>SÍ</option>
        <option${datosHoja2.instalacion==='NO'?' selected':''}>NO</option>
      </select>
      <div class="error-msg" id="err2-instalacion"></div>
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
      <div class="error-msg" id="err2-fallaResuelta"></div>
      <label>Observaciones de la actividad</label>
      <textarea name="observacionesActividad">${datosHoja2.observacionesActividad||''}</textarea>
      <button type="submit" style="background:#e30613;color:#fff;">Generar PDF</button>
      <button type="button" id="volverHome2" style="background:#eee;color:#222;">Volver al inicio</button>
    </form>
  `;
  window.scrollTo({top:0,behavior:'auto'});
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
  const evidenciasLabels = [
    'EVIDENCIA DE LA FALLA (CMTS EN CORTO)',
    'EVIDENCIA (RETIRO DEL CMTS ENCORTO)',
    'EVIDENCIA (INSTALACION NUEVO CMTS)',
    'EVIDENCIA (CMTS ENPRODUCION)',
    'EVIDENCIA ADICIONAL 1',
    'EVIDENCIA ADICIONAL 2'
  ];
  const evidenciasPlaceholders = [
    'Descripción EVIDENCIA DE LA FALLA (CMTS EN CORTO)',
    'Descripción EVIDENCIA (RETIRO DEL CMTS ENCORTO)',
    'Descripción EVIDENCIA (INSTALACION NUEVO CMTS)',
    'Descripción EVIDENCIA (CMTS ENPRODUCION)',
    'Descripción EVIDENCIA ADICIONAL 1',
    'Descripción EVIDENCIA ADICIONAL 2'
  ];
  for (let i = 0; i < 6; i++) {
    evHtml += `
      <label>${evidenciasLabels[i]}</label>
      <div class="evidencia-btns">
        <button type="button" id="tomarfoto2_${i}">Tomar foto</button>
        <input type="file" accept="image/*" capture="environment" id="filecam2_${i}" style="display:none;" />
        <button type="button" id="abrirfotos2_${i}">Abrir fotos</button>
        <input type="file" accept="image/*" id="filegal2_${i}" style="display:none;" />
      </div>
      <img id="prev2_${i}" class="preview" style="display:${evidencias2[i]?'block':'none'}" src="${evidencias2[i]||''}"/>
      <input id="desc2_${i}" placeholder="${evidenciasPlaceholders[i]}" value="${datosHoja2.evidencias?.[i]?.desc||''}" />
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

  // Validación personalizada
  function mostrarError2(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.color = '#e30613'; el.style.fontSize = '0.95em'; }
    // resalta el campo
    const map = {
      'err2-nombreEstacion': 'input[name="nombreEstacion"]',
      'err2-regional': 'input[name="regional"]',
      'err2-tipoEstacion': 'select[name="tipoEstacion"]',
      'err2-fechaEjecucion': 'input[name="fechaEjecucion"]',
      'err2-tipoSitio': 'select[name="tipoSitio"]',
      'err2-fechaFinActividad': 'input[name="fechaFinActividad"]',
      'err2-tecnico': 'input[name="tecnico"]',
      'err2-exclusion': 'select[name="exclusion"]',
      'err2-tipoActividad': 'select[name="tipoActividad"]',
      'err2-tipoEquipoFalla': 'select[name="tipoEquipoFalla"]',
      'err2-afectacionServicios': 'select[name="afectacionServicios"]',
      'err2-cambio': 'select[name="cambio"]',
      'err2-instalacion': 'select[name="instalacion"]',
      'err2-fallaResuelta': 'select[name="fallaResuelta"]'
    };
    if (map[id]) {
      const inp = document.querySelector(map[id]);
      if (inp) inp.classList.add('input-error');
    }
  }
  function limpiarError2(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
    // quita el borde rojo
    const map = {
      'err2-nombreEstacion': 'input[name="nombreEstacion"]',
      'err2-regional': 'input[name="regional"]',
      'err2-tipoEstacion': 'select[name="tipoEstacion"]',
      'err2-fechaEjecucion': 'input[name="fechaEjecucion"]',
      'err2-tipoSitio': 'select[name="tipoSitio"]',
      'err2-fechaFinActividad': 'input[name="fechaFinActividad"]',
      'err2-tecnico': 'input[name="tecnico"]',
      'err2-exclusion': 'select[name="exclusion"]',
      'err2-tipoActividad': 'select[name="tipoActividad"]',
      'err2-tipoEquipoFalla': 'select[name="tipoEquipoFalla"]',
      'err2-afectacionServicios': 'select[name="afectacionServicios"]',
      'err2-cambio': 'select[name="cambio"]',
      'err2-instalacion': 'select[name="instalacion"]',
      'err2-fallaResuelta': 'select[name="fallaResuelta"]'
    };
    if (map[id]) {
      const inp = document.querySelector(map[id]);
      if (inp) inp.classList.remove('input-error');
    }
  }
  function validarCamposHoja2() {
    let fd = new FormData(document.getElementById('form2'));
    let errores = [];
    if (!fd.get('nombreEstacion') || fd.get('nombreEstacion').trim() === '') { mostrarError2('err2-nombreEstacion','Por favor, ingresa el nombre de la estación'); errores.push('nombreEstacion'); } else limpiarError2('err2-nombreEstacion');
    if (!fd.get('regional') || fd.get('regional').trim() === '') { mostrarError2('err2-regional','Ingresa la regional'); errores.push('regional'); } else limpiarError2('err2-regional');
    if (!fd.get('tipoEstacion') || fd.get('tipoEstacion').trim() === '') { mostrarError2('err2-tipoEstacion','Selecciona el tipo de estación'); errores.push('tipoEstacion'); } else limpiarError2('err2-tipoEstacion');
    if (!fd.get('fechaEjecucion') || fd.get('fechaEjecucion').trim() === '') { mostrarError2('err2-fechaEjecucion','Ingresa la fecha de ejecución'); errores.push('fechaEjecucion'); } else limpiarError2('err2-fechaEjecucion');
    if (!fd.get('tipoSitio') || fd.get('tipoSitio').trim() === '') { mostrarError2('err2-tipoSitio','Selecciona el tipo de sitio'); errores.push('tipoSitio'); } else limpiarError2('err2-tipoSitio');
    if (!fd.get('fechaFinActividad') || fd.get('fechaFinActividad').trim() === '') { mostrarError2('err2-fechaFinActividad','Ingresa la fecha fin de actividad'); errores.push('fechaFinActividad'); } else limpiarError2('err2-fechaFinActividad');
    if (!fd.get('tecnico') || fd.get('tecnico').trim() === '') { mostrarError2('err2-tecnico','Ingresa el nombre del técnico'); errores.push('tecnico'); } else limpiarError2('err2-tecnico');
    if (!fd.get('exclusion') || fd.get('exclusion').trim() === '') { mostrarError2('err2-exclusion','Selecciona si implica exclusión'); errores.push('exclusion'); } else limpiarError2('err2-exclusion');
    if (!fd.get('tipoActividad') || fd.get('tipoActividad').trim() === '') { mostrarError2('err2-tipoActividad','Selecciona el tipo de actividad'); errores.push('tipoActividad'); } else limpiarError2('err2-tipoActividad');
    if (!fd.get('tipoEquipoFalla') || fd.get('tipoEquipoFalla').trim() === '') { mostrarError2('err2-tipoEquipoFalla','Selecciona el tipo de equipo en falla'); errores.push('tipoEquipoFalla'); } else limpiarError2('err2-tipoEquipoFalla');
    if (!fd.get('afectacionServicios') || fd.get('afectacionServicios').trim() === '') { mostrarError2('err2-afectacionServicios','Selecciona si presenta afectación de servicios'); errores.push('afectacionServicios'); } else limpiarError2('err2-afectacionServicios');
    if (!fd.get('cambio') || fd.get('cambio').trim() === '') { mostrarError2('err2-cambio','Selecciona si hubo cambio'); errores.push('cambio'); } else limpiarError2('err2-cambio');
    if (!fd.get('instalacion') || fd.get('instalacion').trim() === '') { mostrarError2('err2-instalacion','Selecciona si hubo instalación'); errores.push('instalacion'); } else limpiarError2('err2-instalacion');
    if (!fd.get('fallaResuelta') || fd.get('fallaResuelta').trim() === '') { mostrarError2('err2-fallaResuelta','Selecciona si la falla fue resuelta'); errores.push('fallaResuelta'); } else limpiarError2('err2-fallaResuelta');
    return errores;
  }
  Array.from(document.querySelectorAll('#form2 input, #form2 textarea, #form2 select')).forEach(el => {
    el.oninput = () => {
      switch (el.name) {
        case 'nombreEstacion': limpiarError2('err2-nombreEstacion'); break;
        case 'regional': limpiarError2('err2-regional'); break;
        case 'tipoEstacion': limpiarError2('err2-tipoEstacion'); break;
        case 'fechaEjecucion': limpiarError2('err2-fechaEjecucion'); break;
        case 'tipoSitio': limpiarError2('err2-tipoSitio'); break;
        case 'fechaFinActividad': limpiarError2('err2-fechaFinActividad'); break;
        case 'tecnico': limpiarError2('err2-tecnico'); break;
        case 'exclusion': limpiarError2('err2-exclusion'); break;
        case 'tipoActividad': limpiarError2('err2-tipoActividad'); break;
        case 'tipoEquipoFalla': limpiarError2('err2-tipoEquipoFalla'); break;
        case 'afectacionServicios': limpiarError2('err2-afectacionServicios'); break;
        case 'cambio': limpiarError2('err2-cambio'); break;
        case 'instalacion': limpiarError2('err2-instalacion'); break;
        case 'fallaResuelta': limpiarError2('err2-fallaResuelta'); break;
        default: break;
      }
    };
  });
  document.getElementById('form2').onsubmit = e => {
    e.preventDefault();
    const errores = validarCamposHoja2();
    if (errores.length > 0) {
      const primer = errores[0];
      let focusEl = null;
      switch (primer) {
        case 'nombreEstacion': focusEl = document.querySelector('input[name="nombreEstacion"]'); break;
        case 'regional': focusEl = document.querySelector('input[name="regional"]'); break;
        case 'tipoEstacion': focusEl = document.querySelector('select[name="tipoEstacion"]'); break;
        case 'fechaEjecucion': focusEl = document.querySelector('input[name="fechaEjecucion"]'); break;
        case 'tipoSitio': focusEl = document.querySelector('select[name="tipoSitio"]'); break;
        case 'fechaFinActividad': focusEl = document.querySelector('input[name="fechaFinActividad"]'); break;
        case 'tecnico': focusEl = document.querySelector('input[name="tecnico"]'); break;
        case 'exclusion': focusEl = document.querySelector('select[name="exclusion"]'); break;
        case 'tipoActividad': focusEl = document.querySelector('select[name="tipoActividad"]'); break;
        case 'tipoEquipoFalla': focusEl = document.querySelector('select[name="tipoEquipoFalla"]'); break;
        case 'afectacionServicios': focusEl = document.querySelector('select[name="afectacionServicios"]'); break;
        case 'cambio': focusEl = document.querySelector('select[name="cambio"]'); break;
        case 'instalacion': focusEl = document.querySelector('select[name="instalacion"]'); break;
        case 'fallaResuelta': focusEl = document.querySelector('select[name="fallaResuelta"]'); break;
        default: break;
      }
      if (focusEl) {
        focusEl.focus();
        focusEl.scrollIntoView({behavior:'smooth',block:'center'});
      }
      return;
    }
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
    guardarLocal();
      renderPrevisualizacion2();
  };
  document.getElementById('volverHome2').onclick = renderHome;
  document.getElementById('backHome2').onclick = renderHome;
}

// --- Previsualización y descarga para Estado General (solo una página) ---
function renderPrevisualizacion1() {
  window.scrollTo({top:0,behavior:'auto'});
  // Mostrar loader overlay antes de renderizar
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
  let loaderBar = loaderOverlay.querySelector('#loader-bar');
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
    }, 350);
  }
  document.getElementById('app').innerHTML = `
    <h2>Previsualización del informe</h2>
    <div id="canvas-container1" style="display:block;text-align:center;visibility:hidden;"></div>
    <div style="display:flex;justify-content:center;gap:16px;margin-top:16px;">
      <button id="descargar1" style="background:#e30613;color:#fff;">Descargar PDF</button>
      <button id="editar1" style="background:#e30613;color:#fff;">Editar datos</button>
      <button id="volverHome1" style="background:#eee;color:#222;">Volver al inicio</button>
    </div>
  `;
  // Renderizar HTML institucional y canvas
  setTimeout(() => {
    let tempDiv1 = document.createElement('div');
    tempDiv1.style.position = 'absolute';
    tempDiv1.style.left = '-9999px';
    tempDiv1.id = 'html-pagina1';
    document.body.appendChild(tempDiv1);
    renderHtmlInstitucional(tempDiv1, datosHoja1, {}, 1);
    html2canvas(tempDiv1, {backgroundColor: "#fff", useCORS: true}).then(c1 => {
      let cont1 = document.getElementById('canvas-container1');
      while (cont1.firstChild) cont1.removeChild(cont1.firstChild);
      c1.style.width = '100%';
      c1.style.height = 'auto';
      cont1.appendChild(c1);
      document.body.removeChild(tempDiv1);
      finishLoader();
    });
  }, 100);
  document.getElementById('descargar1').onclick = () => {
    generarPDF1(datosHoja1, () => {
      localStorage.removeItem('datosHoja1');
      setTimeout(() => {
        datosHoja1 = {};
        evidencias1 = [null, null, null, null];
        firmas = [null];
        renderHome();
      }, 1000);
    });
  };
  document.getElementById('editar1').onclick = () => renderHoja1(true);
  document.getElementById('volverHome1').onclick = renderHome;
  document.getElementById('backHome1').onclick = renderHome;
}

// --- Previsualización y descarga para Informe Técnico Exclusión (solo una página) ---
function renderPrevisualizacion2() {
  window.scrollTo({top:0,behavior:'auto'});
  // Mostrar loader overlay antes de renderizar
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
  let loaderBar = loaderOverlay.querySelector('#loader-bar');
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
      document.getElementById('canvas-container2').style.visibility = 'visible';
    }, 350);
  }
  document.getElementById('app').innerHTML = `
    <h2>Previsualización del informe</h2>
    <div id="canvas-container2" style="display:block;text-align:center;visibility:hidden;"></div>
    <div style="display:flex;justify-content:center;gap:16px;margin-top:16px;">
      <button id="descargar2" style="background:#e30613;color:#fff;">Descargar PDF</button>
      <button id="editar2" style="background:#e30613;color:#fff;">Editar datos</button>
      <button id="volverHome2" style="background:#eee;color:#222;">Volver al inicio</button>
    </div>
  `;
  // Renderizar HTML institucional y canvas
  setTimeout(() => {
    let tempDiv2 = document.createElement('div');
    tempDiv2.style.position = 'absolute';
    tempDiv2.style.left = '-9999px';
    tempDiv2.id = 'html-pagina2';
    document.body.appendChild(tempDiv2);
    renderHtmlInstitucional(tempDiv2, {}, datosHoja2, 2);
    html2canvas(tempDiv2, {backgroundColor: "#fff", useCORS: true}).then(c2 => {
      let cont2 = document.getElementById('canvas-container2');
      while (cont2.firstChild) cont2.removeChild(cont2.firstChild);
      c2.style.width = '100%';
      c2.style.height = 'auto';
      cont2.appendChild(c2);
      document.body.removeChild(tempDiv2);
      finishLoader();
    });
  }, 100);
  document.getElementById('descargar2').onclick = () => {
    generarPDF2(datosHoja2, () => {
      localStorage.removeItem('datosHoja2');
      setTimeout(() => {
        datosHoja2 = {};
        evidencias2 = [null, null, null, null, null, null];
        renderHome();
      }, 1000);
    });
  };
  document.getElementById('editar2').onclick = () => renderHoja2(true);
  document.getElementById('volverHome2').onclick = renderHome;
  document.getElementById('backHome2').onclick = renderHome;
}

// --- Generación de PDF para cada informe ---
function generarPDF1(hoja1, cb) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:'pt',format:[700,990]});
  let div1 = document.createElement('div');
  div1.style.position = 'absolute';
  div1.style.left = '-9999px';
  div1.id = 'pdf-html1';
  document.body.appendChild(div1);
  renderHtmlInstitucional(div1, hoja1, {}, 1);
  setTimeout(() => {
    html2canvas(div1, {backgroundColor: "#fff", scale:3, useCORS: true}).then(canvas1 => {
      pdf.addImage(canvas1.toDataURL('image/jpeg',1.0), 'JPEG', 0, 0, 700, 990);
      pdf.save('Estado General ' + (hoja1.nombreEstacion || '') + '.pdf');
      document.body.removeChild(div1);
      if (cb) cb();
    });
  }, 500);
}
function generarPDF2(hoja2, cb) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:'pt',format:[700,990]});
  let div2 = document.createElement('div');
  div2.style.position = 'absolute';
  div2.style.left = '-9999px';
  div2.id = 'pdf-html2';
  document.body.appendChild(div2);
  renderHtmlInstitucional(div2, {}, hoja2, 2);
  setTimeout(() => {
    html2canvas(div2, {backgroundColor: "#fff", scale:3, useCORS: true}).then(canvas2 => {
      pdf.addImage(canvas2.toDataURL('image/jpeg',1.0), 'JPEG', 0, 0, 700, 990);
      pdf.save('Informe Tecnico Exclusion ' + (hoja2.nombreEstacion || '') + '.pdf');
      document.body.removeChild(div2);
      if (cb) cb();
    });
  }, 500);
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
              <td style="border:1px solid #000;width:30%;">${hoja2.nombreEstacion||''}</td>
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

// --- Nueva pantalla principal ---
function renderHome() {
  document.getElementById('app').innerHTML = `
    <div class="main-home">
      <h2 class="main-home-title">Plataforma generación de informes</h2>
      <img src="logo-claro.png" alt="Logo Claro" class="main-home-logo">
      <button id="btnExclusion" class="main-home-btn">Informe Técnico Exclusión</button>
      <button id="btnEstadoGeneral" class="main-home-btn">Informe Estado General</button>
    </div>
  `;
  document.getElementById('btnEstadoGeneral').onclick = () => renderHoja1(true);
  document.getElementById('btnExclusion').onclick = () => renderHoja2(true);
}

// --- Inicio seguro ---
renderHome();
