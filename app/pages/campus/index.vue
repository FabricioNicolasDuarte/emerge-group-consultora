<template>
  <div class="campus-page">

        <!-- CABECERA CAMPUS -->
    <header class="campus-header">
      <div class="campus-header-container">

        <!-- LOGO -->
        <NuxtLink to="/" class="campus-logo">
          <img src="/logo.png" alt="EmergeGroup Consultora" />
        </NuxtLink>

        <!-- MENÚ -->
        <nav class="campus-nav">
          <NuxtLink to="/">Inicio</NuxtLink>

          <a href="#programas">Programas</a>

          <a href="#sobre-campus">Sobre el Campus</a>

          <NuxtLink to="/campus/login" class="campus-login">
              Ingresar
            </NuxtLink>
        </nav>

      </div>
    </header>

    <!-- HERO CAMPUS -->
    <section class="campus-hero">
      <div class="campus-container">

        <span class="campus-label">EMERGEGROUP CONSULTORA</span>

        <h1>CAMPUS <strong>EMERGE</strong></h1>

        <h2>Formación para transformar conocimiento en acción.</h2>

        <p>
          Un espacio de aprendizaje diseñado para personas, equipos y
          organizaciones que buscan desarrollar nuevas competencias,
          potenciar su liderazgo y prepararse para los desafíos del presente.
        </p>

        <div class="campus-actions">
          <a href="#programas" class="btn-primary">
            Explorar programas
          </a>

          <NuxtLink to="/campus/login" class="btn-secondary">
              Ingresar al Campus
            </NuxtLink>
    
        </div>

      </div>
    </section>

<!-- FIN HERO CAMPUS -->


<!-- SOBRE EL CAMPUS -->
<section id="sobre-campus" class="sobre-campus">
  <div class="campus-container">

    <span class="section-label">SOBRE EL CAMPUS</span>

    <h2>Aprender para transformar</h2>

    <p class="sobre-campus-intro">
      Campus Emerge es el espacio de formación de EmergeGroup Consultora,
      creado para acompañar a personas, equipos y organizaciones en el
      desarrollo de competencias que puedan convertirse en acciones,
      decisiones y resultados.
    </p>

    <div class="sobre-campus-grid">

      <div class="sobre-card">
        <span>01</span>
        <h3>Formación aplicada</h3>
        <p>
          Propuestas diseñadas para llevar el aprendizaje a situaciones
          concretas del ámbito profesional y organizacional.
        </p>
      </div>

      <div class="sobre-card">
        <span>02</span>
        <h3>Desarrollo humano</h3>
        <p>
          Integramos liderazgo, comunicación, emociones y transformación
          personal como parte del aprendizaje.
        </p>
      </div>

      <div class="sobre-card">
        <span>03</span>
        <h3>Innovación</h3>
        <p>
          Incorporamos nuevas tecnologías y herramientas para responder
          a los desafíos del presente y del futuro.
        </p>
      </div>

    </div>

  </div>
</section>


<!-- PRESENTACIÓN -->
<section class="campus-intro">
  <div class="campus-container">

    <span class="section-label">APRENDER · TRANSFORMAR · EMERGER</span>

    <h2>Una nueva forma de aprender</h2>

    <p>
      Campus Emerge integra formación, desarrollo humano e innovación
      para generar experiencias de aprendizaje que puedan convertirse
      en acciones concretas y resultados.
    </p>

  </div>
</section>


<!-- PROGRAMAS -->
<section id="programas" class="programas">
  <div class="campus-container">

    <span class="section-label">NUESTRAS PROPUESTAS</span>

    <h2>Programas de formación</h2>

    <div class="programas-grid">

      <!-- CURSO 1 -->
      <article class="programa-card curso-card">

        <div class="curso-etiqueta">
          Liderazgo
        </div>

        <h3>Liderazgo Sanmartiniano</h3>

        <p class="curso-descripcion">
          Una propuesta para desarrollar liderazgos actuales desde la dimensión
          humana, ética y estratégica de José de San Martín.
        </p>

        <div class="curso-info">
          <span>🎯 Liderazgo y equipos</span>
          <span>👥 Organizaciones y profesionales</span>
        </div>

        <a href="#" class="curso-link">
          Ver programa →
        </a>

      </article>


      <!-- CURSO 2 -->
      <article class="programa-card curso-card">

        <div class="curso-etiqueta">
          Innovación
        </div>

        <h3>Evolución Profesional en Tiempos de IA</h3>

        <p class="curso-descripcion">
          Un espacio para comprender cómo integrar inteligencia artificial,
          nuevas competencias y desarrollo humano en el mundo profesional.
        </p>

        <div class="curso-info">
          <span>🤖 IA y desarrollo profesional</span>
          <span>🌱 Tecnología con mirada humana</span>
        </div>

        <a href="#" class="curso-link">
          Ver programa →
        </a>

      </article>


      <!-- CURSO 3 -->
      <article class="programa-card curso-card">

        <div class="curso-etiqueta">
          Comunicación
        </div>

        <h3>Comunicación y Oratoria</h3>

        <p class="curso-descripcion">
          Herramientas para comunicar con claridad, presencia e impacto,
          fortaleciendo la confianza y la capacidad de influir en distintas audiencias.
        </p>

        <div class="curso-info">
          <span>🎤 Comunicación efectiva</span>
          <span>💬 Oratoria y presencia profesional</span>
        </div>

        <a href="#" class="curso-link">
          Ver programa →
        </a>

      </article>

    </div>

  </div>
