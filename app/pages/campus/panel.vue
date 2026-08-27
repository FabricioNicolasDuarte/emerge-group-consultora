<template>
  <div class="student-layout">

    <!-- SIDEBAR -->
    <aside class="sidebar">

      <NuxtLink to="/campus" class="sidebar-logo">
        <img src="/logo.png" alt="EmergeGroup Consultora" />
      </NuxtLink>

      <span class="campus-name">CAMPUS EMERGE</span>

      <nav class="sidebar-nav">

        <a href="#" class="active">
          <span>⌂</span>
          Inicio
        </a>

        <a href="#mis-cursos">
          <span>▣</span>
          Mis cursos
        </a>

        <a href="#progreso">
          <span>◔</span>
          Mi progreso
        </a>

        <a href="#certificados">
          <span>✓</span>
          Certificados
        </a>

      </nav>

      <div class="sidebar-bottom">

        <NuxtLink to="/campus">
          ← Volver al Campus
        </NuxtLink>

        <NuxtLink to="/campus/login" class="logout">
          Cerrar sesión
        </NuxtLink>

      </div>

    </aside>


    <!-- CONTENIDO -->
    <main class="student-main">

      <!-- CABECERA -->
      <header class="student-header">

        <div>
          <span class="header-label">MI CAMPUS</span>

          <h1>Hola, María 👋</h1>

          <p>
            Continuá tu recorrido de aprendizaje.
          </p>
        </div>

        <div class="student-avatar">
          M
        </div>

      </header>


      <!-- RESUMEN -->
      <section class="summary-grid">

        <article class="summary-card">
          <span>CURSOS ACTIVOS</span>
          <strong>3</strong>
          <p>Programas en curso</p>
        </article>

        <article class="summary-card">
          <span>PROGRESO GENERAL</span>
          <strong>32%</strong>
          <p>De tu formación completada</p>
        </article>

        <article class="summary-card">
          <span>CERTIFICADOS</span>
          <strong>1</strong>
          <p>Certificación obtenida</p>
        </article>

      </section>


      <!-- CONTINUAR -->
      <section class="continue-section">

        <div class="section-heading">
          <div>
            <span class="section-label">CONTINUAR APRENDIENDO</span>
            <h2>Tu próxima clase</h2>
          </div>

          <a href="#mis-cursos">Ver mis cursos →</a>
        </div>

        <article class="continue-card">

          <div class="continue-content">

            <span class="course-category">
              Liderazgo
            </span>

            <h3>Liderazgo Sanmartiniano</h3>

            <p>
              Módulo 3 · Comunicación, confianza y construcción de equipos.
            </p>

            <div class="progress-bar">
              <div class="progress" style="width: 65%"></div>
            </div>

            <span class="progress-text">
              65% completado
            </span>

          </div>

          <button>
            Continuar curso →
          </button>

        </article>

      </section>


      <!-- MIS CURSOS -->
      <section id="mis-cursos" class="courses-section">

        <div class="section-heading">

          <div>
            <span class="section-label">MI FORMACIÓN</span>
            <h2>Mis cursos</h2>
          </div>

        </div>

        <div class="courses-grid">

          <article class="course-card">

            <span class="course-category">Liderazgo</span>

            <h3>Liderazgo Sanmartiniano</h3>

            <p>
              Liderazgo humano, ética, estrategia y construcción de equipos.
            </p>

            <div class="progress-bar">
              <div class="progress" style="width: 65%"></div>
            </div>

            <div class="course-footer">
              <span>65%</span>
              <a href="#">Continuar →</a>
            </div>

          </article>


          <article class="course-card">

            <span class="course-category">Innovación</span>

            <h3>Evolución Profesional en Tiempos de IA</h3>

            <p>
              Tecnología, competencias profesionales y desarrollo humano.
            </p>

            <div class="progress-bar">
              <div class="progress" style="width: 30%"></div>
            </div>

            <div class="course-footer">
              <span>30%</span>
              <a href="#">Continuar →</a>
            </div>

          </article>


          <article class="course-card">

            <span class="course-category">Comunicación</span>

            <h3>Comunicación y Oratoria</h3>

            <p>
              Presencia, confianza, claridad e impacto comunicacional.
            </p>

            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>

            <div class="course-footer">
              <span>0%</span>
              <a href="#">Comenzar →</a>
            </div>

          </article>

        </div>

      </section>


      <!-- PROGRESO -->
      <section id="progreso" class="info-section">

        <div>
          <span class="section-label">TU EVOLUCIÓN</span>
          <h2>Mi progreso</h2>
          <p>
            Cada avance construye tu recorrido. Acá vas a poder visualizar
            módulos completados, actividades realizadas y nuevos desafíos.
          </p>
        </div>

        <div class="progress-circle">
          <strong>32%</strong>
          <span>Progreso general</span>
        </div>

      </section>


      <!-- CERTIFICADOS -->
      <section id="certificados" class="certificate-section">

        <span class="section-label">LOGROS</span>

        <h2>Mis certificados</h2>

        <div class="certificate-card">

          <div class="certificate-icon">
            ✓
          </div>

          <div>
            <h3>Trabajo en Equipo</h3>
            <p>
              Certificación obtenida · Campus Emerge
            </p>
          </div>

          <button>
            Ver certificado
          </button>

        </div>

      </section>

    </main>

  </div>
