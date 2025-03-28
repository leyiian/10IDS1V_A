<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import axios from '../config/axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export default defineComponent({
  name: 'LoginForm',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const errorMessage = ref('');
    const router = useRouter();
    const loading = ref(false);
    const showPassword = ref(false);
    const form = ref(null);

    const rules = {
      email: [
        (v: string) => !!v || 'El email es requerido',
        (v: string) => /.+@.+\..+/.test(v) || 'El email debe ser válido',
      ],
      password: [
        (v: string) => !!v || 'La contraseña es requerida',
        (v: string) => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres',
      ],
    };
    const handleSubmit = async () => {
  if (!form.value) return;



  try {
    loading.value = true;
    error.value = '';

    const credentials: LoginCredentials = {
      email: email.value,
      password: password.value,
    };

    const response = await axios.post<LoginResponse>(
      'https://web-production-6342.up.railway.app/api/login',
      credentials
    );

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userEmail', email.value);
    await router.push('/home/clientes');  // Use the URL directly


  } catch (err) {
    if (err instanceof AxiosError) {
      error.value = err.response?.data?.message || 'Error al iniciar sesión.';
    } else {
      error.value = 'Ocurrió un error inesperado.';
    }
  } finally {
    loading.value = false;
  }
};


    return {
      email,
      password,
      error,
      loading,
      showPassword,
      form,
      rules,
      handleSubmit,
      errorMessage
    };
  }
});
</script>


<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12 rounded-lg login-card" :loading="loading" theme="dark">
          <v-card-title class="text-center pt-8 pb-4">
            <span class="text-h4 font-weight-bold gradient-text">Iniciar Sesión</span>
          </v-card-title>

          <v-card-text class="px-6">
            <v-form ref="form" @submit.prevent="handleSubmit" class="mt-4">
              <v-text-field v-model="email" :rules="rules.email" label="Email" prepend-inner-icon="mdi-email"
                variant="outlined" required color="primary" bg-color="rgba(255, 255, 255, 0.05)"
                class="custom-field mb-4" />

              <v-text-field v-model="password" :rules="rules.password" :type="showPassword ? 'text' : 'password'"
                label="Contraseña" prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" variant="outlined" required
                color="primary" bg-color="rgba(255, 255, 255, 0.05)" class="custom-field mb-6"
                @click:append-inner="showPassword = !showPassword" />

              <v-alert v-if="error" type="error" variant="tonal" class="mb-6" density="comfortable">
                {{ error }}
              </v-alert>

              <v-btn type="submit" color="primary" block size="large" height="56" class="gradient-button mb-4"
                :loading="loading" :disabled="loading">
                Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-card {
  background: linear-gradient(145deg, #1a1a1a, #2d2d2d) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gradient-text {
  background: linear-gradient(45deg, #4a90e2, #6e8efb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gradient-button {
  background: linear-gradient(45deg, #4a90e2, #6e8efb) !important;
  color: white !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
  text-transform: none;
}

:deep(.custom-field) {
  border-radius: 8px;
}

:deep(.v-field) {
  border-color: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(5px);
}

:deep(.v-field:hover) {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.v-field--focused) {
  border-color: #4a90e2 !important;
}

:deep(.v-field__input) {
  color: white !important;
  padding: 8px 0;
}

:deep(.v-label) {
  opacity: 0.7;
  font-size: 0.95rem;
}

:deep(.v-label--floating) {
  color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.v-icon) {
  color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.mdi-eye),
:deep(.mdi-eye-off) {
  opacity: 0.7;
  cursor: pointer;
}

:deep(.v-alert) {
  background-color: rgba(220, 53, 69, 0.1) !important;
  color: #ff4444 !important;
}
</style>