</section>


<!-- EXPERIENCIA DE APRENDIZAJE -->
<section class="experiencia-campus">
  <div class="campus-container">

    <span class="section-label">NUESTRA EXPERIENCIA FORMATIVA</span>

    <h2>Aprender, aplicar y transformar</h2>

    <p class="experiencia-intro">
      Diseñamos experiencias de aprendizaje que combinan contenidos,
      reflexión, práctica y acompañamiento para que cada conocimiento
      pueda convertirse en una herramienta concreta.
    </p>

    <div class="experiencia-grid">

      <div class="experiencia-card">
        <span>01</span>
        <h3>Contenidos claros</h3>
        <p>
          Materiales organizados por módulos para facilitar una experiencia
          de aprendizaje progresiva y accesible.
        </p>
      </div>

      <div class="experiencia-card">
        <span>02</span>
        <h3>Aprendizaje aplicado</h3>
        <p>
          Actividades, ejercicios y situaciones prácticas para trasladar
          lo aprendido al ámbito personal y profesional.
        </p>
      </div>

      <div class="experiencia-card">
        <span>03</span>
        <h3>Acompañamiento</h3>
        <p>
          Espacios de seguimiento que favorecen la reflexión, las preguntas
          y el desarrollo de nuevas competencias.
        </p>
      </div>

      <div class="experiencia-card">
        <span>04</span>
        <h3>Certificación</h3>
        <p>
          Al finalizar cada propuesta formativa, los participantes podrán
          acceder a su certificación correspondiente.
        </p>
      </div>

    </div>

  </div>
</section>

<!-- PARA QUIÉN ES EL CAMPUS -->
<section class="publico-campus">
  <div class="campus-container">

    <span class="section-label">¿PARA QUIÉN ES?</span>

    <h2>Un espacio para quienes quieren seguir creciendo</h2>

    <p class="publico-intro">
      Campus Emerge está pensado para personas y organizaciones que buscan
      aprender, actualizarse y transformar conocimiento en nuevas formas de actuar.
    </p>

    <div class="publico-grid">

      <div class="publico-card">
        <span>01</span>
        <h3>Profesionales</h3>
        <p>
          Personas que quieren fortalecer competencias, ampliar perspectivas
          y prepararse para nuevos desafíos laborales.
        </p>
      </div>

      <div class="publico-card">
        <span>02</span>
        <h3>Líderes y equipos</h3>
        <p>
          Equipos que buscan mejorar su comunicación, coordinación,
          liderazgo y capacidad de generar resultados.
        </p>
      </div>

      <div class="publico-card">
        <span>03</span>
        <h3>Organizaciones</h3>
        <p>
          Empresas e instituciones que necesitan procesos de formación
          adaptados a sus objetivos y a su realidad.
        </p>
      </div>

      <div class="publico-card">
        <span>04</span>
        <h3>Educadores</h3>
        <p>
          Docentes y profesionales de la educación interesados en liderazgo,
          comunicación, bienestar e innovación educativa.
        </p>
      </div>

    </div>

  </div>
</section>

<!-- CTA FINAL CAMPUS -->
<section class="campus-cta">
  <div class="campus-container campus-cta-box">

    <span class="section-label">TU PRÓXIMO PASO</span>

    <h2>Tu próximo aprendizaje puede empezar acá.</h2>

    <p>
      Explorá nuestras propuestas de formación o ingresá al Campus
      para continuar tu recorrido de aprendizaje.
    </p>

    <div class="campus-cta-actions">

      <a href="#programas" class="cta-primary">
        Explorar programas
      </a>

      <a href="#" class="cta-secondary">
        Ingresar al Campus
      </a>

    </div>

  </div>
