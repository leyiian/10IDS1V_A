<template>
  <!-- Eliminar el v-card exterior -->
  <v-layout class="fill-height">
    <!-- Contenido principal -->
    <v-main class="fill-height">
      <v-container fluid class="fill-height pa-6"> <!-- Agregado padding -->
        <v-card flat class="fill-height mx-auto" max-width="1400px"> <!-- Agregado max-width y mx-auto -->
          <v-card-text class="d-flex justify-end mb-4">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openNewPolizaForm"
            >
              Nueva Póliza
            </v-btn>
          </v-card-text>
          <v-card-text class="fill-height">
            <!-- Tabla de pólizas -->
            <v-table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Total Horas</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Precio</th>
                  <th>Cliente</th>
                  <th>Observaciones</th>
                  <th>Horas Disponibles</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="poliza in polizas" :key="poliza.id"
                    :class="{ 'alerta': poliza.alertas }">
                  <td>{{ poliza.id }}</td>
                  <td>{{ calcularTotalHoras(poliza.fecha_inicio, poliza.fecha_fin) }}</td>
                  <td>{{ formatDate(poliza.fecha_inicio) }}</td>
                  <td>{{ formatDate(poliza.fecha_fin) }}</td>
                  <td>${{ formatPrice(poliza.precio) }}</td>
                  <td>{{ getClienteName(poliza.id_cliente) }}</td>
                  <td>{{ poliza.observaciones }}</td>
                  <td>
                    {{ calcularHorasDisponibles(poliza) }} / {{ calcularTotalHoras(poliza.fecha_inicio, poliza.fecha_fin) }}
                    <v-chip
                      v-if="calcularHorasDisponibles(poliza) <= 10 && calcularHorasDisponibles(poliza) > 0"
                      color="warning"
                      size="small"
                      class="ml-2"
                    >
                      ¡Pocas horas!
                    </v-chip>
                  </td>
                  <td>
                    <v-chip
                      :color="getEstadoColor(poliza.estado)"
                      size="small"
                      class="estado-chip"
                    >
                      {{ poliza.estado }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      color="primary"
                      class="mr-2"
                      @click="editPoliza(poliza)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      @click="deletePoliza(poliza.id)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>

    <!-- Diálogo para editar/crear póliza -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="savePoliza" ref="form">
            <v-text-field
              v-model="editedPoliza.fecha_inicio"
              label="Fecha Inicio"
              type="date"
              :rules="[
                v => !!v || 'Fecha de inicio es requerida',
                v => new Date(v) >= new Date().setHours(0,0,0,0) || 'La fecha no puede ser anterior a hoy'
              ]"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedPoliza.fecha_fin"
              label="Fecha Fin"
              type="date"
              :rules="[
                v => !!v || 'Fecha fin es requerida',
                v => new Date(v) > new Date(editedPoliza.fecha_inicio) || 'La fecha fin debe ser posterior a la fecha inicio'
              ]"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedPoliza.precio"
              label="Precio"
              type="number"
              step="0.01"
              prefix="$"
              :rules="[v => !!v || 'Precio es requerido']"
              required
            ></v-text-field>

            <v-select
              v-model="editedPoliza.id_cliente"
              :items="clientes"
              item-title="name"
              item-value="id"
              label="Cliente"
              :rules="[v => !!v || 'Cliente es requerido']"
              required
            ></v-select>

            <v-textarea
              v-model="editedPoliza.observaciones"
              label="Observaciones"
              rows="3"
            ></v-textarea>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="error" @click="closeDialog">Cancelar</v-btn>
              <v-btn color="success" type="submit">Guardar</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar para notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
      location="top"
      @update:modelValue="val => !val && processQueue()"
    >
      {{ snackbar.message }}
    </v-snackbar>

  </v-layout>
</template>

<script>
import axiosInstance from '@/config/axios';

