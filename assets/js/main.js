document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. CARGA DE COMPONENTES DINÁMICOS (Navbar & Footer)
    // ==========================================
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        fetch('/components/navbar.html')
            .then(response => {
                if (!response.ok) throw new Error("Error al cargar el navbar.html");
                return response.text();
            })
            .then(data => {
                // Inyectamos el menú dinámicamente en el contenedor
                navbarContainer.innerHTML = data;
                
                // --- LÓGICA DE DETECCIÓN DE PÁGINA ACTIVA ---
                const currentPath = window.location.pathname;
                const navLinks = navbarContainer.querySelectorAll('.navbar-menu a, .dropdown-menu a');
                
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (currentPath === href || (href !== '/' && currentPath.includes(href))) {
                        link.classList.add('active-nav-link');
                    }
                });

                // --- ACCESIBILIDAD: SELECTOR DE TAMAÑO DE FUENTE (A+ / A-) ---
                const btnDecrease = document.getElementById('font-decrease');
                const btnReset = document.getElementById('font-reset');
                const btnIncrease = document.getElementById('font-increase');
                const bodyElement = document.body;

                if (btnDecrease && btnReset && btnIncrease) {
                    // Acción para disminuir el tamaño del texto (A-)
                    btnDecrease.addEventListener('click', () => {
                        bodyElement.classList.remove('font-size-increased');
                        bodyElement.classList.add('font-size-decreased');
                    });

                    // Acción para restaurar al tamaño base original (A)
                    btnReset.addEventListener('click', () => {
                        bodyElement.classList.remove('font-size-increased', 'font-size-decreased');
                    });

                    // Acción para aumentar el tamaño del texto (A+)
                    btnIncrease.addEventListener('click', () => {
                        bodyElement.classList.remove('font-size-decreased');
                        bodyElement.classList.add('font-size-increased');
                    });
                }
            })
            .catch(err => console.error(err));
    }

    // --- CARGA DEL FOOTER INSTITUCIONAL ---
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('/components/footer.html')
            .then(response => {
                if (!response.ok) throw new Error("Error al cargar el footer.html");
                return response.text();
            })
            .then(data => {
                footerContainer.innerHTML = data;
            })
            .catch(err => console.error(err));
    }

    // ==========================================
    // 2. LÓGICA DE EXPANSIÓN INDEPENDIENTE DE TARJETAS (Clic)
    // ==========================================
    const teamCards = document.querySelectorAll('.team-card');
    if (teamCards.length > 0) {
        teamCards.forEach(card => {
            card.addEventListener('click', function(event) { 
                // Evitar la expansión si se hace clic en el texto del email o enlaces
                if (event.target.classList.contains('contact-text') || event.target.tagName === 'A') { 
                    return; 
                }
                this.classList.toggle('is-expanded'); 
            }); 
        });
    }

    // ==========================================
    // 3. EFECTO NAV-BAR ENCOLEGIBLE (Shrink on Scroll) - ¡FOOTER ANULADO POR COMPLETO!
    // ==========================================
    window.addEventListener('scroll', () => { 
        const navbar = document.querySelector('.navbar'); 
        
        // Mantener únicamente el shrinking superior de la barra de navegación
        if (navbar) { 
            if (window.scrollY > 50) { 
                navbar.classList.add('shrink'); 
            } else { 
                navbar.classList.remove('shrink'); 
            } 
        } 
    });

    // ==========================================
    // 4. LÓGICA DE CENTRO DE ATENCIÓN UDO (Pestañas)
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0) { 
        tabButtons.forEach(button => { 
            button.addEventListener('click', function() { 
                const targetTab = this.getAttribute('data-tab'); 
                
                // Quitar clases activas de todos los botones y contenidos
                tabButtons.forEach(btn => btn.classList.remove('active')); 
                tabContents.forEach(content => content.classList.remove('active')); 
                
                // Activar la pestaña seleccionada
                this.classList.add('active'); 
                const targetContent = document.getElementById(targetTab); 
                if (targetContent) { 
                    targetContent.classList.add('active'); 
                } 
            }); 
        }); 
    }