</template>


<style scoped>

.student-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  font-family: 'Montserrat', sans-serif;
  background: #F6F8FC;
  color: #0D2C54;
}


/* SIDEBAR */

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;

  padding: 30px 24px;

  background:
    linear-gradient(
      180deg,
      #0D2C54 0%,
      #164B8A 100%
    );

  color: white;

  display: flex;
  flex-direction: column;
}

.sidebar-logo img {
  width: 145px;
  background: white;
  padding: 8px;
  border-radius: 10px;
}

.campus-name {
  color: #F28C28;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 20px 0 35px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 13px 14px;

  border-radius: 10px;

  color: rgba(255,255,255,.78);
  text-decoration: none;
  font-weight: 600;

  transition: .2s ease;
}

.sidebar-nav a:hover,
.sidebar-nav a.active {
  background: rgba(255,255,255,.12);
  color: white;
}

.sidebar-bottom {
  margin-top: auto;

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-bottom a {
  color: rgba(255,255,255,.75);
  text-decoration: none;
  font-size: 13px;
}

.sidebar-bottom .logout {
  color: #F28C28;
  font-weight: 700;
}


/* CONTENIDO */

.student-main {
  padding: 45px 5%;
  overflow: hidden;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 38px;
}

.header-label,
.section-label {
  color: #F28C28;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.student-header h1 {
  font-family: 'Cinzel', serif;
  font-size: 40px;
  margin: 8px 0 5px;
}

.student-header p {
  margin: 0;
  color: #66768a;
}

.student-avatar {
  width: 50px;
  height: 50px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #2563EB;
  color: white;

  font-size: 20px;
  font-weight: 800;
}


/* RESUMEN */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  margin-bottom: 55px;
}

.summary-card {
  background: white;
  padding: 25px;

  border-radius: 18px;

  border: 1px solid rgba(13,44,84,.08);

  box-shadow:
    0 12px 30px rgba(13,44,84,.06);
}

.summary-card > span {
  color: #66768a;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.summary-card strong {
  display: block;

  font-size: 36px;
  color: #0D2C54;

  margin: 12px 0 4px;
}

.summary-card p {
  margin: 0;
  color: #66768a;
  font-size: 14px;
}


/* TÍTULOS */

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  margin-bottom: 25px;
}

.section-heading h2,
.info-section h2,
.certificate-section h2 {
  font-family: 'Cinzel', serif;
  font-size: 32px;
  margin: 8px 0 0;
}

