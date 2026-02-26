 // Общие функции авторизации для всех страниц
const Auth = {
    // Проверка авторизации
    checkAuth: function() {
         return lsGet('authenticated') === 'true' || 
             sessionStorage.getItem('authenticated') === 'true';
    },
    
    // Получение имени пользователя
    getUsername: function() {
         return lsGet('username') || 
             sessionStorage.getItem('username') || 
               'Пользователь';
    },
    
    // Вход в систему
    login: function(username, rememberMe = false) {
        if (rememberMe) {
            lsSet('authenticated', 'true');
            lsSet('username', username);
        } else {
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('username', username);
        }
        
        // Перенаправление на защищенную страницу
        window.location.href = 'profile.html';
    },
    
    // Выход из системы
    logout: function() {
        lsRemove('authenticated');
        lsRemove('username');
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('username');
        
        // Перенаправление на страницу входа
        window.location.href = 'index.html';
    },
    
    // Защита страницы - проверка доступа
    protectPage: function() {
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },
    
    // Обновление интерфейса для авторизованного пользователя
    updateUI: function() {
        const username = this.getUsername();
        const userElements = document.querySelectorAll('[data-username]');
        
        userElements.forEach(element => {
            element.textContent = username;
        });
    }
};