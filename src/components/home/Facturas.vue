<template>
  <v-layout class="fill-height">
    <v-main class="fill-height">
      <v-container fluid class="fill-height pa-6">
        <v-card flat class="fill-height mx-auto" max-width="1400px">
          <v-card-text class="d-flex justify-end mb-4">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openNewFacturaForm"
            >
              Nueva Factura
            </v-btn>
          </v-card-text>

          <v-card-text class="fill-height">
            <v-table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="factura in facturas" :key="factura.id">
                  <td>{{ factura.id }}</td>
                  <td>{{ formatDate(factura.fecha) }}</td>
                  <td>{{ getClienteName(factura.id_cliente) }}</td>
                  <td>{{ formatPrice(factura.monto) }}</td>
                  <td>{{ factura.observaciones }}</td>
                  <td>
                    <v-btn icon="mdi-pencil" size="small" color="primary" class="mr-2"
                      @click="editFactura(factura)"></v-btn>
                    <v-btn icon="mdi-delete" size="small" color="error" class="mr-2"
                      @click="deleteFactura(factura.id)"></v-btn>
                    <v-btn icon="mdi-printer" size="small" color="info" @click="generarPDF(factura)"></v-btn>
                    <!-- este comentario no quitar ,por si no funciona el otro boton -->
                    <!--   <v-btn
                      icon="mdi-file-eye"
                      size="small"
                      color="info"
                      class="mr-2"
                      @click="generarPDF(factura)"
                      title="Previsualizar PDF"
                    ></v-btn> -->
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>

          <!-- Mantener los diálogos y snackbar -->
          <v-dialog v-model="dialog" max-width="600px">
            <v-card>
              <v-card-title>{{ formTitle }}</v-card-title>
              <v-card-text>
                <v-form @submit.prevent="saveFactura" ref="form">
                  <v-text-field v-model="editedFactura.fecha" label="Fecha" type="date"
                    :rules="[v => !!v || 'Fecha es requerida']" required></v-text-field>

                  <v-select v-model="editedFactura.id_cliente" :items="clientes" item-title="name" item-value="id"
                    label="Cliente" :rules="[v => !!v || 'Cliente es requerido']" @update:model-value="handleClienteChange"
                    required></v-select>

                  <v-select
                    v-model="editedFactura.id_servicio"
                    :items="serviciosDisponibles"
                    item-title="id"
                    item-value="id"
                    label="Servicio"
                    persistent-hint
                    :hint="getServiciosHint"
                    :disabled="!editedFactura.id_cliente || !serviciosDisponibles.length"
                    @update:model-value="handleServicioChange"
                    clearable
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <v-list-item-title>
                          Servicio #{{ item?.raw?.id }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          Fecha: {{ formatDate(item?.raw?.fecha) }} -
                          Horas: {{ item?.raw?.horas }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-if="item?.raw?.observaciones">
                          Obs: {{ item?.raw?.observaciones }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>

                  <v-text-field
                    v-model="editedFactura.monto"
                    label="Monto *"
                    prefix="$"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[
                      v => !!v || 'Monto es requerido',
                      v => v >= 0 || 'El monto debe ser mayor o igual a 0'
                    ]"
                    required
                    hint="Ingrese el monto de la factura"
                    persistent-hint
                  ></v-text-field>

                  <v-textarea v-model="editedFactura.observaciones" label="Observaciones" rows="3"></v-textarea>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="error" @click="closeDialog">Cancelar</v-btn>
                    <v-btn color="success" type="submit">Guardar</v-btn>
                  </v-card-actions>
                </v-form>
              </v-card-text>
            </v-card>
          </v-dialog>

          <v-dialog v-model="dialogPDF" max-width="800px">
            <v-card>
              <v-card-title>Vista previa de Factura</v-card-title>
              <v-card-text>
                <iframe :src="pdfPreviewUrl" width="100%" height="500px"></iframe>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" @click="dialogPDF = false">Cerrar</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000" location="top">
            {{ snackbar.message }}
            <template v-slot:actions>
              <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
            </template>
          </v-snackbar>
        </v-card>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script>
import axiosInstance from '@/config/axios';
import { generateFacturaPDF } from '@/utils/pdfGenerator'

export default {
  name: 'Facturas',

  data: () => ({
    drawer: false,
    dialog: false,
    facturas: [],
    clientes: [],
    snackbar: {
      show: false,
      message: '',
      color: 'success'
    },
    editedFactura: {
      id: '',
      fecha: '',
      id_cliente: '',
      id_servicio: null, // Agregado
      id_poliza: null,
      monto: '',
      observaciones: ''
    },
    defaultFactura: {
      id: '',
      fecha: '',
      id_cliente: '',
      id_servicio: null, // Agregado
      id_poliza: null,
      monto: '',
      observaciones: ''
    },
    dialogPDF: false,
    pdfPreviewUrl: null,
    currentPDFDoc: null,
    serviciosDisponibles: [],
  }),

  computed: {
    formTitle() {
      return this.editedFactura.id ? 'Editar Factura' : 'Nueva Factura'
    },
    getServiciosHint() {
      if (!this.editedFactura.id_cliente) {
        return 'Seleccione un cliente primero'
      }
      return this.serviciosDisponibles.length
        ? 'Seleccione un servicio sin facturar'
        : 'No hay servicios sin facturar para este cliente'
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

    formatPrice(price) {
      const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      return formatter.format(price).replace('MXN', '')
    },

    getClienteName(id) {
      const cliente = this.clientes.find(c => c.id === id)
      return cliente ? cliente.name : 'Cliente no encontrado'
    },

    async loadFacturas() {
      try {
        const response = await axiosInstance.get('/facturas')
        this.facturas = response.data
      } catch (error) {
        this.showMessage('Error al cargar facturas', 'error')
      }
    },

    async loadClientes() {
      try {
        const response = await axiosInstance.get('/facturas/clientes')
        this.clientes = response.data
      } catch (error) {
        this.showMessage('Error al cargar clientes', 'error')
      }
    },

    openNewFacturaForm() {
      this.editedFactura = Object.assign({}, this.defaultFactura)
      this.dialog = true
    },

    async editFactura(factura) {
      try {
        // Formatear la fecha para el input type="date"
        const fecha = new Date(factura.fecha)
        const fechaFormateada = fecha.toISOString().split('T')[0]

        // Primero asignar los datos básicos de la factura
        this.editedFactura = {
          ...factura,
          fecha: fechaFormateada,
          id_servicio: null
        }

        // Luego cargar los servicios disponibles del cliente
        await this.handleClienteChange(factura.id_cliente)

        // Obtener el servicio asociado a la factura
        const servicioResponse = await axiosInstance.get(`/servicios/factura/${factura.id}`)
        if (servicioResponse.data) {
          this.editedFactura.id_servicio = servicioResponse.data.id
          // Actualizar el monto si el servicio tiene una póliza asociada
          if (servicioResponse.data.poliza?.precio) {
            this.editedFactura.monto = servicioResponse.data.poliza.precio.toString()
          }
        }

        this.dialog = true
      } catch (error) {
        console.error('Error al cargar datos para edición:', error)
        this.showMessage('Error al cargar datos para edición', 'error')
      }
    },

    async deleteFactura(id) {
      if (confirm('¿Está seguro de eliminar esta factura?')) {
        try {
          await axiosInstance.delete(`/facturas/${id}`)
          this.showMessage('Factura eliminada exitosamente')
          this.loadFacturas()
        } catch (error) {
          this.showMessage('Error al eliminar la factura', 'error')
        }
      }
    },

    async saveFactura() {
      if (!this.$refs.form.validate()) return

      try {
        const facturaData = {
          fecha: this.editedFactura.fecha,
          id_cliente: this.editedFactura.id_cliente,
          id_servicio: this.editedFactura.id_servicio,
          monto: parseFloat(this.editedFactura.monto), // Asegurarse de que el monto sea número
          observaciones: this.editedFactura.observaciones || ''
        }

        if (this.editedFactura.id) {
          await axiosInstance.post(`/facturas/${this.editedFactura.id}`, facturaData)
          this.showMessage('Factura actualizada exitosamente')
        } else {
          const response = await axiosInstance.post('/facturas', facturaData)
          console.log('Factura creada:', response.data)
          this.showMessage('Factura creada exitosamente')
        }

        this.closeDialog()
        await this.loadFacturas()
      } catch (error) {
        console.error('Error completo:', error)
        const errorMessage = error.response?.data?.message || 'Error al guardar la factura'
        this.showMessage(errorMessage, 'error')
      }
    },

    closeDialog() {
      this.$refs.form.reset()
      this.dialog = false
      this.editedFactura = Object.assign({}, this.defaultFactura)
    },

    showMessage(message, color = 'success') {
      this.snackbar.message = message
      this.snackbar.color = color
      this.snackbar.show = true
    },

    // Agregar método para navegación
    navigateTo(route) {
      this.$router.push(route)
    },

    async handleClienteChange(clienteId) {
      this.editedFactura.id_servicio = null
      this.editedFactura.monto = ''
      if (!clienteId) {
        this.serviciosDisponibles = []
        return
      }
      try {
        // Modificar para obtener solo servicios sin factura (excepto el actual en caso de edición)
        const url = this.editedFactura.id
          ? `/servicios/cliente/${clienteId}/servicios-sin-factura/${this.editedFactura.id}`
          : `/servicios/cliente/${clienteId}/servicios-sin-factura`

        const response = await axiosInstance.get(url)
        this.serviciosDisponibles = response.data
        console.log('Servicios disponibles:', {
          clienteId,
          cantidad: response.data.length,
          datos: response.data
        })
      } catch (error) {
        console.error('Error al cargar servicios:', error)
        this.showMessage('Error al cargar servicios disponibles', 'error')
        this.serviciosDisponibles = []
      }
    },

    handleServicioChange(servicioId) {
      if (!servicioId) {
        // No limpiar el monto cuando se deselecciona el servicio
        return
      }
      const servicio = this.serviciosDisponibles.find(s => s.id === servicioId)
      if (servicio) {
        // Sugerir el precio si hay una póliza asociada, pero permitir modificarlo
        if (servicio.poliza?.precio) {
          this.editedFactura.monto = servicio.poliza.precio.toString()
          this.editedFactura.id_poliza = servicio.id_poliza
        }
        // Si no hay póliza, mantener el monto actual o dejarlo vacío si es nueva factura
      }
    },

    async generarPDF(factura) {
      try {
        // Usar el nuevo endpoint específico para PDF
        const response = await axiosInstance.get(`/facturas/${factura.id}/pdf-data`)
        const facturaParaPDF = response.data.factura

        // Agregar log para debug
        console.log('Datos para PDF:', {
            factura: facturaParaPDF,
            servicios: facturaParaPDF.servicios,
            poliza: facturaParaPDF.servicios?.poliza
        })

        const formatters = {
            formatDate: this.formatDate,
            formatPrice: this.formatPrice
        }

        const doc = generateFacturaPDF(facturaParaPDF, formatters)

        this.currentPDFDoc = doc
        const pdfBlob = doc.output('blob')
        this.pdfPreviewUrl = URL.createObjectURL(pdfBlob)
        this.dialogPDF = true
      } catch (error) {
        console.error('Error al generar PDF:', error)
        this.showMessage('Error al generar el PDF', 'error')
      }
    }
  },

  mounted() {
    this.loadFacturas()
    this.loadClientes()
  }
}
</script>

<style scoped>
/* Clases de layout */
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

.v-table td {
  text-align: center;
  padding: 12px !important;
}

.v-table th {
  font-weight: bold;
  text-align: center !important;
}

/* Deep selectors para componentes Vuetify */
:deep(.v-main) {
  height: 100vh;
}

:deep(.v-container) {
  overflow-y: auto;
  max-height: 100%;
}

:deep(.v-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.v-table) {
  border-radius: 8px;
}
</style>