// ==========================================
    // 5. ENVÍO DE FORMULARIO A GOOGLE SHEETS (CON ADJUNTO AL CORREO DIRECTO)
    // ==========================================
    const consultaForm = document.getElementById('consultaForm');
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbytCM68luznGdNcsOvVwqtY-SAV1FP3rk-DeVMTFbdktVS4XZCfRDMky7KBR-ZrIAVI/exec";
    
    if (consultaForm) { 
        consultaForm.addEventListener("submit", async function(e) { 
            e.preventDefault(); 
            
            try { 
                // 1. 🔍 CAPTURAMOS EL ARCHIVO FÍSICO DESDE EL HTML
                const inputArchivo = document.getElementById('archivo-adjunto');
                let archivoProcesado = null;

                if (inputArchivo && inputArchivo.files.length > 0) {
                    const file = inputArchivo.files[0];
                    
                    // Esperamos que el navegador lea el archivo y lo transforme en Base64
                    archivoProcesado = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                base64: reader.result.split(',')[1], // Código puro del archivo
                                mimeType: file.type,
                                name: file.name
                            });
                        };
                        reader.onerror = error => reject(error);
                        reader.readAsDataURL(file); // Iniciamos la lectura física
                    });
                }

                // 2. 📦 EMPAQUETAMOS LOS DATOS (Campos de texto + Estructura de archivo)
                const data = { 
                    nombre: document.getElementById("nombre").value, 
                    correo: document.getElementById("correo").value, 
                    unidad: document.getElementById("unidad").value, 
                    tema: document.getElementById("tema").value, 
                    consulta: document.getElementById("consulta").value,
                    archivo: archivoProcesado // Se inyecta la información o un valor null si va vacío
                };
                
                // 3. 🚀 DISPARAMOS EL FETCH CON ESCUDO ANTI-CORS (Imprescindible para paquetes con Base64)
                await fetch(SCRIPT_URL, { 
                    method: "POST", 
                    mode: "no-cors", // 🔥 Evita que el navegador detenga el envío del archivo pesado
                    headers: {
                        "Content-Type": "text/plain" // Engañamos al cortafuegos del navegador
                    },
                    body: JSON.stringify(data) 
                });
                
                // 4. 🎉 CONFIRMACIÓN DE ÉXITO INMEDIATA
                const mensajeExito = document.getElementById("mensajeExito");
                if (mensajeExito) { 
                    mensajeExito.style.display = "block"; 
                } 
                this.reset(); // Reseteamos los campos del formulario por seguridad

            } catch (error) { 
                console.error("Error detectado en la petición fetch:", error);
                alert("Error al enviar la consulta. Por favor, intente nuevamente."); 
            } 
        }); 
    }
    // ==========================================
    // 6. BOTÓN FLOTANTE "VOLVER ARRIBA" (Esquina Inferior Derecha)
    // ==========================================
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top-btn'; 
    backToTopBtn.innerHTML = '▲'; 
    backToTopBtn.setAttribute('title', 'Volver al inicio'); 
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', () => { 
        if (window.scrollY > 400) { 
            backToTopBtn.classList.add('is-visible'); 
        } else { 
            backToTopBtn.classList.remove('is-visible'); 
        } 
    });
    
    backToTopBtn.addEventListener('click', () => { 
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        }); 
    });

    // ==========================================
    // 7. LECTOR DE PANTALLA NATIVO GLOBAL (Esquina Inferior Izquierda)
    // ==========================================
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'voice-reader-btn';
    voiceBtn.innerHTML = '🔊 Escuchar Página';
    voiceBtn.setAttribute('title', 'Leer el contenido completo');
    document.body.appendChild(voiceBtn);

    let speaking = false;
    let utterance = null;

    voiceBtn.addEventListener('click', () => {
        if (!speaking) {
            // Extraer títulos, párrafos, listas y etiquetas de forma inteligente
            const elements = document.querySelectorAll('h1, h2, h3, p, li, label');
            let textToRead = "";

            elements.forEach(el => {
                // Filtro preventivo: ignoramos el menú de navegación y el pie de página
                if (!el.closest('#navbar-container') && !el.closest('#footer-container') && !el.closest('.navbar') && !el.closest('.footer')) {
                    textToRead += el.innerText + ". ";
                }
            });

            if (textToRead.trim() === "") return;

            // Configurar el motor de voz nativo en español
            utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'es-CL'; 

            utterance.onend = () => {
                speaking = false;
                voiceBtn.innerHTML = '🔊 Escuchar Página';
                voiceBtn.classList.remove('is-reading');
            };

            window.speechSynthesis.speak(utterance);
            speaking = true;
            voiceBtn.innerHTML = '⏹ Detener Lectura';
            voiceBtn.classList.add('is-reading');
        } else {
            // Detener el motor gráfico de voz de inmediato
            window.speechSynthesis.cancel();
            speaking = false;
            voiceBtn.innerHTML = '🔊 Escuchar Página';
            voiceBtn.classList.remove('is-reading');
        }
    });

    // ==========================================
    // 🚀 8. MICRO-ASISTENTE DE GUÍA PARA LOOKER STUDIO
    // ==========================================
    const dashboards = document.querySelectorAll('.dashboard-wrapper');
    
    if (dashboards.length > 0) {
        // A. Creamos e inyectamos la estructura del Modal Global al final del body
        const modalElement = document.createElement('div');
        modalElement.id = 'looker-help-modal';
        modalElement.className = 'looker-modal';
        modalElement.innerHTML = `
            <div class="looker-modal-backdrop"></div>
            <div class="looker-modal-content">
                <button class="looker-modal-close" title="Cerrar">&times;</button>
                <div class="looker-modal-header">
                    <h3>💡 Guía de Uso Rápido - Panel Interactivo</h3>
                    <p>Sigue estos sencillos pasos para navegar y extraer información del panel de Looker Studio.</p>
                </div>
                <div class="looker-modal-steps">
                    <div class="looker-step-card">
                        <div class="step-icon">🔍</div>
                        <h4>1. Filtrar por Servicio</h4>
                        <p>Haz clic en los cuadros desplegables de la parte superior del panel para seleccionar tu Servicio o Unidad.</p>
                    </div>
                    <div class="looker-step-card">
                        <div class="step-icon">🖱️</div>
                        <h4>2. Clic para Filtrar</h4>
                        <p>Puedes hacer clic directo sobre cualquier barra o sección de los gráficos para filtrar todo el panel automáticamente.</p>
                    </div>
                    <div class="looker-step-card">
                        <div class="step-icon">📥</div>
                        <h4>3. Exportar a Excel</h4>
                        <p>Pasa el mouse sobre la tabla, haz clic en los tres puntos verticales (⋮) de la esquina y selecciona "Exportar".</p>
                    </div>
                </div>
                <div class="looker-modal-footer">
                    <span>Unidad de Desarrollo Organizacional (UDO) - HSP</span>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);

        // B. Seleccionamos los elementos de control del modal recién creado
        const closeModalBtn = modalElement.querySelector('.looker-modal-close');
        const backdropModal = modalElement.querySelector('.looker-modal-backdrop');

        // Funciones para abrir y cerrar el modal
        const openModal = () => modalElement.classList.add('is-active');
        const closeModal = () => modalElement.classList.remove('is-active');

        closeModalBtn.addEventListener('click', closeModal);
        backdropModal.addEventListener('click', closeModal);

        // C. Por cada panel iframe que encontremos, le inyectamos su propia burbuja "?"
        dashboards.forEach(wrapper => {
            const helpBtn = document.createElement('button');
            helpBtn.className = 'looker-help-btn';
            helpBtn.innerHTML = '?';
            helpBtn.setAttribute('title', 'Guía de uso del panel');
            
            // Al hacer clic en la burbuja de este panel, se abre el modal explicativo
            helpBtn.addEventListener('click', openModal);
            
            // Lo inyectamos al principio del contenedor del panel
            wrapper.appendChild(helpBtn);
        });
    }

    // ==========================================
    // 🚀 9. MICRO-ASISTENTE DE GUÍA PARA CENTRO DE ATENCIÓN
    // ==========================================
    const consultasContainer = document.querySelector('.consultas-container');
    if (consultasContainer) {
        // A. Creamos el modal explicativo exclusivo para la página de Consultas
        const consultasModal = document.createElement('div');
        consultasModal.id = 'consultas-help-modal';
        consultasModal.className = 'looker-modal'; // Reutiliza la misma estructura modal animada
        consultasModal.innerHTML = `
            <div class="looker-modal-backdrop"></div>
            <div class="looker-modal-content">
                <button class="looker-modal-close" title="Cerrar">&times;</button>
                <div class="looker-modal-header">
                    <h3>💡 Guía del Centro de Atención UDO</h3>
                    <p>Conoce cómo utilizar nuestros dos canales de comunicación directa de forma eficiente.</p>
                </div>
                <div class="looker-modal-steps">
                    <div class="looker-step-card">
                        <div class="step-icon">📑</div>
                        <h4>1. Elige tu Canal</h4>
                        <p>Usa las pestañas superiores para alternar entre "Enviar Consulta" (formulario escrito) o "Agendar Reunión" (Calendly).</p>
                    </div>
                    <div class="looker-step-card">
                        <div class="step-icon">✍️</div>
                        <h4>2. Canal de Consultas</h4>
                        <p>Ideal para dudas técnicas de manuales o perfiles de cargo. Escribe tu message y el sistema enviará un respaldo oficial por correo.</p>
                    </div>
                    <div class="looker-step-card">
                        <div class="step-icon">🗓️</div>
                        <h4>3. Agendar Reunión</h4>
                        <p>¿Necesitas una videollamada de 30 min? Selecciona el día y la hora directo en el calendario interactivo para reservar el cupo.</p>
                    </div>
                </div>
                <div class="looker-modal-footer">
                    <span>Unidad de Desarrollo Organizacional (UDO) - HSP</span>
                </div>
            </div>
        `;
        document.body.appendChild(consultasModal);

        const closeBtn = consultasModal.querySelector('.looker-modal-close');
        const backdrop = consultasModal.querySelector('.looker-modal-backdrop');
        const openConsultasModal = () => consultasModal.classList.add('is-active');
        const closeConsultasModal = () => consultasModal.classList.remove('is-active');

        closeBtn.addEventListener('click', closeConsultasModal);
        backdrop.addEventListener('click', closeConsultasModal);

        // B. Creamos e inyectamos la burbuja "?" amarilla en la esquina superior de la caja de consultas
        const helpBtn = document.createElement('button');
        helpBtn.className = 'looker-help-btn';
        helpBtn.innerHTML = '?';
        helpBtn.setAttribute('title', 'Ayuda del Centro de Atención');
        helpBtn.addEventListener('click', helpBtnEvent => {
            helpBtnEvent.preventDefault();
            openConsultasModal();
        });

        consultasContainer.appendChild(helpBtn);
    }
});



// ==========================================
    // 🚀 10. MÓDULO RESIDENCIAL: REPOSITORIO CÍCLICO CON BUSCADOR, MODAL Y BADGE EN TIEMPO REAL
    // ==========================================
    const pinterestFeed = document.getElementById('pinterest-pdf-feed');
    const inputBuscador = document.getElementById('udo-doc-search');
    const API_LEER_DRIVE = "https://script.google.com/macros/s/AKfycbydFk-CTqEjeSeWhlbufq8pQTTN79sZlfD9f2O_vOyA0caYBS47ywG3xmO0191FBfxjig/exec"; 

    let cacheDocumentosUDO = []; 
    let controlAnilloActivo = null; 

    if (pinterestFeed) {
        console.log("Iniciando repositorio inteligente con Badge de Novedad UDO...");
        
        // Inyección dinámica de la estructura base del modal (Asegura compatibilidad limpia)
        if (!document.getElementById('udo-pdf-modal')) {
            const estructuraModal = document.createElement('div');
            estructuraModal.id = 'udo-pdf-modal';
            estructuraModal.className = 'udo-modal-overlay';
            estructuraModal.innerHTML = `
                <div class="udo-modal-container">
                    <div class="udo-modal-header">
                        <h3 id="udo-modal-title">Cargando documento...</h3>
                        <div class="udo-modal-controls">
                            <button class="udo-audio-btn" id="udo-narrador-trigger" data-titulo="">
                                <span class="audio-icon">🔊</span> <span class="audio-text">Escuchar Info</span>
                            </button>
                            <button class="udo-modal-close" title="Cerrar Vista Previa">&times;</button>
                        </div>
                    </div>
                    <div class="udo-modal-body">
                        <iframe id="udo-modal-iframe" src="" allow="autoplay"></iframe>
                    </div>
                </div>
            `;
            document.body.appendChild(estructuraModal);

            const botonCerrar = estructuraModal.querySelector('.udo-modal-close');
            const cerrarModalUDO = () => {
                estructuraModal.classList.remove('is-open');
                document.body.classList.remove('udo-modal-lock');
                document.getElementById('udo-modal-iframe').src = ""; 
            };
            botonCerrar.addEventListener('click', cerrarModalUDO);
            estructuraModal.addEventListener('click', (e) => { if (e.target === estructuraModal) cerrarModalUDO(); });
            document.addEventListener('keydown', (e) => { if (e.key === "Escape" && estructuraModal.classList.contains('is-open')) cerrarModalUDO(); });
        }

        // Conexión con tu Web App de Google Apps Script recién guardada
        fetch(API_LEER_DRIVE)
            .then(response => { if (!response.ok) throw new Error("Fallo de red"); return response.json(); })
            .then(documentos => {
                cacheDocumentosUDO = documentos;
                renderizarMuroDocumentos(cacheDocumentosUDO);

                if (inputBuscador) {
                    inputBuscador.addEventListener('input', (e) => {
                        const terminoBusqueda = e.target.value.toLowerCase().trim();
                        if (terminoBusqueda === "") {
                            renderizarMuroDocumentos(cacheDocumentosUDO);
                        } else {
                            const documentosFiltrados = cacheDocumentosUDO.filter(doc => doc.titulo.toLowerCase().includes(terminoBusqueda));
                            renderizarMuroDocumentos(documentosFiltrados, true);
                        }
                    });
                }
            })
            .catch(error => {
                console.error("Error:", error);
                pinterestFeed.innerHTML = "<p style='color:#D93025; text-align:center;'>Error de comunicación con el repositorio.</p>";
            });
    }

    function renderizarMuroDocumentos(lista, esBusquedaActiva = false) {
        if (controlAnilloActivo) { controlAnilloActivo.destruir(); controlAnilloActivo = null; }
        pinterestFeed.innerHTML = "";
        pinterestFeed.classList.remove('loading');

        const btnPrev = document.getElementById('slider-btn-prev');
        const btnNext = document.getElementById('slider-btn-next');

        if (lista.length === 0) {
            pinterestFeed.innerHTML = "<p style='color:#888; width:100%; text-align:center; padding: 20px 0;'>No se encontraron resultados.</p>";
            if (btnPrev && btnNext) { btnPrev.style.display = 'none'; btnNext.style.display = 'none'; }
            return;
        }

        lista.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'pdf-pinterest-card';
            const proxyPortadaUrl = `https://drive.google.com/thumbnail?id=${doc.id}&sz=w500`;

            // =======================================================
            // 🎯 MOTOR MATEMÁTICO: CALCULAR AJUSTE DE NOVEDAD (BADGE)
            // =======================================================
            let badgeHTML = '';
            if (doc.fecha) {
                const fechaCreacion = new Date(doc.fecha);
                const fechaHoy = new Date();
                
                // Calculamos la diferencia en milisegundos y la transformamos a días físicos
                const diferenciaTiempo = fechaHoy - fechaCreacion;
                const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));

                // Si el archivo tiene entre 0 y 15 días de vida en Drive, se gana el Badge de Nuevo
                if (diferenciaDias <= 15 && diferenciaDias >= 0) {
                badgeHTML = `<span class="udo-badge-nuevo">✦ NUEVO</span>`;
                }
            }

            // Inyectamos el HTML de la tarjeta incorporando el badge calculado
            card.innerHTML = `
                ${badgeHTML}
                <div class="card-overlay"><h4 class="card-title">✦ ${doc.titulo}</h4></div>
                <img src="${proxyPortadaUrl}" class="card-thumbnail" alt="Portada" onerror="this.style.display='none'; this.parentElement.classList.add('no-thumb');">
            `;

            card.addEventListener('click', () => {
                const modalOverlay = document.getElementById('udo-pdf-modal');
                const modalIframe = document.getElementById('udo-modal-iframe');
                const modalTitle = document.getElementById('udo-modal-title');
                const btnAudio = document.getElementById('udo-narrador-trigger');

                if (modalOverlay && modalIframe && modalTitle) {
                    modalTitle.textContent = doc.titulo;
                    modalIframe.src = `https://drive.google.com/file/d/${doc.id}/preview`;
                    if (btnAudio) { btnAudio.setAttribute('data-titulo', doc.titulo); }
                    modalOverlay.classList.add('is-open');
                    document.body.classList.add('udo-modal-lock');
                }
            });

            pinterestFeed.appendChild(card);
        });

        if (esBusquedaActiva) {
            pinterestFeed.scrollLeft = 0;
            if (btnPrev && btnNext) { btnPrev.style.display = 'none'; btnNext.style.display = 'none'; }
        } else {
            if (btnPrev && btnNext) { btnPrev.style.display = 'flex'; btnNext.style.display = 'flex'; }
            controlAnilloActivo = iniciarAnilloMecanicoHSP(pinterestFeed);
        }
    }

    function iniciarAnilloMecanicoHSP(contenedor) {
        let avancePixel = 1; let delayTiempo = 25; let estaPausado = false; let enAnimacionManual = false; let timerReanudacion = null;
        const btnPrev = document.getElementById('slider-btn-prev'); const btnNext = document.getElementById('slider-btn-next');

        const reciclarEstructuraMuro = () => {
            const primerElemento = contenedor.firstElementChild; if (!primerElemento) return;
            const gapEspacio = parseInt(window.getComputedStyle(contenedor).gap) || 20;
            const anchoTotalTarjeta = primerElemento.offsetWidth + gapEspacio;
            while (contenedor.scrollLeft >= anchoTotalTarjeta) { contenedor.appendChild(contenedor.firstElementChild); contenedor.scrollLeft -= anchoTotalTarjeta; }
            if (contenedor.scrollLeft <= 0) {
                const ultimoElemento = contenedor.lastElementChild;
                if (ultimoElemento) { contenedor.insertBefore(ultimoElemento, contenedor.firstElementChild); contenedor.scrollLeft += ultimoElemento.offsetWidth + gapEspacio; }
            }
        };

        const flujoPerpetuo = () => { if (!estaPausado && !enAnimacionManual) { contenedor.scrollLeft += avancePixel; reciclarEstructuraMuro(); } };
        let intervaloAutoScroll = setInterval(flujoPerpetuo, delayTiempo);

        const ejecutarDesplazamientoBoton = (direccion) => {
            if (enAnimacionManual) return; enAnimacionManual = true; estaPausado = true; clearTimeout(timerReanudacion);
            const primerHijo = contenedor.firstElementChild; if (!primerHijo) return;
            const gap = parseInt(window.getComputedStyle(contenedor).gap) || 20;
            const distanciaObjetivo = primerHijo.offsetWidth + gap; let recorridoActual = 0; const pasoPorFrame = 16;
            const frameAnimacion = () => {
                if (recorridoActual >= distanciaObjetivo) { enAnimacionManual = false; timerReanudacion = setTimeout(() => { estaPausado = false; }, 2000); return; }
                if (direccion === 1) { contenedor.scrollLeft += pasoPorFrame; recorridoActual += pasoPorFrame; reciclarEstructuraMuro(); } 
                else { if (contenedor.scrollLeft <= pasoPorFrame) { reciclarEstructuraMuro(); } contenedor.scrollLeft -= pasoPorFrame; recorridoActual += pasoPorFrame; }
                requestAnimationFrame(frameAnimacion);
            };
            requestAnimationFrame(frameAnimacion);
        };

        const clickPrev = (e) => { e.preventDefault(); ejecutarDesplazamientoBoton(-1); };
        const clickNext = (e) => { e.preventDefault(); ejecutarDesplazamientoBoton(1); };
        const mouseEnter = () => { if (!enAnimacionManual) estaPausado = true; };
        const mouseLeave = () => { if (!enAnimacionManual) estaPausado = false; };

        if (btnPrev && btnNext) { btnPrev.addEventListener('click', clickPrev); btnNext.addEventListener('click', clickNext); }
        contenedor.addEventListener('mouseenter', mouseEnter); contenedor.addEventListener('mouseleave', mouseLeave);

        return {
            destruir: () => {
                clearInterval(intervaloAutoScroll); clearTimeout(timerReanudacion);
                if (btnPrev && btnNext) { btnPrev.removeEventListener('click', clickPrev); btnNext.removeEventListener('click', clickNext); }
                contenedor.removeEventListener('mouseenter', mouseEnter); contenedor.removeEventListener('mouseleave', mouseLeave);
            }
        };
    }

    // ==========================================
