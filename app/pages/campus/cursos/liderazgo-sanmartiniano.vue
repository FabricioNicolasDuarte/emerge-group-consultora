<template>
  <div class="course-page">

    <!-- SIDEBAR -->
    <aside class="course-sidebar<">

      <NuxtLink to="/campus/panel" class="course-logo">
        <img src="/logo.png" alt="EmergeGroup Consultora" />
      </NuxtLink>

      <span class="campus-name">CAMPUS EMERGE</span>

      <NuxtLink to="/campus/panel" class="back-panel">
        ← Volver a Mi Campus
      </NuxtLink>

      <div class="sidebar-course-info">

        <span>LIDERAZGO</span>

        <h2>Liderazgo Sanmartiniano</h2>

        <p>
          Liderazgo humano, ética, estrategia y construcción de equipos.
        </p>

      </div>

      <div class="sidebar-progress">

        <div class="progress-info">
          <span>Tu progreso</span>
          <strong>65%</strong>
        </div>

        <div class="progress-bar">
          <div class="progress" style="width: 65%"></div>
        </div>

      </div>

    </aside>


    <!-- CONTENIDO -->
    <main class="course-main">

      <!-- CABECERA -->
      <header class="course-header">

        <div>

          <span class="header-label">
            PROGRAMA DE FORMACIÓN
          </span>

          <h1>Liderazgo Sanmartiniano</h1>

          <p>
            Un recorrido para desarrollar liderazgos actuales desde la
            dimensión humana, ética y estratégica de José de San Martín.
          </p>

        </div>

      </header>


      <!-- CONTINUAR -->
      <section class="continue-learning">

        <div>

          <span class="section-label">
            CONTINUAR APRENDIENDO
          </span>

          <h2>Tu próxima clase</h2>

          <h3>
            Módulo 3 · Comunicación, confianza y construcción de equipos
          </h3>

          <p>
            Exploramos cómo el liderazgo se construye desde la confianza,
            la conversación y la capacidad de coordinar acciones con otros.
          </p>

        </div>

        <NuxtLink
            to="/campus/cursos/liderazgo-sanmartiniano/clase-1"
            class="continue-button"
        >   
            Continuar clase →
        </NuxtLink>

      </section>


      <!-- CONTENIDO DEL CURSO -->
      <section class="modules-section">

        <div class="section-heading">

          <span class="section-label">
            CONTENIDO DEL PROGRAMA
          </span>

          <h2>Módulos y clases</h2>

        </div>


        <!-- MODULO 1 -->
        <article class="module-card completed">

          <div class="module-header">

            <div class="module-number">
              01
            </div>

            <div>
              <span>MÓDULO COMPLETADO</span>
              <h3>Liderazgo, propósito y legado</h3>
            </div>

            <div class="module-status">
              ✓
            </div>

          </div>

          <div class="lessons">

            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>Bienvenida al programa</strong>
                <small>Video · 8 min</small>
              </div>

              <button>Ver</button>
            </div>


            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>¿Qué significa liderar?</strong>
                <small>Clase · 18 min</small>
              </div>

              <button>Ver</button>
            </div>


            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>Actividad de reflexión</strong>
                <small>Actividad práctica</small>
              </div>

              <button>Revisar</button>
            </div>

          </div>

        </article>


        <!-- MODULO 2 -->
        <article class="module-card completed">

          <div class="module-header">

            <div class="module-number">
              02
            </div>

            <div>
              <span>MÓDULO COMPLETADO</span>
              <h3>Estrategia y toma de decisiones</h3>
            </div>

            <div class="module-status">
              ✓
            </div>

          </div>

          <div class="lessons">

            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>Visión estratégica</strong>
                <small>Video · 22 min</small>
              </div>

              <button>Ver</button>
            </div>


            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>Decidir en contextos desafiantes</strong>
                <small>Material PDF</small>
              </div>

              <button>Abrir</button>
            </div>


            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>Ejercicio de aplicación</strong>
                <small>Actividad práctica</small>
              </div>

              <button>Revisar</button>
            </div>

          </div>

        </article>


        <!-- MODULO 3 -->
        <article class="module-card current">

          <div class="module-header">

            <div class="module-number">
              03
            </div>

            <div>
              <span>EN CURSO</span>
              <h3>Comunicación, confianza y equipos</h3>
            </div>

            <div class="module-status">
              65%
            </div>

          </div>

          <div class="lessons">

            <div class="lesson completed">
              <span class="lesson-icon">✓</span>

              <div>
                <strong>La confianza como base del liderazgo</strong>
                <small>Video · 16 min</small>
              </div>

              <button>Ver</button>
            </div>


            <div class="lesson current">
              <span class="lesson-icon">▶</span>

              <div>
                <strong>Conversaciones que construyen equipos</strong>
                <small>Clase · 24 min</small>
              </div>

              <button class="primary">
                Continuar
              </button>
            </div>


            <div class="lesson locked">
              <span class="lesson-icon">○</span>

              <div>
                <strong>Coordinación y compromiso</strong>
                <small>Actividad práctica</small>
              </div>

              <button disabled>
                Pendiente
              </button>
            </div>

          </div>

        </article>


        <!-- MODULO 4 -->
        <article class="module-card locked">

          <div class="module-header">

            <div class="module-number">
              04
            </div>

            <div>
              <span>PRÓXIMAMENTE</span>
              <h3>Integración y liderazgo en acción</h3>
            </div>

            <div class="module-status">
              ○
            </div>

          </div>

          <div class="lessons">

            <div class="lesson locked">
              <span class="lesson-icon">○</span>

              <div>
                <strong>Integración del aprendizaje</strong>
                <small>Clase</small>
              </div>

              <button disabled>
                Bloqueado
              </button>
            </div>


            <div class="lesson locked">
              <span class="lesson-icon">○</span>

              <div>
                <strong>Evaluación final</strong>
                <small>Evaluación</small>
              </div>

              <button disabled>
                Bloqueado
              </button>
            </div>


            <div class="lesson locked">
              <span class="lesson-icon">○</span>

              <div>
                <strong>Certificación</strong>
                <small>Certificado final</small>
              </div>

              <button disabled>
                Bloqueado
              </button>
            </div>

          </div>

        </article>

      </section>

    </main>

  </div>
