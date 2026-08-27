<template>
  <div class="lesson-page">

    <!-- SIDEBAR -->
    <aside class="lesson-sidebar">

      <NuxtLink
        to="/campus/cursos/liderazgo-sanmartiniano"
        class="lesson-logo"
      >
        <img src="/logo.png" alt="EmergeGroup Consultora" />
      </NuxtLink>

      <span class="campus-name">
        CAMPUS EMERGE
      </span>

      <NuxtLink
        to="/campus/cursos/liderazgo-sanmartiniano"
        class="back-course"
      >
        ← Volver al curso
      </NuxtLink>

      <div class="sidebar-info">

        <span>MÓDULO 3</span>

        <h2>
          Comunicación, confianza y equipos
        </h2>

        <p>
          Clase 2 de 3
        </p>

      </div>

      <div class="sidebar-progress">

        <div class="progress-info">
          <span>Progreso del módulo</span>
          <strong>65%</strong>
        </div>

        <div class="progress-bar">
          <div class="progress" style="width: 65%"></div>
        </div>

      </div>

    </aside>


    <!-- CONTENIDO -->
    <main class="lesson-main">

      <!-- CABECERA -->
      <header class="lesson-header">

        <span class="section-label">
          LIDERAZGO SANMARTINIANO · MÓDULO 3
        </span>

        <h1>
          Conversaciones que construyen equipos
        </h1>

        <p>
          En esta clase exploramos cómo las conversaciones,
          la confianza y la coordinación de acciones impactan
          directamente en la construcción de equipos efectivos.
        </p>

      </header>


      <!-- VIDEO -->
      <section class="lesson-video">

        <div class="video-placeholder">

          <div class="play-button">
            ▶
          </div>

          <span>
            Video de la clase
          </span>

        </div>

      </section>


      <!-- INFORMACIÓN -->
      <section class="lesson-content-grid">

        <!-- COLUMNA PRINCIPAL -->
        <div class="lesson-content">

          <span class="section-label">
            SOBRE ESTA CLASE
          </span>

          <h2>
            Liderar también es conversar
          </h2>

          <p>
            Los equipos se construyen en las conversaciones.
            Cada pedido, compromiso, declaración y conversación
            puede fortalecer o debilitar la confianza.
          </p>

          <p>
            En este encuentro trabajamos sobre la capacidad del
            líder para generar contextos de confianza, coordinar
            acciones y sostener conversaciones que permitan avanzar
            hacia resultados compartidos.
          </p>


          <!-- APRENDIZAJES -->
          <div class="learning-box">

            <h3>
              Al finalizar esta clase podrás:
            </h3>

            <ul>
              <li>
                Reconocer el impacto de las conversaciones en los equipos.
              </li>

              <li>
                Identificar factores que fortalecen o debilitan la confianza.
              </li>

              <li>
                Mejorar la coordinación de acciones.
              </li>

              <li>
                Diseñar conversaciones orientadas a resultados.
              </li>
            </ul>

          </div>


          <!-- ACTIVIDAD -->
          <div class="activity-box">

            <span class="section-label">
              ACTIVIDAD
            </span>

            <h3>
              Reflexión aplicada
            </h3>

            <p>
              Pensá en una conversación reciente dentro de tu equipo
              que haya generado un resultado positivo o negativo.
            </p>

            <p>
              ¿Qué elementos estuvieron presentes? ¿Qué podrías haber
              hecho de manera diferente?
            </p>

            <button>
              Realizar actividad →
            </button>

          </div>

        </div>


        <!-- COLUMNA LATERAL -->
        <aside class="lesson-resources">

          <div class="resource-card">

            <span class="section-label">
              MATERIALES
            </span>

            <h3>
              Recursos de la clase
            </h3>

            <div class="resource-item">

              <div class="resource-icon">
                PDF
              </div>

              <div>
                <strong>
                  Guía de trabajo
                </strong>

                <small>
                  Documento PDF
                </small>
              </div>

              <button>
                Abrir
              </button>

            </div>


            <div class="resource-item">

              <div class="resource-icon">
                PDF
              </div>

              <div>
                <strong>
                  Lectura complementaria
                </strong>

                <small>
                  Material de apoyo
                </small>
              </div>

              <button>
                Abrir
              </button>

            </div>

          </div>


          <!-- COMPLETAR -->
          <div class="complete-card">

            <span>
              ¿Terminaste la clase?
            </span>

            <p>
              Marcala como completada para continuar avanzando.
            </p>

            <button>
              ✓ Marcar como completada
            </button>

          </div>

        </aside>

      </section>


      <!-- NAVEGACIÓN -->
      <section class="lesson-navigation">

        <button class="previous">
          ← Clase anterior
        </button>

        <div>
          <span>
            Clase 2 de 3
          </span>
        </div>

        <button class="next">
          Siguiente clase →
        </button>

      </section>

    </main>

  </div>