// 🔊 11. MÓDULO SATÉLITE TOTALMENTE INDEPENDIENTE: MOTOR DE AUDIO ACCESIBLE
// ==========================================
(function() {
    "use strict";

    // Delegación de Eventos Global en el Body: Captura el click del botón de audio esté donde esté
    document.body.addEventListener('click', (e) => {
        const btnAudio = e.target.closest('#udo-narrador-trigger');
        if (!btnAudio) return; // Si no es el botón de voz, ignoramos el click por completo
        
        e.preventDefault();

        // 🔀 ACCIÓN TOGGLE: Si la voz ya estaba hablando en el hospital, el click la detiene de inmediato
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            resetearEstilosBotonVoz(btnAudio);
            return;
        }

        // 🧠 DESACOPLAMIENTO ABSOLUTO: Rescatamos el título directo desde el atributo 'data-titulo' del DOM
        const tituloDocumento = btnAudio.getAttribute('data-titulo') || "Documento General Institucional";

        // Redacción del libreto de locución oficial adaptado para accesibilidad
        const mensajeOficial = `Usted está visualizando el documento oficial de la Unidad de Desarrollo Organizacional titulado: ${tituloDocumento}. Puede leerlo en el visor central o descargarlo directamente usando los comandos del extremo superior derecho del lector.`;

        if (!window.speechSynthesis) {
            console.warn("La síntesis de voz nativa no está soportada en este navegador.");
            return;
        }

        const enunciadoLectura = new SpeechSynthesisUtterance(mensajeOficial);
        enunciadoLectura.lang = 'es-CL'; // Configurado con acento local en español
        enunciadoLectura.rate = 0.95;    // Velocidad pausada y clara para entornos de salud

        // El botón vuelve a su estado normal de forma automática cuando la lectura termina con éxito
        enunciadoLectura.onend = () => { resetearEstilosBotonVoz(btnAudio); };
        enunciadoLectura.onerror = () => { resetearEstilosBotonVoz(btnAudio); };

        // Activamos la animación visual de onda verde y disparamos el sintetizador
        btnAudio.classList.add('is-playing');
        btnAudio.querySelector('.audio-text').textContent = "Detener Voz";
        window.speechSynthesis.speak(enunciadoLectura);
    });

    // 🚨 SEGURO DE AUDIO PERPETUO (LIFECYCLE HOOKS):
    // El motor de voz escucha de forma independiente si el usuario cierra el modal o aprieta Escape.
    // Si detecta un cierre, apaga los altavoces inmediatamente para que la voz no quede hablando sola.
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.udo-modal-close') || e.target.classList.contains('udo-modal-overlay')) {
            apagarAltavocesGlobales();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") { apagarAltavocesGlobales(); }
    });

    // Funciones utilitarias internas del módulo satélite
    function resetearEstilosBotonVoz(boton) {
        if (!boton) return;
        boton.classList.remove('is-playing');
        const campoTexto = boton.querySelector('.audio-text');
        if (campoTexto) campoTexto.textContent = "Escuchar Info";
    }

    function apagarAltavocesGlobales() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        // Nos aseguramos de apagar el switch visual del botón si el modal se cerró de golpe
        const btnAudio = document.getElementById('udo-narrador-trigger');
        if (btnAudio) {
            btnAudio.classList.remove('is-playing');
            const campoTexto = btnAudio.querySelector('.audio-text');
            if (campoTexto) campoTexto.textContent = "Escuchar Info";
        }
    }
})();


