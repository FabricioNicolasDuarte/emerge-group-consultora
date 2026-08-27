<template>
  <div class="admin-layout">

    <!-- SIDEBAR -->
    <aside class="admin-sidebar">

      <NuxtLink to="/campus" class="admin-logo">
        <img src="/logo.png" alt="EmergeGroup Consultora" />
      </NuxtLink>

      <span class="campus-name">CAMPUS EMERGE</span>
      <span class="admin-label">ADMINISTRACIÓN</span>

      <nav class="admin-nav">

        <a href="#" class="active">
          <span>⌂</span>
          Panel general
        </a>

        <a href="#cursos">
          <span>▣</span>
          Cursos
        </a>

        <a href="#alumnos">
          <span>◉</span>
          Alumnos
        </a>

        <a href="#inscripciones">
          <span>✓</span>
          Inscripciones
        </a>

        <a href="#certificados">
          <span>☆</span>
          Certificados
        </a>

        <a href="#reportes">
          <span>◔</span>
          Reportes
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
    <main class="admin-main">

      <!-- HEADER -->
      <header class="admin-header">

        <div>
          <span class="header-label">PANEL ADMINISTRATIVO</span>

          <h1>Gestión del Campus</h1>

          <p>
            Administrá cursos, participantes y certificaciones desde un único lugar.
          </p>
        </div>

        <div class="admin-avatar">
          A
        </div>

      </header>


      <!-- RESUMEN -->
      <section class="stats-grid">

        <article class="stat-card">
          <span>CURSOS ACTIVOS</span>
          <strong>3</strong>
          <p>Programas publicados</p>
        </article>

        <article class="stat-card">
          <span>ALUMNOS</span>
          <strong>48</strong>
          <p>Participantes registrados</p>
        </article>

        <article class="stat-card">
          <span>INSCRIPCIONES</span>
          <strong>63</strong>
          <p>Inscripciones activas</p>
        </article>

        <article class="stat-card">
          <span>CERTIFICADOS</span>
          <strong>21</strong>
          <p>Certificados emitidos</p>
        </article>

      </section>


      <!-- ACCIONES RÁPIDAS -->
      <section class="quick-section">

        <div class="section-heading">

          <div>
            <span class="section-label">GESTIÓN</span>
            <h2>Acciones rápidas</h2>
          </div>

        </div>

        <div class="quick-grid">

          <button>
            <strong>＋</strong>
            <span>Crear curso</span>
          </button>

          <button>
            <strong>＋</strong>
            <span>Agregar alumno</span>
          </button>

          <button>
            <strong>＋</strong>
            <span>Crear inscripción</span>
          </button>

          <button>
            <strong>✓</strong>
            <span>Emitir certificado</span>
          </button>

        </div>

      </section>


      <!-- CURSOS -->
      <section id="cursos" class="admin-section">

        <div class="section-heading">

          <div>
            <span class="section-label">FORMACIÓN</span>
            <h2>Cursos</h2>
          </div>

          <button class="primary-action">
            + Nuevo curso
          </button>

        </div>


        <div class="table-card">

          <div class="table-row table-header">
            <span>Curso</span>
            <span>Alumnos</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>


          <div class="table-row">

            <div>
              <strong>Liderazgo Sanmartiniano</strong>
              <small>4 módulos</small>
            </div>

            <span>24</span>

            <span class="status active">
              Activo
            </span>

            <button>
              Administrar
            </button>

          </div>


          <div class="table-row">

            <div>
              <strong>Evolución Profesional en Tiempos de IA</strong>
              <small>5 módulos</small>
            </div>

            <span>18</span>

            <span class="status active">
              Activo
            </span>

            <button>
              Administrar
            </button>

          </div>


          <div class="table-row">

            <div>
              <strong>Comunicación y Oratoria</strong>
              <small>4 módulos</small>
            </div>

            <span>6</span>

            <span class="status draft">
              Borrador
            </span>

            <button>
              Administrar
            </button>

          </div>

        </div>

      </section>


      <!-- ALUMNOS -->
      <section id="alumnos" class="admin-section">

        <div class="section-heading">

          <div>
            <span class="section-label">PARTICIPANTES</span>
            <h2>Alumnos recientes</h2>
          </div>

          <button class="primary-action">
            + Agregar alumno
          </button>

        </div>


        <div class="table-card">

          <div class="table-row student-row table-header">
            <span>Alumno</span>
            <span>Curso</span>
            <span>Progreso</span>
            <span>Acciones</span>
          </div>


          <div class="table-row student-row">

            <div>
              <strong>María Pérez</strong>
              <small>maria@correo.com</small>
            </div>

            <span>
              Liderazgo Sanmartiniano
            </span>

            <strong class="percentage">
              65%
            </strong>

            <button>
              Ver perfil
            </button>

          </div>


          <div class="table-row student-row">

            <div>
              <strong>Juan Fernández</strong>
              <small>juan@correo.com</small>
            </div>

            <span>
              Evolución Profesional en IA
            </span>

            <strong class="percentage">
              30%
            </strong>

            <button>
              Ver perfil
            </button>

          </div>


          <div class="table-row student-row">

            <div>
              <strong>Ana González</strong>
              <small>ana@correo.com</small>
            </div>

            <span>
              Comunicación y Oratoria
            </span>

            <strong class="percentage">
              0%
            </strong>

            <button>
              Ver perfil
            </button>

          </div>

        </div>

      </section>


      <!-- INSCRIPCIONES -->
      <section id="inscripciones" class="simple-section">

        <div>
          <span class="section-label">INSCRIPCIONES</span>

          <h2>Gestión de inscripciones</h2>

          <p>
            Administrá altas, bajas y asignación de participantes
            a los diferentes programas de formación.
          </p>
        </div>

        <button>
          Gestionar inscripciones →
        </button>

      </section>


      <!-- CERTIFICADOS -->
      <section id="certificados" class="simple-section">

        <div>
          <span class="section-label">CERTIFICACIONES</span>

          <h2>Certificados</h2>

          <p>
            Emití y administrá certificados de los participantes
            que hayan completado sus programas.
          </p>
        </div>

        <button>
          Gestionar certificados →
        </button>

      </section>


      <!-- REPORTES -->
      <section id="reportes" class="simple-section report-section">

        <div>
          <span class="section-label">INFORMACIÓN</span>

          <h2>Reportes del Campus</h2>

          <p>
            Visualizá información sobre participación, progreso,
            finalización de cursos y certificaciones.
          </p>
        </div>

        <button>
          Ver reportes →
        </button>

      </section>

    </main>

  </div>
