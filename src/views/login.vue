<template>
    <div>
        <h1>Login</h1>
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" v-model="username" />
            <label for="password">Password:</label>
            <input type="password" id="password" v-model="password" />
            <button @click="login">Login</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const password = ref('')

const login = () => {
    console.log(username.value, password.value)
}

</script>