// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');
    const userPanel = document.getElementById('user-panel');
    const userEmailSpan = document.getElementById('user-email');
    const messageDiv = document.getElementById('auth-message');

    // Función auxiliar para mostrar mensajes en pantalla
    function showMessage(text, type = 'error') {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }

    function clearMessage() {
        messageDiv.textContent = '';
        messageDiv.className = 'message hidden';
    }

    // Comprobar la sesión actual al cargar la página
    async function checkSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        updateUI(session?.user || null);
    }

    // Actualizar la interfaz dependiendo de si el usuario inició sesión
    function updateUI(user) {
        if (user) {
            authForm.classList.add('hidden');
            userPanel.classList.remove('hidden');
            userEmailSpan.textContent = user.email;
        } else {
            authForm.classList.remove('hidden');
            userPanel.classList.add('hidden');
            userEmailSpan.textContent = '';
        }
    }

    // 1. Iniciar Sesión (Login)
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage();

        const email = emailInput.value;
        const password = passwordInput.value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showMessage(`Error al iniciar sesión: ${error.message}`, 'error');
        } else {
            showMessage('Sesión iniciada correctamente', 'success');
            updateUI(data.user);
        }
    });

    // 2. Registrar Usuario (Sign Up)
    btnSignup.addEventListener('click', async () => {
        clearMessage();

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage('Introduce un email y contraseña para registrarte.', 'error');
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            showMessage(`Error al registrarse: ${error.message}`, 'error');
        } else {
            showMessage('Registro completado. Revisa tu email para confirmar la cuenta.', 'success');
        }
    });

    // 3. Cerrar Sesión (Logout)
    btnLogout.addEventListener('click', async () => {
        clearMessage();
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            showMessage(`Error al cerrar sesión: ${error.message}`, 'error');
        } else {
            updateUI(null);
        }
    });

    // Escuchar cambios de estado en la autenticación automáticamente
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateUI(session?.user || null);
    });

    // Inicializar comprobación de sesión
    checkSession();
});