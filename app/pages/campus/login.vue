<template>
  <div class="login-page">

    <div class="login-container">

      <!-- IDENTIDAD -->
      <section class="login-brand">

        <NuxtLink to="/campus" class="login-logo">
          <img src="/logo.png" alt="EmergeGroup Consultora" />
        </NuxtLink>

        <span class="login-label">CAMPUS EMERGE</span>

        <h1>
          Tu espacio para
          <strong>seguir aprendiendo.</strong>
        </h1>

        <p>
          Accedé a tus programas, materiales, actividades,
          progreso y certificaciones desde un único lugar.
        </p>

        <NuxtLink to="/campus" class="back-campus">
          ← Volver al Campus
        </NuxtLink>

      </section>


      <!-- FORMULARIO -->
      <section class="login-form-wrapper">

        <div class="login-card">

          <span class="form-label">ACCESO AL CAMPUS</span>

          <h2>Bienvenido/a</h2>

          <p class="form-intro">
            Ingresá tus datos para continuar tu recorrido de aprendizaje.
          </p>

          <form @submit.prevent>

            <div class="form-group">
              <label for="email">Correo electrónico</label>

              <input
                id="email"
                type="email"
                placeholder="nombre@correo.com"
              />
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>

              <input
                id="password"
                type="password"
                placeholder="Ingresá tu contraseña"
              />
            </div>

            <div class="form-options">

              <label class="remember">
                <input type="checkbox" />
                Recordarme
              </label>

              <a href="#">
                ¿Olvidaste tu contraseña?
              </a>

            </div>

            <button class="login-button" type="submit">
              Ingresar al Campus
            </button>

          </form>

          <p class="login-help">
            ¿Tenés dificultades para ingresar?
            <a href="#">Contactanos</a>
          </p>

        </div>

      </section>

    </div>

  </div>
</template>


<style scoped>

.login-page {
  min-height: 100vh;
  font-family: 'Montserrat', sans-serif;
  background: #F6F8FC;
}

.login-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}


/* =========================
   LADO IDENTIDAD
========================= */

.login-brand {
  padding: 70px 9%;
  display: flex;
  flex-direction: column;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #0D2C54 0%,
      #164B8A 55%,
      #2563EB 100%
    );

  color: white;
}

.login-logo {
  position: absolute;
  top: 35px;
}

.login-logo img {
  width: 150px;
  height: auto;
}

.login-label {
  color: #F28C28;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.login-brand h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(42px, 5vw, 68px);
  line-height: 1.08;
  max-width: 650px;
  margin: 0 0 25px;
  font-weight: 400;
}

.login-brand h1 strong {
  display: block;
  color: #F28C28;
  font-weight: 500;
}

.login-brand p {
  max-width: 600px;
  font-size: 18px;
  line-height: 1.8;
  color: rgba(255,255,255,.82);
}

.back-campus {
  display: inline-block;
  margin-top: 35px;
  color: white;
  text-decoration: none;
  font-weight: 600;
}


/* =========================
   FORMULARIO
========================= */

.login-form-wrapper {
  padding: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 470px;

  background: white;

  padding: 48px;

  border-radius: 24px;

  border: 1px solid rgba(13,44,84,.08);

  box-shadow:
    0 22px 55px rgba(13,44,84,.10);
}

.form-label {
  color: #F28C28;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.login-card h2 {
  font-family: 'Cinzel', serif;
  color: #0D2C54;
  font-size: 38px;
  margin: 12px 0 10px;
}

.form-intro {
  color: #66768a;
  line-height: 1.6;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #0D2C54;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;

  padding: 14px 15px;

  border-radius: 10px;

  border: 1px solid #DCE3ED;

  font-family: inherit;
  font-size: 15px;

  outline: none;

  transition: .2s ease;
}

.form-group input:focus {
  border-color: #2563EB;

  box-shadow:
    0 0 0 4px rgba(37,99,235,.08);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 15px;

  margin: 5px 0 25px;

  font-size: 13px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #66768a;
}

.form-options a,
.login-help a {
  color: #2563EB;
  text-decoration: none;
  font-weight: 600;
}

.login-button {
  width: 100%;

  border: none;
  border-radius: 10px;

  padding: 15px 20px;

  background: #F28C28;

  color: white;

  font-family: inherit;
  font-size: 16px;
  font-weight: 800;

  cursor: pointer;

  transition: .25s ease;
}

.login-button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 10px 25px rgba(242,140,40,.28);
}

.login-help {
  text-align: center;
  color: #66768a;
  font-size: 13px;
  margin: 25px 0 0;
}


/* =========================
   CELULAR
========================= */

@media (max-width: 768px) {

  .login-container {
    grid-template-columns: 1fr;
  }

  .login-brand {
    min-height: auto;
    padding: 100px 30px 60px;
  }

  .login-logo {
    top: 25px;
  }

  .login-logo img {
    width: 120px;
  }

  .login-brand h1 {
    font-size: 38px;
  }

  .login-form-wrapper {
    padding: 45px 20px;
  }

  .login-card {
    padding: 32px 24px;
  }

  .login-card h2 {
    font-size: 32px;
  }

  .form-options {
    align-items: flex-start;
    flex-direction: column;
  }

}

</style>