<template>
  <v-layout class="fill-height">
    <v-main class="fill-height">
      <v-container fluid class="fill-height pa-6">
        <v-card flat class="fill-height mx-auto" max-width="1400px">
          <!-- Botón para nuevo servicio -->
          <v-card-text class="d-flex justify-end mb-4">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openNewServicioForm"
            >
              Nuevo Servicio
            </v-btn>
          </v-card-text>

          <!-- Tabla de servicios -->
          <v-card-text class="fill-height">
            <v-table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Técnico</th>
                  <th>Horas</th>
                  <th>Póliza</th>
                  <th>Factura</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="servicio in servicios" :key="servicio.id">
                  <td>{{ servicio.id }}</td>
                  <td>{{ formatDate(servicio.fecha) }}</td>
                  <td>{{ getClienteName(servicio.id_cliente) }}</td>
                  <td>{{ getTecnicoName(servicio.id_tecnico) }}</td>
                  <td>{{ servicio.horas }}</td>
                  <td>{{ getPolizaInfo(servicio.id_poliza) }}</td>
                  <td>{{ getFacturaInfo(servicio.id_factura) }}</td>
                  <td>{{ servicio.observaciones }}</td>
                  <td>
                    <v-btn icon="mdi-pencil" size="small" color="primary" class="mr-2"
                           @click="editServicio(servicio)"></v-btn>
                    <v-btn icon="mdi-delete" size="small" color="error"
                           @click="deleteServicio(servicio.id)"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>

    <!-- Diálogo para crear/editar servicio -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveServicio" ref="form">
            <v-text-field
              v-model="editedServicio.fecha"
              label="Fecha"
              type="date"
              :rules="[v => !!v || 'Fecha es requerida']"
              required
            ></v-text-field>

            <v-select
              v-model="editedServicio.id_cliente"
              :items="clientes"
              item-title="name"
              item-value="id"
              label="Cliente"
              :rules="[v => !!v || 'Cliente es requerido']"
              @update:model-value="handleClienteChange"
              required
            ></v-select>

            <v-select
              v-model="editedServicio.id_tecnico"
              :items="tecnicos"
              item-title="name"
              item-value="id"
              label="Técnico"
              :rules="[v => !!v || 'Técnico es requerido']"
              required
            ></v-select>

            <v-text-field
              v-model="editedServicio.horas"
              label="Horas"
              type="number"
              step="0.5"
              min="0"
              :rules="[
                v => !!v || 'Horas son requeridas',
                v => v > 0 || 'Las horas deben ser mayores a 0'
              ]"
              required
            ></v-text-field>

            <v-select
              v-model="editedServicio.id_poliza"
              :items="polizas"
              item-title="id"
              item-value="id"
              label="Póliza"
              persistent-hint
              :hint="getPolizasHint"
              :disabled="!editedServicio.id_cliente || !polizas.length"
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>
                    Póliza #{{ item?.raw?.id || 'N/A' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Horas disponibles: {{ calcularHorasDisponibles(item?.raw) }}
                    - Fecha vencimiento: {{ formatDate(item?.raw?.fecha_fin) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                <span>
                  Póliza #{{ item?.raw?.id }}
                  ({{ calcularHorasDisponibles(item?.raw) }} horas disponibles)
                </span>
              </template>
            </v-select>

            <v-textarea
              v-model="editedServicio.observaciones"
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
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000" location="top">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-layout>
</template>

<script>
import axiosInstance from '@/config/axios'

export default {
  name: 'Servicios',

  data: () => ({
    drawer: false,
    dialog: false,
    servicios: [],
    clientes: [],
    tecnicos: [],
    polizas: [],
    facturas: [],
    snackbar: {
      show: false,
      message: '',
      color: 'success'
    },
    editedServicio: {
      id: '',
      fecha: '',
      id_cliente: '',
      id_tecnico: '',
      horas: '',
      observaciones: '',
      id_poliza: null
    },
    defaultServicio: {
      id: '',
      fecha: '',
      id_cliente: '',
      id_tecnico: '',
      horas: '',
      observaciones: '',
      id_poliza: null
    },
    items: [
      { title: "Clientes", route: "/clientes" },
      { title: "Registro Clientes", route: "/home" },
      { title: "Polizas", route: "/polizas" },
      { title: "Facturas", route: "/facturas" },
      { title: "Servicios", route: "/servicios" }
    ]
  }),

  computed: {
    formTitle() {
      return this.editedServicio.id ? 'Editar Servicio' : 'Nuevo Servicio'
    },
    getPolizasHint() {
      if (!this.editedServicio.id_cliente) {
        return 'Seleccione un cliente primero'
      }
      return this.polizas.length ? 'Seleccione una póliza' : 'No hay pólizas disponibles para este cliente'
    }
  },

  watch: {
    'editedServicio.id_cliente': {
      handler(newVal) {
        if (!newVal) {
          this.polizas = []
          this.editedServicio.id_poliza = null
        }
      }
    }
  },

  methods: {
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },

    getClienteName(id) {
      const cliente = this.clientes.find(c => c.id === id)
      return cliente ? cliente.name : 'Cliente no encontrado'
    },

    getTecnicoName(id) {
      const tecnico = this.tecnicos.find(t => t.id === id)
      return tecnico ? tecnico.name : 'Técnico no encontrado'
    },

    async loadServicios() {
      try {
        const response = await axiosInstance.get('/servicios')
        this.servicios = response.data
        console.log('Servicios cargados:', {
          cantidad: response.data.length,
          datos: response.data
        })

        // Obtener todas las pólizas necesarias
        const polizasIds = [...new Set(response.data
          .filter(s => s.id_poliza)
          .map(s => s.id_poliza))]

        if (polizasIds.length > 0) {
          const polizasResponse = await axiosInstance.get('/polizas')
          // Mantener las pólizas existentes y agregar las nuevas
          this.polizas = [...new Set([...this.polizas, ...polizasResponse.data])]
        }
      } catch (error) {
        console.error('Error loadServicios:', error.response || error)
      }
    },

    async loadClientes() {
      try {
        const response = await axiosInstance.get('/servicios/clientes')
        this.clientes = response.data
        console.log('Clientes cargados:', {
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error loadClientes:', error.response || error)
      }
    },

    async loadTecnicos() {
      try {
        const response = await axiosInstance.get('/servicios/tecnicos')
        this.tecnicos = response.data
        console.log('Técnicos cargados:', {
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error loadTecnicos:', error.response || error)
      }
    },

    async loadPolizasCliente(clienteId) {
      try {
        if (!clienteId) {
          console.log('No se proporcionó ID de cliente')
          this.polizas = []
          return
        }
        const response = await axiosInstance.get(`/servicios/cliente/${clienteId}/polizas`)
        this.polizas = response.data
        console.log('Pólizas del cliente cargadas:', {
          clienteId,
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error loadPolizasCliente:', error.response || error)
      }
    },

    async loadPolizas() {
      try {
        const response = await axiosInstance.get('/polizas')
        this.polizas = response.data
        console.log('Pólizas cargadas:', {
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error loadPolizas:', error.response || error)
      }
    },

    async loadFacturas() {
      try {
        const response = await axiosInstance.get('/facturas')
        this.facturas = response.data
        console.log('Facturas cargadas:', {
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error loadFacturas:', error.response || error)
      }
    },

    openNewServicioForm() {
      this.editedServicio = Object.assign({}, this.defaultServicio)
      this.dialog = true
    },

    async editServicio(servicio) {
      try {
        // Primero cargar las pólizas del cliente
        await this.handleClienteChange(servicio.id_cliente)

        // Luego configurar el servicio para editar
        this.editedServicio = {
          ...servicio,
          fecha: this.formatDateForInput(servicio.fecha)
        }

        this.dialog = true
      } catch (error) {
        console.error('Error al cargar datos para edición:', error)
        this.showMessage('Error al cargar datos para edición', 'error')
      }
    },

    async saveServicio() {
      if (!this.$refs.form.validate()) return

      try {
        const fecha = new Date(this.editedServicio.fecha)
        if (isNaN(fecha.getTime())) {
          this.showMessage('Fecha inválida', 'error')
          return
        }

        // Validar horas si hay póliza seleccionada
        if (this.editedServicio.id_poliza) {
          const poliza = this.polizas.find(p => p.id === this.editedServicio.id_poliza)
          if (poliza) {
            const horasDisponibles = this.calcularHorasDisponibles(poliza)
            if (parseFloat(this.editedServicio.horas) > horasDisponibles) {
              this.showMessage(`No hay suficientes horas disponibles. Disponibles: ${horasDisponibles}`, 'error')
              return
            }
          }
        }

        const servicioData = {
          fecha: this.editedServicio.fecha,
          id_cliente: parseInt(this.editedServicio.id_cliente),
          id_tecnico: parseInt(this.editedServicio.id_tecnico),
          horas: parseFloat(this.editedServicio.horas),
          observaciones: this.editedServicio.observaciones || '',
          id_poliza: this.editedServicio.id_poliza ? parseInt(this.editedServicio.id_poliza) : null
        }

        console.log('Datos a enviar:', servicioData)

        if (this.editedServicio.id) {
          await axiosInstance.post(`/servicios/${this.editedServicio.id}`, servicioData)
          this.showMessage('Servicio actualizado exitosamente')
        } else {
          const response = await axiosInstance.post('/servicios', servicioData)
          console.log('Respuesta del servidor:', response.data)
          this.showMessage('Servicio creado exitosamente')
        }

        this.closeDialog()
        await this.loadServicios()
        if (this.editedServicio.id_cliente) {
          await this.loadPolizasCliente(this.editedServicio.id_cliente)
        }

      } catch (error) {
        console.error('Error completo:', error)
        const errorMessage = error.response?.data?.message || 'Error al guardar el servicio'
        this.showMessage(errorMessage, 'error')
      }
    },

    async deleteServicio(id) {
      if (confirm('¿Está seguro de eliminar este servicio?')) {
        try {
          await axiosInstance.delete(`/servicios/${id}`)
          this.showMessage('Servicio eliminado exitosamente')
          this.loadServicios()
        } catch (error) {
          this.showMessage('Error al eliminar el servicio', 'error')
        }
      }
    },

    closeDialog() {
      this.$refs.form.reset()
      this.dialog = false
      this.editedServicio = Object.assign({}, this.defaultServicio)
      this.polizas = []
      this.loadServicios()
    },

    showMessage(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.show = true
    },

    navigateTo(route) {
      this.$router.push(route)
    },

    // Método getPolizaInfo corregido
    getPolizaInfo(id) {
      if (!id) return 'N/A'
      const poliza = this.polizas.find(p => p.id === id)
      if (!poliza) return 'N/A'
      const cliente = this.clientes.find(c => c.id === poliza.id_cliente)
      return `#${poliza.id} - ${cliente?.name || 'Cliente no encontrado'}`
    },

    getClienteNombre(id) {
      if (!id) return 'N/A'
      const cliente = this.clientes.find(c => c.id === id)
      return cliente?.name || 'Cliente no encontrado'
    },

    calcularHorasDisponibles(poliza) {
      if (!poliza) return 0
      return poliza.total_horas - (poliza.horas_consumidas || 0)
    },

    getFacturaInfo(id) {
      if (!id) return 'Sin facturar'
      const factura = this.facturas.find(f => f.id === id)
      if (!factura) return 'Factura no encontrada'
      return `#${factura.id} - $ ${this.formatPrice(factura.monto)}`
    },

    formatDateForInput(date) {
      if (!date) return ''
      return new Date(date).toISOString().split('T')[0]
    },

    formatPrice(price) {
      if (!price) return '0.00'
      return Number(price).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    async handleClienteChange(clienteId) {
      this.editedServicio.id_poliza = null
      if (!clienteId) {
        this.polizas = []
        return
      }
      try {
        const response = await axiosInstance.get(`/servicios/cliente/${clienteId}/polizas`)
        this.polizas = response.data
        console.log('Pólizas del cliente cargadas:', {
          clienteId,
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error al cargar pólizas del cliente:', error)
        this.showMessage('Error al cargar pólizas del cliente', 'error')
        this.polizas = []
      }
    },

    getPolizasHint() {
      return this.polizas.length ? 'Seleccione una póliza' : 'No hay pólizas disponibles para este cliente'
    }
  },

  mounted() {
    this.loadServicios()
    this.loadClientes()
    this.loadTecnicos()
    this.loadPolizas()
    this.loadFacturas()
  }
}
</script>

<style scoped>
/* Estilos base */
.fill-height {
  height: 100%;
}

/* Estilos de tabla */
.v-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 8px;
}

.v-table th {
  font-weight: bold;
  text-align: center !important;
}

.v-table td {
  text-align: center;
  padding: 12px !important;
}

/* Selectores deep para componentes Vuetify */
:deep(.v-main) {
height: 100vh;
}

:deep(.v-container) {
  overflow-y: auto;
  max-height: 100%;
}

:deep(.v-card) {
  border-radius: 8px;
box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

:deep(.v-table) {
  border-radius: 8px;
}
</style>