.section-heading > a {
  color: #2563EB;
  text-decoration: none;
  font-weight: 600;
}


/* CONTINUAR */

.continue-section {
  margin-bottom: 60px;
}

.continue-card {
  background:
    linear-gradient(
      135deg,
      #0D2C54,
      #2563EB
    );

  padding: 35px;

  border-radius: 22px;

  color: white;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.continue-content {
  max-width: 650px;
}

.course-category {
  color: #F28C28;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.continue-card h3 {
  font-size: 25px;
  margin: 10px 0 8px;
}

.continue-card p {
  color: rgba(255,255,255,.8);
  line-height: 1.6;
}

.continue-card button {
  border: none;

  background: #F28C28;
  color: white;

  padding: 14px 22px;

  border-radius: 10px;

  font-weight: 800;
  cursor: pointer;
}


/* BARRA PROGRESO */

.progress-bar {
  height: 8px;
  background: rgba(13,44,84,.10);
  border-radius: 20px;
  overflow: hidden;

  margin: 18px 0 8px;
}

.continue-card .progress-bar {
  background: rgba(255,255,255,.20);
}

.progress {
  height: 100%;
  background: #F28C28;
  border-radius: 20px;
}

.progress-text {
  font-size: 12px;
  color: rgba(255,255,255,.7);
}


/* CURSOS */

.courses-section {
  margin-bottom: 60px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.course-card {
  background: white;

  padding: 27px;

  border-radius: 20px;

  border: 1px solid rgba(13,44,84,.08);

  box-shadow:
    0 12px 30px rgba(13,44,84,.06);
}

.course-card h3 {
  font-size: 19px;
  line-height: 1.35;
  margin: 13px 0;
}

.course-card p {
  color: #66768a;
  line-height: 1.6;
  min-height: 76px;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-top: 12px;
}

.course-footer span {
  font-weight: 800;
  color: #F28C28;
}

.course-footer a {
  color: #2563EB;
  text-decoration: none;
  font-weight: 700;
}


/* PROGRESO */

.info-section {
  padding: 35px;

  background: white;

  border-radius: 22px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 35px;

  margin-bottom: 60px;
}

.info-section p {
  color: #66768a;
  line-height: 1.7;
  max-width: 700px;
}

.progress-circle {
  width: 150px;
  height: 150px;

  flex-shrink: 0;

  border-radius: 50%;

  border: 13px solid #F28C28;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-circle strong {
  font-size: 30px;
}

.progress-circle span {
  font-size: 11px;
  color: #66768a;
}


/* CERTIFICADOS */

.certificate-section {
  padding-bottom: 40px;
}

.certificate-card {
  margin-top: 25px;

  background: white;

  border: 1px solid rgba(13,44,84,.08);

  border-radius: 20px;

  padding: 25px;

  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
}

.certificate-icon {
  width: 50px;
  height: 50px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(242,140,40,.15);
  color: #F28C28;

  font-size: 20px;
  font-weight: 900;
}

.certificate-card h3 {
  margin: 0 0 5px;
}

.certificate-card p {
  margin: 0;
  color: #66768a;
}

.certificate-card button {
  border: 1px solid #2563EB;

  background: white;
  color: #2563EB;

  padding: 11px 18px;

  border-radius: 9px;

  font-weight: 700;
  cursor: pointer;
}


/* CELULAR */

@media (max-width: 850px) {

  .student-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    height: auto;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .sidebar-bottom {
    margin-top: 25px;
  }

  .student-main {
    padding: 35px 20px;
  }

  .summary-grid,
  .courses-grid {
    grid-template-columns: 1fr;
  }

  .continue-card,
  .info-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .continue-card button {
    width: 100%;
  }

  .certificate-card {
    grid-template-columns: auto 1fr;
  }

  .certificate-card button {
    grid-column: 1 / -1;
    width: 100%;
  }

}

</style>