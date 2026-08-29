<template>
  <section class="campus-public__section campus-public__section--alt">
    <div class="campus-public__container">
      <div class="campus-public__cta-panel">
        <span class="campus-public__kicker">Tu próximo paso</span>
        <h2 class="campus-public__title">Tu aprendizaje puede empezar acá</h2>
        <p class="campus-public__lead campus-public__cta-lead">
          Explorá las propuestas de formación o ingresá al Campus para continuar tu recorrido.
        </p>
        <div class="campus-public__cta-actions">
          <a href="#programas" class="public-btn public-btn--primary public-btn--lg">
            Explorar programas
          </a>
          <NuxtLink to="/campus/login" class="public-btn public-btn--action public-btn--lg">
            Ingresar al Campus
          </NuxtLink>
        </div>
        <p class="campus-public__cta-hint">
          ¿Primera vez?
          <NuxtLink to="/campus/registro">Creá tu cuenta gratis</NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>