</template>


<style scoped>

.lesson-page {
  min-height: 100vh;

  display: grid;
  grid-template-columns: 280px 1fr;

  font-family: 'Montserrat', sans-serif;

  background: #F6F8FC;

  color: #0D2C54;
}


/* SIDEBAR */

.lesson-sidebar {
  position: sticky;
  top: 0;

  height: 100vh;

  box-sizing: border-box;

  padding: 30px 26px;

  background:
    linear-gradient(
      180deg,
      #0D2C54 0%,
      #164B8A 100%
    );

  color: white;
}


.lesson-logo img {
  width: 140px;

  padding: 8px;

  border-radius: 10px;

  background: white;
}


.campus-name {
  display: block;

  color: #F28C28;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 2px;

  margin: 20px 0 30px;
}


.back-course {
  display: inline-block;

  margin-bottom: 45px;

  color: rgba(255,255,255,.75);

  text-decoration: none;

  font-size: 13px;
}


.sidebar-info > span {
  color: #F28C28;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 1.5px;
}


.sidebar-info h2 {
  font-family: 'Cinzel', serif;

  font-size: 24px;

  line-height: 1.3;

  margin: 12px 0;
}


.sidebar-info p {
  color: rgba(255,255,255,.65);
}


.sidebar-progress {
  margin-top: 45px;
}


.progress-info {
  display: flex;

  justify-content: space-between;

  margin-bottom: 10px;

  font-size: 13px;
}


.progress-info strong {
  color: #F28C28;
}


.progress-bar {
  height: 8px;

  background: rgba(255,255,255,.15);

  border-radius: 20px;

  overflow: hidden;
}


.progress {
  height: 100%;

  background: #F28C28;

  border-radius: 20px;
}


/* CONTENIDO */

.lesson-main {
  padding: 50px 6%;
}


.section-label {
  color: #F28C28;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 2px;
}


.lesson-header {
  max-width: 950px;

  margin-bottom: 40px;
}


.lesson-header h1 {
  font-family: 'Cinzel', serif;

  font-size: clamp(38px, 5vw, 58px);

  margin: 10px 0 18px;
}


.lesson-header p {
  max-width: 820px;

  color: #66768a;

  font-size: 18px;

  line-height: 1.8;
}


/* VIDEO */

.lesson-video {
  margin-bottom: 50px;
}


.video-placeholder {
  min-height: 480px;

  border-radius: 24px;

  background:
    linear-gradient(
      135deg,
      #0D2C54,
      #2563EB
    );

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 16px;

  color: white;
}


.play-button {
  width: 80px;

  height: 80px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  background: #F28C28;

  font-size: 28px;

  cursor: pointer;
}


.video-placeholder span {
  font-weight: 700;
}


/* CONTENIDO CLASE */

.lesson-content-grid {
  display: grid;

  grid-template-columns: minmax(0, 1fr) 340px;

  gap: 35px;
}


.lesson-content {
  background: white;

  padding: 38px;

  border-radius: 22px;

  border: 1px solid rgba(13,44,84,.08);
}


.lesson-content h2 {
  font-family: 'Cinzel', serif;

  font-size: 32px;

  margin: 10px 0 22px;
}