</section>

  </div>
</template>

<style scoped>

/* ==================================
   CABECERA CAMPUS
================================== */

.campus-header {
  width: 100%;
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid rgba(13, 44, 84, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.campus-header-container {
  width: min(1240px, 94%);
  min-height: 76px;
  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* LOGO */

.campus-logo {
  display: flex;
  align-items: center;
}

.campus-logo img {
  height: 66px;
  width: auto;
  display: block;
}

/* MENÚ */

.campus-nav {
  display: flex;
  align-items: center;
  gap: 30px;
}

.campus-nav a {
  color: #0D2C54;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: 0.25s ease;
}

.campus-nav a:hover {
  color: #F28C28;
}

/* BOTÓN INGRESAR */

.campus-nav .campus-login {
  background: #2563EB;
  color: white;
  padding: 11px 20px;
  border-radius: 9px;
}

.campus-nav .campus-login:hover {
  background: #F28C28;
  color: white;
}

.campus-page {
  font-family: 'Montserrat', sans-serif;
  color: #0D2C54;
}

.campus-container {
  width: min(1180px, 90%);
  margin: 0 auto;
}

/* HERO */

.campus-hero {
  min-height: calc(100vh - 76px);
  display: flex;
  align-items: center;
  background:
    linear-gradient(
      135deg,
      #0D2C54 0%,
      #164B8A 55%,
      #2563EB 100%
    );
  color: white;
  padding: 90px 0;
}

.campus-hero .campus-container {
  max-width: 950px;
}

.campus-label,
.section-label {
  display: inline-block;
  color: #F28C28;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 18px;
}

.campus-hero h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(48px, 7vw, 78px);
  line-height: 1;
  margin: 0 0 22px;
  font-weight: 400;
}

.campus-hero h1 strong {
  color: #F28C28;
}

.campus-hero h2 {
  font-size: clamp(24px, 3vw, 38px);
  max-width: 780px;
  margin-bottom: 22px;
}

.campus-hero p {
  max-width: 720px;
  font-size: 18px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
}

.campus-actions {
  display: flex;
  gap: 16px;
  margin-top: 35px;
}

.btn-primary,
.btn-secondary {
  padding: 14px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
}

.btn-primary {
  background: #F28C28;
  color: white;
}

.btn-secondary {
  border: 1px solid rgba(255,255,255,.7);
  color: white;
}

/* INTRO */

.campus-intro {
  padding: 100px 0;
  text-align: center;
}

.campus-intro h2,
.programas h2 {
  font-family: 'Cinzel', serif;
  font-size: 42px;
  margin: 0 0 20px;
}

.campus-intro p {
  max-width: 750px;
  margin: auto;
  line-height: 1.8;
  color: #5f6f82;
  font-size: 18px;
}

/* PROGRAMAS */

.programas {
  background: #F6F8FC;
  padding: 100px 0;
}

.programas-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-top: 45px;
}

.programa-card {
  background: white;
  padding: 35px;
  border-radius: 18px;
  box-shadow: 0 12px 35px rgba(13,44,84,.08);
}

.programa-card > span {
  color: #F28C28;
  font-weight: 800;
}

.programa-card h3 {
  font-size: 21px;
  margin: 18px 0 14px;
}

.programa-card p {
  color: #66768a;
  line-height: 1.7;
}

/* =========================
   SOBRE EL CAMPUS
========================= */

.sobre-campus {
  padding: 35px 0 100px;
  background: #ffffff;
  scroll-margin-top: 90px;
}

.sobre-campus h2 {
  font-family: 'Cinzel', serif;
  font-size: 42px;
  color: #0D2C54;
  margin: 0 0 22px;
}

.sobre-campus-intro {
  max-width: 850px;
  font-size: 18px;
  line-height: 1.8;
  color: #5f6f82;
  margin-bottom: 45px;
}

.sobre-campus-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.sobre-card {
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #f5f8fd 100%
  );

  padding: 32px;
  border-radius: 20px;

  border: 1px solid rgba(13, 44, 84, 0.10);

  box-shadow:
    0 14px 35px rgba(13, 44, 84, 0.08);

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.sobre-card:hover {
  transform: translateY(-7px);

  box-shadow:
    0 22px 45px rgba(13, 44, 84, 0.14);
}

.sobre-card > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  border-radius: 50%;

  background: rgba(242, 140, 40, 0.13);
  color: #F28C28;

  font-weight: 800;
  margin-bottom: 18px;
}

.sobre-card h3 {
  color: #0D2C54;
  font-size: 20px;
  margin: 0 0 14px;
}