</template>


<style scoped>

.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 270px 1fr;
  font-family: 'Montserrat', sans-serif;
  background: #F6F8FC;
  color: #0D2C54;
}


/* SIDEBAR */

.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;

  padding: 30px 24px;

  background:
    linear-gradient(
      180deg,
      #081B33 0%,
      #0D2C54 100%
    );

  color: white;

  display: flex;
  flex-direction: column;
}


.admin-logo img {
  width: 145px;
  background: white;
  padding: 8px;
  border-radius: 10px;
}


.campus-name {
  display: block;
  color: #F28C28;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 20px 0 6px;
}


.admin-label {
  color: rgba(255,255,255,.55);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 32px;
}


.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}


.admin-nav a {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 13px 14px;

  border-radius: 10px;

  color: rgba(255,255,255,.72);

  text-decoration: none;

  font-weight: 600;
}


.admin-nav a:hover,
.admin-nav a.active {
  background: rgba(255,255,255,.11);
  color: white;
}


.sidebar-bottom {
  margin-top: auto;

  display: flex;
  flex-direction: column;
  gap: 12px;
}


.sidebar-bottom a {
  color: rgba(255,255,255,.7);
  text-decoration: none;
  font-size: 13px;
}


.sidebar-bottom .logout {
  color: #F28C28;
  font-weight: 700;
}


/* MAIN */

.admin-main {
  padding: 45px 5%;
}