</template>


<style scoped>

.course-page {
  min-height: 100vh;

  display: grid;
  grid-template-columns: 300px 1fr;

  font-family: 'Montserrat', sans-serif;

  background: #F6F8FC;
  color: #0D2C54;
}


/* SIDEBAR */

.course-sidebar {
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

.course-logo img {
  width: 145px;

  padding: 8px;

  background: white;

  border-radius: 10px;
}

.campus-name {
  display: block;

  color: #F28C28;

  font-size: 12px;
  font-weight: 800;

  letter-spacing: 2px;

  margin: 20px 0 30px;
}

.back-panel {
  display: inline-block;

  margin-bottom: 40px;

  color: rgba(255,255,255,.75);

  text-decoration: none;

  font-size: 13px;
}


.sidebar-course-info > span {
  color: #F28C28;

  font-size: 11px;
  font-weight: 800;

  letter-spacing: 1.5px;
}

.sidebar-course-info h2 {
  font-family: 'Cinzel', serif;

  font-size: 25px;
  line-height: 1.25;

  margin: 12px 0;
}

.sidebar-course-info p {
  color: rgba(255,255,255,.72);

  line-height: 1.6;

  font-size: 14px;
}


.sidebar-progress {
  margin-top: 45px;
}

.progress-info {
  display: flex;

  justify-content: space-between;

  font-size: 13px;

  margin-bottom: 10px;
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

.course-main {
  padding: 50px 6%;
}


.course-header {
  max-width: 950px;

  margin-bottom: 45px;
}

.header-label,
.section-label {
  color: #F28C28;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 2px;
}

.course-header h1 {
  font-family: 'Cinzel', serif;

  font-size: clamp(38px, 5vw, 58px);

  margin: 10px 0 18px;
}

.course-header p {
  max-width: 800px;

  color: #66768a;

  font-size: 18px;

  line-height: 1.8;
}


/* CONTINUAR */

.continue-learning {
  padding: 35px;

  margin-bottom: 60px;

  border-radius: 22px;

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 30px;

  color: white;

  background:
    linear-gradient(
      135deg,
      #0D2C54,
      #2563EB
    );
}

.continue-learning h2 {
  font-family: 'Cinzel', serif;

  font-size: 30px;

  margin: 8px 0 18px;
}

.continue-learning h3 {
  font-size: 20px;

  margin: 0 0 10px;
}

.continue-learning p {
  max-width: 700px;

  color: rgba(255,255,255,.78);

  line-height: 1.6;
}

.continue-button {
  flex-shrink: 0;
  border: none;
  padding: 14px 22px;
  border-radius: 10px;
  background: #F28C28;
  color: white;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: 0.25s ease;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(242, 140, 40, 0.28);
}


/* MÓDULOS */

.section-heading {
  margin-bottom: 30px;
}

.section-heading h2 {
  font-family: 'Cinzel', serif;

  font-size: 34px;

  margin: 8px 0 0;
}


.module-card {
  background: white;

  border-radius: 20px;

  border: 1px solid rgba(13,44,84,.08);

  margin-bottom: 24px;

  overflow: hidden;

  box-shadow:
    0 12px 30px rgba(13,44,84,.05);
}


.module-header {
  padding: 25px 28px;

  display: grid;

  grid-template-columns: auto 1fr auto;

  align-items: center;

  gap: 18px;

  background: #F9FAFD;
}


.module-number {
  width: 46px;
  height: 46px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  background: rgba(242,140,40,.14);

  color: #F28C28;

  font-weight: 900;
}


.module-header span {
  color: #66768a;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: 1.5px;
}


.module-header h3 {
  margin: 5px 0 0;

  font-size: 19px;
}


.module-status {
  color: #F28C28;

  font-weight: 900;
}


.module-card.current {
  border: 2px solid rgba(37,99,235,.25);
}


.module-card.locked {
  opacity: .7;
}


/* CLASES */

.lessons {
  padding: 5px 28px;
}


.lesson {
  padding: 18px 0;

  display: grid;

  grid-template-columns: auto 1fr auto;

  align-items: center;

  gap: 15px;

  border-bottom: 1px solid #EDF1F6;
}


.lesson:last-child {
  border-bottom: none;
}


.lesson-icon {
  width: 34px;
  height: 34px;

  display: flex;

  justify-content: center;

  align-items: center;

  border-radius: 50%;

  background: #F6F8FC;

  color: #2563EB;

  font-weight: 900;
}


.lesson.completed .lesson-icon {
  background: rgba(242,140,40,.14);

  color: #F28C28;
}


.lesson.current .lesson-icon {
  background: #2563EB;

  color: white;
}


.lesson strong {
  display: block;

  font-size: 14px;

  margin-bottom: 5px;
}


.lesson small {
  color: #8390A2;
}


.lesson button {
  border: 1px solid #DCE3ED;

  background: white;

  color: #2563EB;

  padding: 9px 15px;

  border-radius: 8px;

  font-weight: 700;

  cursor: pointer;
}


.lesson button.primary {
  background: #F28C28;

  border-color: #F28C28;

  color: white;
}


.lesson button:disabled {
  color: #AAB3C0;

  cursor: default;
}


/* CELULAR */

@media (max-width: 850px) {

  .course-page {
    grid-template-columns: 1fr;
  }

  .course-sidebar {
    position: relative;

    height: auto;
  }

  .course-main {
    padding: 40px 20px;
  }

  .continue-learning {
    flex-direction: column;

    align-items: flex-start;
  }

  .continue-button {
  width: 100%;
  text-align: center;
  box-sizing: border-box;
  }

  .module-header {
    grid-template-columns: auto 1fr;
  }

  .module-status {
    grid-column: 2;
  }

  .lesson {
    grid-template-columns: auto 1fr;
  }

  .lesson button {
    grid-column: 1 / -1;

    width: 100%;
  }

}

</style>