.lesson-content > p {
  color: #66768a;

  line-height: 1.8;

  font-size: 16px;
}


/* APRENDIZAJES */

.learning-box {
  margin-top: 35px;

  padding: 28px;

  border-radius: 18px;

  background: #F6F8FC;
}


.learning-box h3 {
  margin-top: 0;
}


.learning-box ul {
  padding-left: 20px;

  color: #66768a;

  line-height: 1.9;
}


/* ACTIVIDAD */

.activity-box {
  margin-top: 35px;

  padding: 30px;

  border-radius: 20px;

  background:
    linear-gradient(
      135deg,
      #0D2C54,
      #2563EB
    );

  color: white;
}


.activity-box h3 {
  font-size: 23px;

  margin: 10px 0 15px;
}


.activity-box p {
  color: rgba(255,255,255,.8);

  line-height: 1.7;
}


.activity-box button {
  margin-top: 10px;

  border: none;

  padding: 12px 18px;

  border-radius: 9px;

  background: #F28C28;

  color: white;

  font-weight: 800;

  cursor: pointer;
}


/* RECURSOS */

.lesson-resources {
  display: flex;

  flex-direction: column;

  gap: 25px;
}


.resource-card,
.complete-card {
  background: white;

  padding: 28px;

  border-radius: 20px;

  border: 1px solid rgba(13,44,84,.08);
}


.resource-card h3 {
  margin: 10px 0 25px;
}


.resource-item {
  display: grid;

  grid-template-columns: auto 1fr auto;

  gap: 12px;

  align-items: center;

  padding: 15px 0;

  border-bottom: 1px solid #EDF1F6;
}


.resource-item:last-child {
  border-bottom: none;
}


.resource-icon {
  width: 42px;

  height: 42px;

  border-radius: 10px;

  display: flex;

  align-items: center;

  justify-content: center;

  background: rgba(242,140,40,.13);

  color: #F28C28;

  font-size: 11px;

  font-weight: 900;
}


.resource-item strong {
  display: block;

  font-size: 13px;

  margin-bottom: 4px;
}


.resource-item small {
  color: #8390A2;
}


.resource-item button {
  border: none;

  background: transparent;

  color: #2563EB;

  font-weight: 700;

  cursor: pointer;
}


/* COMPLETAR */

.complete-card {
  background: #0D2C54;

  color: white;
}


.complete-card > span {
  font-weight: 800;

  font-size: 17px;
}


.complete-card p {
  color: rgba(255,255,255,.7);

  line-height: 1.6;
}


.complete-card button {
  width: 100%;

  border: none;

  padding: 13px;

  border-radius: 9px;

  background: #F28C28;

  color: white;

  font-weight: 800;

  cursor: pointer;
}


/* NAVEGACIÓN */

.lesson-navigation {
  margin-top: 45px;

  padding: 25px 0;

  display: grid;

  grid-template-columns: 1fr auto 1fr;

  align-items: center;

  gap: 20px;
}


.lesson-navigation button {
  border: 1px solid #DCE3ED;

  padding: 12px 18px;

  border-radius: 9px;

  background: white;

  color: #2563EB;

  font-weight: 700;

  cursor: pointer;
}


.lesson-navigation .previous {
  justify-self: start;
}


.lesson-navigation .next {
  justify-self: end;

  background: #2563EB;

  color: white;

  border-color: #2563EB;
}


.lesson-navigation span {
  color: #66768a;

  font-size: 13px;
}


/* CELULAR */

@media (max-width: 900px) {

  .lesson-page {
    grid-template-columns: 1fr;
  }

  .lesson-sidebar {
    position: relative;

    height: auto;
  }

  .lesson-main {
    padding: 40px 20px;
  }

  .video-placeholder {
    min-height: 300px;
  }

  .lesson-content-grid {
    grid-template-columns: 1fr;
  }

  .lesson-navigation {
    grid-template-columns: 1fr;
  }

  .lesson-navigation .previous,
  .lesson-navigation .next {
    justify-self: stretch;
  }

  .lesson-navigation div {
    text-align: center;
  }

}

</style>