export default {
  name: 'Polizas',

  data: () => ({
    drawer: false,
    dialog: false,
    polizas: [],
    clientes: [],
    snackbar: {
      show: false,
      message: '',
      color: 'success'
    },
    messageQueue: [], // Nueva cola de mensajes
    editedPoliza: {
      id: '',
      fecha_inicio: '',
      fecha_fin: '',
      precio: '',
      id_cliente: '',
      observaciones: '',
      horas_consumidas: 0,
      estado: 'activa'
    },
    defaultPoliza: {
      id: '',
      fecha_inicio: '',
      fecha_fin: '',
      precio: '',
      id_cliente: '',
      observaciones: '',
      horas_consumidas: 0,
      estado: 'activa'
    },
    queue: [],
    intervalId: null // Para almacenar la referencia del intervalo
  }),

  computed: {
    formTitle() {
      return this.editedPoliza.id ? 'Editar Póliza' : 'Nueva Póliza'
    }
  },

  methods: {
    // Formateo de datos
    formatDate(date) {
      return new Date(date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    },

    formatPrice(price) {
      return Number(price).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    getClienteName(id) {
      const cliente = this.clientes.find(c => c.id === id)
      return cliente ? cliente.name : 'Cliente no encontrado'
    },

    // Carga de datos
    async loadPolizas() {
      try {
        const response = await axiosInstance.get('/polizas')
        this.polizas = response.data
        this.verificarEstadoPolizas(); // Mover aquí para asegurar que se ejecute después de cargar las pólizas
      } catch (error) {
        this.showMessage('Error al cargar pólizas', 'error')
      }
    },

    async loadClientes() {
      try {
        const response = await axiosInstance.get('/clientes')
        this.clientes = response.data
      } catch (error) {
        this.showMessage('Error al cargar clientes', 'error')
      }
    },

    // Operaciones CRUD
    editPoliza(poliza) {
      this.editedPoliza = Object.assign({}, poliza)
      this.dialog = true
    },

    async deletePoliza(id) {
      if (confirm('¿Está seguro de eliminar esta póliza?')) {
        try {
          await axiosInstance.delete(`/polizas/${id}`)
          this.showMessage('Póliza eliminada exitosamente')
          this.loadPolizas()
        } catch (error) {
          this.showMessage('Error al eliminar la póliza', 'error')
        }
      }
    },

    async savePoliza() {
      if (!this.$refs.form.validate()) return;

      try {
        // Calcular total_horas antes de enviar
        const total_horas = this.calcularTotalHoras(
          this.editedPoliza.fecha_inicio,
          this.editedPoliza.fecha_fin
        );

        // Crear el objeto con todos los campos requeridos
        const polizaData = {
          total_horas: total_horas,
          fecha_inicio: this.editedPoliza.fecha_inicio,
          fecha_fin: this.editedPoliza.fecha_fin,
          precio: this.editedPoliza.precio,
          id_cliente: this.editedPoliza.id_cliente,
          observaciones: this.editedPoliza.observaciones || ''
        };

        if (this.editedPoliza.id) {
          await axiosInstance.post(`/polizas/${this.editedPoliza.id}`, polizaData);
          this.showMessage('Póliza actualizada exitosamente');
        } else {
          await axiosInstance.post('/polizas', polizaData);
          this.showMessage('Póliza creada exitosamente');
        }

        this.closeDialog();
        this.loadPolizas();
      } catch (error) {
        console.error('Error:', error);
        this.showMessage('Error al guardar la póliza', 'error');
      }
    },

    // Utilidades
    openNewPolizaForm() {
      this.editedPoliza = Object.assign({}, this.defaultPoliza)
      this.dialog = true
    },

    closeDialog() {
      this.$refs.form.reset()
      this.dialog = false
      this.editedPoliza = Object.assign({}, this.defaultPoliza)
    },

    showMessage(message, color = 'success') {
      // Limitar el tamaño de la cola
      if (this.messageQueue.length >= 5) {
        this.messageQueue.shift(); // Eliminar el mensaje más antiguo
      }
      this.messageQueue.push({ message, color });
      if (!this.snackbar.show) {
        this.processQueue();
      }
    },

    processQueue() {
      if (this.messageQueue.length === 0) {
        return;
      }
      const nextMessage = this.messageQueue.shift();
      this.snackbar.message = nextMessage.message;
      this.snackbar.color = nextMessage.color;
      this.snackbar.show = true;
    },

    navigateTo(route) {
      this.$router.push(route)
    },

    calcularTotalHoras(fechaInicio, fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diffMs = fin - inicio;
      return Math.floor(diffMs / (1000 * 60 * 60)); // Convertir milisegundos a horas
    },

    calcularHorasDisponibles(poliza) {
      const hoy = new Date();
      const fechaInicio = new Date(poliza.fecha_inicio);
      const fechaFin = new Date(poliza.fecha_fin);
      const horasConsumidas = poliza.horas_consumidas || 0;
      const totalHoras = this.calcularTotalHoras(poliza.fecha_inicio, poliza.fecha_fin);

      // Si la póliza está vencida
      if (fechaFin < hoy) {
        return 0;
      }

      // Calcular horas disponibles restando las consumidas del total
      const horasDisponibles = totalHoras - horasConsumidas;

      // Si la póliza aún no inicia o está activa
      if (fechaInicio > hoy) {
        return Math.max(0, horasDisponibles);
      }

      // Si la póliza está en curso
      const horasRestantes = this.calcularTotalHoras(hoy.toISOString(), poliza.fecha_fin);
      return Math.max(0, Math.min(horasRestantes, horasDisponibles));
    },

    async verificarEstadoPolizas() {
      const hoy = new Date();
      const notificacionesEnviadas = new Set(); // Para evitar duplicados

      this.polizas = this.polizas.map(poliza => {
        const fechaFin = new Date(poliza.fecha_fin);
        const horasDisponibles = this.calcularHorasDisponibles(poliza);
        let estado = fechaFin < hoy ? 'vencida' : 'activa';
        const notificacionKey = `${poliza.id}-${estado}`; // Clave única por póliza y estado

        // Verificar si faltan menos de 10 horas disponibles
        if (estado === 'activa' && horasDisponibles <= 10 && horasDisponibles > 0) {
          estado = 'por vencer';
          if (!notificacionesEnviadas.has(notificacionKey)) {
            this.showMessage(
              `¡Advertencia! La póliza ID: ${poliza.id} del cliente ${poliza.cliente.name} tiene ${horasDisponibles} horas disponibles.`,
              'warning'
            );
            notificacionesEnviadas.add(notificacionKey);
          }
        }

        // Verificar vencimiento
        if (estado === 'vencida' || horasDisponibles === 0) {
          estado = 'vencida';
          if (!notificacionesEnviadas.has(notificacionKey)) {
            this.showMessage(
              `La póliza ID: ${poliza.id} del cliente ${poliza.cliente.name} ha vencido.`,
              'error'
            );
            notificacionesEnviadas.add(notificacionKey);
          }
        }

        return {
          ...poliza,
          estado,
          alertas: horasDisponibles <= 10 && horasDisponibles > 0
        };
      });

      // Limpiar la cola si hay demasiados mensajes
      if (this.messageQueue.length > 5) {
        this.messageQueue = this.messageQueue.slice(-5);
      }
    },

    getEstadoColor(estado) {
      const colores = {
        activa: 'success',
        vencida: 'error',
        'por vencer': 'warning',
        agotada: 'warning'
      };
      return colores[estado] || 'grey';
    }
  },

  mounted() {
    this.loadPolizas()
    this.loadClientes()
    // Verificar cada hora
    this.intervalId = setInterval(() => this.verificarEstadoPolizas(), 3600000); // Cada hora
  },

  beforeDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
</script>

<style scoped>
.v-table {
  width: 100%;
  border-collapse: collapse;
}

.v-table th {

  font-weight: bold;
  text-align: center !important;
}

.v-table td {
  text-align: center;
  padding: 12px !important;
}

.alerta {
  background-color: rgba(255, 193, 7, 0.1);
}

.estado-chip {
  text-transform: capitalize;
}

.fill-height {
  height: 100%;
}

:deep(.v-main) {
  height: 100vh;
}

:deep(.v-container) {
  max-height: 100%;
  overflow-y: auto;
}

:deep(.v-card) {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  border-radius: 8px;
}

:deep(.v-table) {
  border-radius: 8px;
  overflow: hidden;
}
</style>
