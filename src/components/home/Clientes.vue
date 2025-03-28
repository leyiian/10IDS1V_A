<template>
  <v-card flat class="fill-height mx-auto" max-width="1400px">
    <!-- Botón para nuevo cliente -->
    <v-card-text class="d-flex justify-end mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openNewUserForm"
      >
        Nuevo Usuario
      </v-btn>
    </v-card-text>

    <!-- Tabla de clientes -->
    <v-card-text class="fill-height">
      <v-table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>RFC</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.rfc }}</td>
            <td>{{ user.contacto }}</td>
            <td>{{ user.telefono_contacto }}</td>
            <td>{{ user.direccion }}</td>
            <td>{{ user.rol }}</td>
            <td>
              <v-btn icon="mdi-pencil" size="small" color="primary" class="mr-2" @click="editUser(user)">
              </v-btn>
              <v-btn icon="mdi-delete" size="small" color="error" @click="deleteUser(user.id)">
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <!-- Diálogo para editar/crear usuario -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveUser">
            <v-text-field 
              v-model="editedUser.name" 
              label="Nombre *"
              :rules="[v => !!v || 'El nombre es requerido']"
              required
            ></v-text-field>
            
            <v-text-field 
              v-model="editedUser.email" 
              label="Email *" 
              type="email"
              :rules="[
                v => !!v || 'El email es requerido',
                v => /.+@.+\..+/.test(v) || 'Email debe ser válido'
              ]"
              required
            ></v-text-field>

            <v-text-field
              v-if="!editedUser.id"
              v-model="editedUser.password"
              label="Contraseña"
              type="password"
              hint="Dejar en blanco para usar contraseña por defecto"
              persistent-hint
            ></v-text-field>

            <v-text-field v-model="editedUser.rfc" label="RFC"></v-text-field>
            <v-text-field v-model="editedUser.contacto" label="Contacto"></v-text-field>
            <v-text-field v-model="editedUser.telefono_contacto" label="Teléfono"></v-text-field>
            <v-text-field v-model="editedUser.direccion" label="Dirección"></v-text-field>
            <v-select v-model="editedUser.rol" :items="roles" label="Rol"></v-select>

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
  </v-card>
</template>

<script>
import axiosInstance from '@/config/axios';

export default {
  name: 'Clientes',

  data: () => ({
    dialog: false,
    users: [],
    snackbar: {
      show: false,
      message: '',
      color: 'success'
    },
    editedUser: {
      id: '',
      name: '',
      email: '',
      rfc: '',
      contacto: '',
      telefono_contacto: '',
      direccion: '',
      rol: null
    },
    defaultUser: {
      id: '',
      name: '',
      email: '',
      password: '', // Agregar campo password
      rfc: '',
      contacto: '',
      telefono_contacto: '',
      direccion: '',
      rol: 'C' // Valor por defecto
    },
    roles: ['A', 'T', 'C'],
  }),

  computed: {
    formTitle() {
      return this.editedUser.id ? 'Editar Usuario' : 'Nuevo Usuario'
    },
    
    formRules() {
      return {
        required: v => !!v || 'Este campo es requerido',
        email: v => /.+@.+\..+/.test(v) || 'Email debe ser válido',
        rfc: v => !v || /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/.test(v) || 'RFC inválido'
      }
    }
  },

  methods: {
    navigateTo(route) {
      this.$router.push(route);
    },
    async loadUsers() {
      try {
        const response = await axiosInstance.get('/users')
        this.users = response.data
      } catch (error) {
        console.error('Error al cargar usuarios:', error)
      }
    },

    editUser(user) {
      this.editedUser = Object.assign({}, user)
      this.dialog = true
    },

    async deleteUser(id) {
      if (confirm('¿Está seguro de eliminar este usuario?')) {
        try {
          await axiosInstance.delete(`/users/${id}`)
          this.loadUsers()
        } catch (error) {
          console.error('Error al eliminar usuario:', error)
        }
      }
    },

    openNewUserForm() {
      this.editedUser = Object.assign({}, this.defaultUser)
      this.dialog = true
    },

    async saveUser() {
      try {
        if (!this.$refs.form.validate()) return;

        const userData = {
          username: this.editedUser.name,  // Cambiado para coincidir con el backend
          email: this.editedUser.email,
          password: this.editedUser.password || 'default123', // Agregar contraseña por defecto
          rfc: this.editedUser.rfc,
          contacto: this.editedUser.contacto,
          telefono_contacto: this.editedUser.telefono_contacto,
          direccion: this.editedUser.direccion,
          rol: this.editedUser.rol
        };

        console.log('Datos a enviar:', userData);

        if (this.editedUser.id) {
          await axiosInstance.post(`/users/${this.editedUser.id}`, this.editedUser)
          this.showMessage('Usuario actualizado exitosamente');
        } else {
          await axiosInstance.post('/register', userData)
          this.showMessage('Usuario creado exitosamente');
        }
        
        this.closeDialog()
        await this.loadUsers()
      } catch (error) {
        console.error('Error completo:', error.response);
        const errorMessage = error.response?.data?.message || 'Error al guardar usuario';
        this.showMessage(errorMessage, 'error');
      }
    },

    showMessage(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color
      }
    },

    closeDialog() {
      this.dialog = false
      this.editedUser = Object.assign({}, this.defaultUser)
    }
  },

  mounted() {
    this.loadUsers()
  }
}
</script>

<style scoped>
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

:deep(.v-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.v-table) {
  border-radius: 8px;
}
</style>