.admin-header {
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


.admin-header h1 {
  font-family: 'Cinzel', serif;

  font-size: 40px;

  margin: 8px 0 5px;
}


.admin-header p {
  color: #66768a;
  margin: 0;
}


.admin-avatar {
  width: 50px;
  height: 50px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #2563EB;

  color: white;

  font-size: 20px;
  font-weight: 800;
}


/* ESTADÍSTICAS */

.stats-grid {
  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 18px;

  margin-bottom: 55px;
}


.stat-card {
  padding: 24px;

  background: white;

  border-radius: 18px;

  border: 1px solid rgba(13,44,84,.08);

  box-shadow:
    0 12px 30px rgba(13,44,84,.05);
}


.stat-card > span {
  color: #66768a;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: 1.5px;
}


.stat-card strong {
  display: block;

  font-size: 34px;

  margin: 11px 0 3px;
}


.stat-card p {
  color: #66768a;

  font-size: 13px;

  margin: 0;
}


/* SECCIONES */

.quick-section,
.admin-section {
  margin-bottom: 60px;
}


.section-heading {
  display: flex;

  justify-content: space-between;

  align-items: flex-end;

  gap: 20px;

  margin-bottom: 25px;
}


.section-heading h2,
.simple-section h2 {
  font-family: 'Cinzel', serif;

  font-size: 31px;

  margin: 7px 0 0;
}


/* ACCIONES */

.quick-grid {
  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 18px;
}


.quick-grid button {
  border: none;

  min-height: 120px;

  padding: 22px;

  border-radius: 18px;

  background: white;

  color: #0D2C54;

  box-shadow:
    0 10px 28px rgba(13,44,84,.06);

  cursor: pointer;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: flex-start;

  gap: 12px;

  font-family: inherit;

  font-weight: 700;

  transition: .2s ease;
}


.quick-grid button:hover {
  transform: translateY(-4px);

  box-shadow:
    0 16px 35px rgba(13,44,84,.11);
}


.quick-grid strong {
  color: #F28C28;

  font-size: 25px;
}


/* BOTONES */

.primary-action {
  border: none;

  border-radius: 9px;

  padding: 11px 18px;

  background: #2563EB;

  color: white;

  font-family: inherit;

  font-weight: 700;

  cursor: pointer;
}


/* TABLAS */

.table-card {
  overflow: hidden;

  background: white;

  border-radius: 18px;

  border: 1px solid rgba(13,44,84,.08);
}


.table-row {
  display: grid;

  grid-template-columns: 2fr .6fr .8fr .8fr;

  gap: 18px;

  align-items: center;

  padding: 19px 24px;

  border-bottom: 1px solid #EDF1F6;
}


.table-row:last-child {
  border-bottom: none;
}


.table-header {
  background: #F7F9FC;

  color: #66768a;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 1px;
}


.table-row strong {
  display: block;
}


.table-row small {
  display: block;

  color: #8390A2;

  margin-top: 5px;
}


.table-row button {
  border: 1px solid #DCE3ED;

  border-radius: 8px;

  background: white;

  color: #2563EB;

  padding: 9px 13px;

  font-weight: 700;

  cursor: pointer;
}


.status {
  width: fit-content;

  padding: 6px 10px;

  border-radius: 20px;

  font-size: 11px;

  font-weight: 800;
}


.status.active {
  background: rgba(32,156,99,.12);

  color: #198754;
}


.status.draft {
  background: rgba(242,140,40,.14);

  color: #D87414;
}


.student-row {
  grid-template-columns: 1.3fr 1.6fr .5fr .7fr;
}


.percentage {
  color: #F28C28;
}


/* SECCIONES SIMPLES */

.simple-section {
  margin-bottom: 25px;

  padding: 32px;

  border-radius: 20px;

  background: white;

  border: 1px solid rgba(13,44,84,.08);

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 35px;
}


.simple-section p {
  color: #66768a;

  max-width: 760px;

  line-height: 1.7;
}


.simple-section button {
  flex-shrink: 0;

  border: none;

  padding: 12px 18px;

  border-radius: 9px;

  background: #F28C28;

  color: white;

  font-weight: 800;

  cursor: pointer;
}


.report-section {
  margin-bottom: 40px;
}


/* RESPONSIVE */

@media (max-width: 950px) {

  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: relative;

    height: auto;
  }

  .admin-nav {
    flex-direction: row;

    overflow-x: auto;
  }

  .sidebar-bottom {
    margin-top: 25px;
  }

  .admin-main {
    padding: 35px 20px;
  }

  .stats-grid,
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-card {
    overflow-x: auto;
  }

  .table-row {
    min-width: 750px;
  }

  .simple-section {
    flex-direction: column;

    align-items: flex-start;
  }

}


@media (max-width: 600px) {

  .stats-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }

}

</style>