<script setup lang="ts">
const admin = useAdminCampusData()
</script>

<template>
  <div>
    <div
      v-if="admin.showCourseForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-new-course-title"
      @click.self="admin.showCourseForm = false"
    >
      <div class="modal-card">
        <h2 id="modal-new-course-title">Nuevo curso</h2>
        <form @submit.prevent="admin.onCreateCourse">
          <label for="new-course-title">Título</label>
          <input id="new-course-title" v-model="admin.newCourse.title" required placeholder="Nombre del programa">
          <label for="new-course-category">Categoría</label>
          <input id="new-course-category" v-model="admin.newCourse.category" placeholder="Ej: Liderazgo">
          <label for="new-course-description">Descripción</label>
          <textarea id="new-course-description" v-model="admin.newCourse.description" rows="4" placeholder="Breve descripción" />
          <label for="new-course-status">Estado</label>
          <select id="new-course-status" v-model="admin.newCourse.status">
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
          <label for="new-course-price">Precio (ARS, 0 = gratuito)</label>
          <input id="new-course-price" v-model.number="admin.newCourse.price_amount" type="number" min="0" step="1">
          <p class="modal-section-title">Cohorte e inscripción (opcional)</p>
          <label for="new-course-cohort-start">Inicio de cohorte</label>
          <input id="new-course-cohort-start" v-model="admin.newCourse.cohort_start_date" type="date">
          <label for="new-course-cohort-end">Fin de cohorte</label>
          <input id="new-course-cohort-end" v-model="admin.newCourse.cohort_end_date" type="date">
          <label for="new-course-cap">Cupo máximo (vacío = ilimitado)</label>
          <input id="new-course-cap" v-model.number="admin.newCourse.enrollment_cap" type="number" min="1" step="1" placeholder="Ej: 30">
          <label for="new-course-enroll-start">Apertura de inscripción</label>
          <input id="new-course-enroll-start" v-model="admin.newCourse.enrollment_starts_at" type="datetime-local">
          <label for="new-course-enroll-end">Cierre de inscripción</label>
          <input id="new-course-enroll-end" v-model="admin.newCourse.enrollment_ends_at" type="datetime-local">
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showCourseForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">
              {{ admin.formLoading ? 'Guardando…' : 'Crear curso' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showCohortForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cohort-title"
      @click.self="admin.showCohortForm = false"
    >
      <div class="modal-card modal-card--wide">
        <h2 id="modal-cohort-title">Cohorte e inscripción</h2>
        <p class="modal-hint">{{ admin.cohortEdit.title }}</p>
        <form @submit.prevent="admin.onUpdateCohort">
          <label for="cohort-start">Inicio de cohorte</label>
          <input id="cohort-start" v-model="admin.cohortEdit.cohort_start_date" type="date">
          <label for="cohort-end">Fin de cohorte</label>
          <input id="cohort-end" v-model="admin.cohortEdit.cohort_end_date" type="date">
          <label for="cohort-cap">Cupo máximo (vacío = ilimitado)</label>
          <input id="cohort-cap" v-model.number="admin.cohortEdit.enrollment_cap" type="number" min="1" step="1" placeholder="Ej: 30">
          <label for="cohort-enroll-start">Apertura de inscripción</label>
          <input id="cohort-enroll-start" v-model="admin.cohortEdit.enrollment_starts_at" type="datetime-local">
          <label for="cohort-enroll-end">Cierre de inscripción</label>
          <input id="cohort-enroll-end" v-model="admin.cohortEdit.enrollment_ends_at" type="datetime-local">
          <p class="modal-hint">Dejá los campos vacíos para no limitar fechas o cupos.</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showCohortForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">Guardar cohorte</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showPriceForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-price-title"
      @click.self="admin.showPriceForm = false"
    >
      <div class="modal-card">
        <h2 id="modal-price-title">Precio del curso</h2>
        <p class="modal-hint">{{ admin.priceEdit.title }}</p>
        <form @submit.prevent="admin.onUpdatePrice">
          <label for="course-price-amount">Precio (ARS, 0 = gratuito)</label>
          <input id="course-price-amount" v-model.number="admin.priceEdit.price_amount" type="number" min="0" step="1" required>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showPriceForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">Guardar precio</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showTeacherForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-teacher-title"
      @click.self="admin.showTeacherForm = false"
    >
      <div class="modal-card">
        <h2 id="modal-teacher-title">
          {{ admin.teacherAssignment.mode === 'teacher' ? 'Asignar curso' : 'Asignar docente' }}
        </h2>
        <p class="modal-hint">
          {{ admin.teacherAssignment.mode === 'teacher'
            ? admin.teacherAssignment.teacher_name
            : admin.teacherAssignment.course_title }}
        </p>
        <form @submit.prevent="admin.onAssignTeacher">
          <template v-if="admin.teacherAssignment.mode === 'course'">
            <label for="teacher-assign-select">Docente o tutor</label>
            <select id="teacher-assign-select" v-model="admin.teacherAssignment.teacher_id" required>
              <option disabled value="">Seleccionar</option>
              <option
                v-for="teacher in admin.teachers.filter((t) => t.id)"
                :key="teacher.id"
                :value="teacher.id"
              >
                {{ teacher.full_name }} ({{ teacher.email }})
              </option>
            </select>
          </template>
          <template v-else>
            <label for="course-assign-select">Curso</label>
            <select id="course-assign-select" v-model="admin.teacherAssignment.course_id" required>
              <option disabled value="">Seleccionar</option>
              <option
                v-for="course in admin.availableCoursesForTeacher.filter((c) => c.id)"
                :key="course.id"
                :value="course.id"
              >
                {{ course.title }}
              </option>
            </select>
            <p v-if="!admin.availableCoursesForTeacher.length" class="modal-hint">
              Este docente ya está en todos los cursos cargados.
            </p>
          </template>
          <label for="teacher-assign-role">Rol en el curso</label>
          <select id="teacher-assign-role" v-model="admin.teacherAssignment.role">
            <option value="docente">Docente</option>
            <option value="tutor">Tutor</option>
          </select>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showTeacherForm = false">Cancelar</button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="admin.formLoading || (admin.teacherAssignment.mode === 'course' ? !admin.teachers.length : !admin.availableCoursesForTeacher.length)"
            >
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showTeacherUserForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-new-teacher-title"
      @click.self="admin.showTeacherUserForm = false"
    >
      <div class="modal-card">
        <h2 id="modal-new-teacher-title">Nuevo docente</h2>
        <p class="modal-hint">
          Si el correo ya existe, se le asigna el rol docente/tutor (no se crea otra cuenta).
        </p>
        <p v-if="admin.errorMessage" class="modal-hint" style="color: var(--eg-error, #b42318);">{{ admin.errorMessage }}</p>
        <form @submit.prevent="admin.onCreateTeacher">
          <label for="new-teacher-name">Nombre completo</label>
          <input id="new-teacher-name" v-model="admin.newTeacher.full_name" required placeholder="Nombre y apellido">
          <label for="new-teacher-email">Correo</label>
          <input id="new-teacher-email" v-model="admin.newTeacher.email" type="email" required placeholder="correo@ejemplo.com">
          <label for="new-teacher-password">Contraseña</label>
          <input
            id="new-teacher-password"
            v-model="admin.newTeacher.password"
            type="text"
            minlength="8"
            placeholder="Vacía si ya tiene cuenta; mín. 8 si es nuevo"
            autocomplete="new-password"
          >
          <p class="modal-hint">Obligatoria solo para correos nuevos. Si ya existe, opcional (resetea la clave).</p>
          <label for="new-teacher-role">Rol</label>
          <select id="new-teacher-role" v-model="admin.newTeacher.role">
            <option value="docente">Docente</option>
            <option value="tutor">Tutor</option>
          </select>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showTeacherUserForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">
              {{ admin.formLoading ? 'Guardando…' : 'Guardar docente' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showEnrollmentForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-enrollment-title"
      @click.self="admin.showEnrollmentForm = false"
    >
      <div class="modal-card">
        <h2 id="modal-enrollment-title">Nueva inscripción</h2>
        <form @submit.prevent="admin.onCreateEnrollment">
          <label for="enrollment-course">Curso</label>
          <select id="enrollment-course" v-model="admin.newEnrollment.course_id" required>
            <option value="">Seleccionar curso</option>
            <option v-for="course in admin.courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>
          <label for="enrollment-student">Alumno</label>
          <select id="enrollment-student" v-model="admin.newEnrollment.student_id" required>
            <option value="">Seleccionar alumno</option>
            <option v-for="student in admin.students" :key="student.id" :value="student.id">
              {{ student.full_name }} ({{ student.email }})
            </option>
          </select>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showEnrollmentForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading || !admin.students.length">Inscribir</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="admin.showStudentForm"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-student-title"
      @click.self="admin.showStudentForm = false"
    >
      <div class="modal-card modal-card--wide">
        <h2 id="modal-student-title">Nuevo alumno</h2>
        <p class="modal-hint">Creá la cuenta con acceso al campus. Completá la ficha si la tenés; después podés inscribirlo a un curso.</p>
        <form @submit.prevent="admin.onCreateStudent">
          <p class="modal-section-title">Cuenta</p>
          <label for="new-student-name">Nombre completo</label>
          <input id="new-student-name" v-model="admin.newStudent.full_name" required placeholder="Nombre y apellido">
          <label for="new-student-email">Correo electrónico</label>
          <input id="new-student-email" v-model="admin.newStudent.email" type="email" required placeholder="alumno@correo.com" autocomplete="off">
          <label for="new-student-password">Contraseña temporal</label>
          <input id="new-student-password" v-model="admin.newStudent.password" type="text" required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password">

          <p class="modal-section-title">Ficha</p>
          <label for="new-student-phone">WhatsApp / teléfono</label>
          <input id="new-student-phone" v-model="admin.newStudent.phone" type="tel" placeholder="5493704…" autocomplete="off">
          <label for="new-student-city">Ciudad / provincia</label>
          <input id="new-student-city" v-model="admin.newStudent.city" type="text" placeholder="Resistencia, Chaco">
          <label for="new-student-job-role">Rol laboral</label>
          <input id="new-student-job-role" v-model="admin.newStudent.job_role" type="text" placeholder="Gerente, analista, emprendedor…">
          <label for="new-student-occupation">Ocupación / rubro</label>
          <input id="new-student-occupation" v-model="admin.newStudent.occupation" type="text" placeholder="Comercio, industria, servicios…">
          <label for="new-student-audience">Audiencia / perfil</label>
          <input id="new-student-audience" v-model="admin.newStudent.audience" type="text" placeholder="PyME, equipo, individual…">
          <label for="new-student-challenge">Desafío / objetivo</label>
          <textarea id="new-student-challenge" v-model="admin.newStudent.challenge" rows="3" placeholder="Qué quiere resolver con el programa" />

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showStudentForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">
              {{ admin.formLoading ? 'Creando…' : 'Crear alumno' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 44, 84, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}
.modal-card {
  width: min(480px, 100%);
  background: var(--eg-surface);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(13, 44, 84, 0.2);
}
.modal-card--wide { width: min(560px, 100%); }
.modal-section-title {
  margin: 20px 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: var(--eg-ink);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.modal-card h2 { margin: 0 0 20px; font-family: var(--eg-font-display); }
.modal-card label { display: block; margin: 12px 0 6px; font-size: 13px; font-weight: 700; }
.modal-card input, .modal-card textarea, .modal-card select {
  width: 100%; box-sizing: border-box; padding: 12px;
  border: 1px solid var(--eg-field-border); border-radius: 10px; font-family: inherit;
}
.modal-hint { font-size: 13px; color: var(--eg-muted); margin-top: 12px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
.btn-primary, .btn-secondary {
  border: none; border-radius: 9px; padding: 11px 18px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.btn-primary { background: var(--eg-action); color: var(--eg-surface); }
.btn-secondary { background: var(--eg-row-bg); color: var(--eg-ink); }
</style>
