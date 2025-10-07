# 🚀 Деплой на Render.com

Render.com - хорошая альтернатива для Socket.io приложений!

## 📋 Пошаговая инструкция:

### 1. **Подготовка проекта:**
```bash
npm install
npm run build
```

### 2. **Создание аккаунта Render:**
1. Перейдите на [render.com](https://render.com)
2. Войдите через GitHub
3. Подтвердите email

### 3. **Деплой проекта:**
1. Нажмите "New +"
2. Выберите "Web Service"
3. Подключите GitHub репозиторий
4. Настройки:
   - **Name**: voice-chat
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 4. **Настройка переменных окружения:**
В Render Dashboard → Environment:
```bash
NODE_ENV=production
CLIENT_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.onrender.com
```

## ⚠️ **Ограничения Render Free:**

- **Спит после 15 минут неактивности**
- **Первый запрос может быть медленным (cold start)**
- **Ограничения на время выполнения**

## 🔧 **Преимущества Render:**

- ✅ **Поддержка WebSocket**
- ✅ **Автоматический HTTPS**
- ✅ **Простой деплой**
- ✅ **Бесплатный план**

## 🎯 **Рекомендация:**

**Railway** все еще лучше для Socket.io, но Render - хорошая альтернатива!