document.getElementById('form-consultas').addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. 🚀 LANZAMOS LA ALERTA DE CARGA (Bloquea la pantalla)
    Swal.fire({
        title: 'Procesando solicitud...',
        html: 'Estamos subiendo tu archivo y generando el ticket.<br><b>Por favor, no cierres esta ventana.</b>',
        allowOutsideClick: false, // Evita que se cierre si el usuario hace clic afuera
        showConfirmButton: false, // Oculta el botón de "OK"
        didOpen: () => {
            Swal.showLoading(); // 🌀 Activa la ruedita nativa de SweetAlert
        }
    });

    // 2. FUNCIÓN INTERNA QUE HACE EL ENVÍO A GOOGLE
    const enviarDatosAGoogle = (archivoProcesado) => {
        // Empaquetamos los datos del formulario
        const datosConsulta = {
            nombre: document.getElementById('nombre').value,
            correo: document.getElementById('correo').value,
            unidad: document.getElementById('unidad').value,
            tema: document.getElementById('tema').value,
            consulta: document.getElementById('consulta').value,
            archivo: archivoProcesado // Puede traer el Base64 o venir nulo
        };

        // Reemplaza por tu URL real de Apps Script
        const SCRIPT_URL = "TU_URL_DE_GOOGLE_AQUI"; 

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(datosConsulta)
        })
        .then(response => response.json())
        .then(data => {
            if(data.result === "success") {
                // 🎉 ÉXITO: Transformamos la ruedita en un Check Verde
                Swal.fire({
                    icon: 'success',
                    title: '¡Solicitud Enviada!',
                    text: 'El comprobante oficial ha sido despachado a tu correo.',
                    confirmButtonColor: '#10B981'
                });
                document.getElementById('form-consultas').reset(); // Vaciamos el formulario
            } else {
                throw new Error("Fallo interno en Google");
            }
        })
        .catch(error => {
            // ❌ ERROR: Transformamos la ruedita en una X Roja
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No pudimos enviar tu solicitud. Intenta nuevamente.',
                confirmButtonColor: '#EF4444'
            });
        });
    };

    // 3. CAPTURAMOS EL ARCHIVO (Para pasarlo a Base64 sin usar async/await)
    const inputArchivo = document.getElementById('archivo-adjunto'); // Revisa que este ID sea el correcto
    
    if (inputArchivo && inputArchivo.files.length > 0) {
        const file = inputArchivo.files[0];
        const reader = new FileReader();
        
        // Cuando termine de leer el PDF/Imagen, dispara la función de envío
        reader.onload = function(event) {
            const base64Content = event.target.result.split(',')[1];
            enviarDatosAGoogle({
                base64: base64Content,
                mimeType: file.type,
                name: file.name
            });
        };
        reader.readAsDataURL(file); // Inicia la lectura del archivo físico
    } else {
        // Si el compadre no adjuntó ningún archivo, mandamos la solicitud directo con valor 'null'
        enviarDatosAGoogle(null);
    }
});


window.addEventListener('scroll', () => {
    // Calcula qué tan abajo está el usuario en la página
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    // Lo convierte en un porcentaje (0 a 100)
    const scrolled = (winScroll / height) * 100;
    
    // Inyecta el porcentaje al ancho de la barrita
    const progressBar = document.getElementById('udoProgressBar');
    if(progressBar) {
        progressBar.style.width = scrolled + '%';
    }
});