.sobre-card p {
  color: #66768a;
  line-height: 1.7;
  margin: 0;
}

/* =========================
   EXPERIENCIA DE APRENDIZAJE
========================= */

.experiencia-campus {
  padding: 100px 0;
  background: #ffffff;
}

.experiencia-campus h2 {
  font-family: 'Cinzel', serif;
  font-size: 42px;
  color: #0D2C54;
  margin: 0 0 22px;
}

.experiencia-intro {
  max-width: 820px;
  color: #66768a;
  font-size: 18px;
  line-height: 1.8;
  margin-bottom: 45px;
}

.experiencia-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

.experiencia-card {
  padding: 30px;
  border-radius: 20px;
  background: #F6F8FC;
  border: 1px solid rgba(13, 44, 84, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.experiencia-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 20px 40px rgba(13, 44, 84, 0.12);
}

.experiencia-card > span {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(242, 140, 40, 0.13);
  color: #F28C28;
  font-weight: 800;
  margin-bottom: 18px;
}

.experiencia-card h3 {
  color: #0D2C54;
  font-size: 19px;
  margin: 0 0 12px;
}

.experiencia-card p {
  color: #66768a;
  line-height: 1.7;
  margin: 0;
}

/* =========================
   PARA QUIÉN ES EL CAMPUS
========================= */

.publico-campus {
  padding: 100px 0;
  background: linear-gradient(
    135deg,
    #0D2C54 0%,
    #164B8A 55%,
    #2563EB 100%
  );
  color: white;
}

.publico-campus .section-label {
  color: #F28C28;
}

.publico-campus h2 {
  font-family: 'Cinzel', serif;
  font-size: 42px;
  color: white;
  margin: 0 0 22px;
  max-width: 850px;
}

.publico-intro {
  max-width: 820px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 18px;
  line-height: 1.8;
  margin-bottom: 45px;
}

.publico-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

.publico-card {
  padding: 30px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
}

.publico-card > span {
  color: #F28C28;
  font-weight: 800;
}

.publico-card h3 {
  color: white;
  margin: 16px 0 12px;
}

.publico-card p {
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
  margin: 0;
}

/* =========================
   CTA FINAL CAMPUS
========================= */

.campus-cta {
  padding: 110px 0;
  background: #F6F8FC;
}

.campus-cta-box {
  text-align: center;
  max-width: 900px;
  padding: 65px 50px;
  border-radius: 28px;

  background: white;

  border: 1px solid rgba(13, 44, 84, 0.08);

  box-shadow:
    0 22px 55px rgba(13, 44, 84, 0.10);
}

.campus-cta h2 {
  font-family: 'Cinzel', serif;
  font-size: 42px;
  color: #0D2C54;
  max-width: 760px;
  margin: 0 auto 22px;
}

.campus-cta p {
  max-width: 700px;
  margin: 0 auto;
  color: #66768a;
  font-size: 18px;
  line-height: 1.8;
}

.campus-cta-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 35px;
}

.cta-primary,
.cta-secondary {
  padding: 14px 25px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  transition: 0.25s ease;
}

.cta-primary {
  background: #F28C28;
  color: white;
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(242, 140, 40, 0.28);
}

.cta-secondary {
  background: #2563EB;
  color: white;
}

.cta-secondary:hover {
  background: #164B8A;
  transform: translateY(-2px);
}

/* CELULAR */

@media (max-width: 768px) {

  .campus-hero {
    min-height: auto;
    padding: 70px 0 90px;
  }

  .experiencia-campus {
  padding: 70px 0;
}

.experiencia-campus h2 {
  font-size: 30px;
}

.experiencia-grid {
  grid-template-columns: 1fr;
}

.publico-campus {
  padding: 70px 0;
}

.publico-campus h2 {
  font-size: 30px;
}

.publico-grid {
  grid-template-columns: 1fr;
}

.campus-cta {
  padding: 70px 0;
}

.campus-cta-box {
  padding: 45px 22px;
}

.campus-cta h2 {
  font-size: 30px;
}

.campus-cta-actions {
  flex-direction: column;
}

.cta-primary,
.cta-secondary {
  text-align: center;
}

  /* SOBRE EL CAMPUS - CELULAR */

  .sobre-campus {
    padding: 70px 0;
    scroll-margin-top: 140px;
  }

  .sobre-campus h2 {
    font-size: 30px;
  }

  .sobre-campus-grid {
    grid-template-columns: 1fr;
  }

  .campus-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    text-align: center;
  }

  .programas-grid {
    grid-template-columns: 1fr;
  }

  .campus-intro,
  .programas {
    padding: 70px 0;
  }

}

</style>
