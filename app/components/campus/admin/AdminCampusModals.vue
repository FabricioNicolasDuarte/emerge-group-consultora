<script setup lang="ts">
const admin = useAdminCampusData()
</script>

<template>
  <div>
    <div v-if="admin.showCourseForm" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-new-course-title" @click.self="admin.showCourseForm = false">
      <div class="modal-card">
        <h2 id="modal-new-course-title">Nuevo curso</h2>
        <form @submit.prevent="admin.onCreateCourse">
          <label>Título</label>
          <input v-model="admin.newCourse.title" required placeholder="Nombre del programa">
          <label>Categoría</label>
          <input v-model="admin.newCourse.category" placeholder="Ej: Liderazgo">
          <label>Descripción</label>
          <textarea v-model="admin.newCourse.description" rows="4" placeholder="Breve descripción" />
          <label>Estado</label>
          <select v-model="admin.newCourse.status">
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
          <label>Precio (ARS, 0 = gratuito)</label>
          <input v-model.number="admin.newCourse.price_amount" type="number" min="0" step="1">
          <p class="modal-section-title">Cohorte e inscripción (opcional)</p>
          <label>Inicio de cohorte</label>
          <input v-model="admin.newCourse.cohort_start_date" type="date">
          <label>Fin de cohorte</label>
          <input v-model="admin.newCourse.cohort_end_date" type="date">
          <label>Cupo máximo (vacío = ilimitado)</label>
          <input v-model.number="admin.newCourse.enrollment_cap" type="number" min="1" step="1" placeholder="Ej: 30">
          <label>Apertura de inscripción</label>
          <input v-model="admin.newCourse.enrollment_starts_at" type="datetime-local">
          <label>Cierre de inscripción</label>
          <input v-model="admin.newCourse.enrollment_ends_at" type="datetime-local">
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showCourseForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">
              {{ admin.formLoading ? 'Guardando…' : 'Crear curso' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="admin.showCohortForm" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-cohort-title" @click.self="admin.showCohortForm = false">
      <div class="modal-card modal-card--wide">
        <h2 id="modal-cohort-title">Cohorte e inscripción</h2>
        <p class="modal-hint">{{ admin.cohortEdit.title }}</p>
        <form @submit.prevent="admin.onUpdateCohort">
          <label>Inicio de cohorte</label>
          <input v-model="admin.cohortEdit.cohort_start_date" type="date">
          <label>Fin de cohorte</label>
          <input v-model="admin.cohortEdit.cohort_end_date" type="date">
          <label>Cupo máximo (vacío = ilimitado)</label>
          <input v-model.number="admin.cohortEdit.enrollment_cap" type="number" min="1" step="1" placeholder="Ej: 30">
          <label>Apertura de inscripción</label>
          <input v-model="admin.cohortEdit.enrollment_starts_at" type="datetime-local">
          <label>Cierre de inscripción</label>
          <input v-model="admin.cohortEdit.enrollment_ends_at" type="datetime-local">
          <p class="modal-hint">Dejá los campos vacíos para no limitar fechas o cupos.</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showCohortForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">Guardar cohorte</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="admin.showPriceForm" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-price-title" @click.self="admin.showPriceForm = false">
      <div class="modal-card">
        <h2 id="modal-price-title">Precio del curso</h2>
        <p class="modal-hint">{{ admin.priceEdit.title }}</p>
        <form @submit.prevent="admin.onUpdatePrice">
          <label>Precio (ARS, 0 = gratuito)</label>
          <input v-model.number="admin.priceEdit.price_amount" type="number" min="0" step="1" required>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showPriceForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading">Guardar precio</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="admin.showTeacherForm" class="modal-overlay" @click.self="admin.showTeacherForm = false">
      <div class="modal-card">
        <h2>Asignar docente</h2>
        <p class="modal-hint">{{ admin.teacherAssignment.course_title }}</p>
        <form @submit.prevent="admin.onAssignTeacher">
          <label>Docente o tutor</label>
          <select v-model="admin.teacherAssignment.teacher_id" required>
            <option value="">Seleccionar</option>
            <option v-for="teacher in admin.teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.full_name }} ({{ teacher.email }})
            </option>
          </select>
          <label>Rol en el curso</label>
          <select v-model="admin.teacherAssignment.role">
            <option value="docente">Docente</option>
            <option value="tutor">Tutor</option>
          </select>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="admin.showTeacherForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="admin.formLoading || !admin.teachers.length">Asignar</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="admin.showEnrollmentForm" class="modal-overlay" @click.self="admin.showEnrollmentForm = false">
      <div class="modal-card">
        <h2>Nueva inscripción</h2>
        <form @submit.prevent="admin.onCreateEnrollment">
          <label>Curso</label>
          <select v-model="admin.newEnrollment.course_id" required>
            <option value="">Seleccionar curso</option>
            <option v-for="course in admin.courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>
          <label>Alumno</label>
          <select v-model="admin.newEnrollment.student_id" required>
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
