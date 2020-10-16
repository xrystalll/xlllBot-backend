# xlllBot backend

## Возможности бота
- Уведомления в чат и дашборд:
  - подписка
  - переподписка
  - подарочная подписка
  - продление подарочной подписки
  - продление анонимной подарочной подписки
  - рейд
  - битсы
- Автоматический бан за слова добавленные в список запрещенных через дашборд
- Стандартные команды чата:
  - !uptime - узнать продолжительность стрима
  - !followage - узнать как давно зритель зафоловлен на канал
  - !ping - мини-игра "Пинг Понг"
  - !size - мини-игра "Размер..."
  - !sr - Заказ видео в чате. Видео добавляется в список воспроизведения в дашборде где его можно посмотреть, удалить, пропустить и т.д.
  - !skip - Возможность для модераторов пропускать запущенное в дашборде видео
  - !mute, !ban, !unban - Полная или временная блокировка зрителя в чате и снятие ограничения
  - !game - Установка категории стрима. Можно указывать полные названия категорий или воспользоваться имеющимися сокращениями из списка. Только для владельца и модераторов
  - !title - Установка заголовка стрима. Только для владельца и модераторов
  - !poll - Создать голосование через сервис StrawPoll. Только для владельца и модераторов
- Собственные команды добавленные через дашборд
- Автоматическая отправка команд в чат через установленный промежуток времени
- Настройки для включения/выключения некоторых функций или ограничения для простых зрителей
- Одновременная работа бота на нескольких разных каналах
- Новый канал может быть добавлен в бота только если он есть в списке приглашенных
- Авторизация и регистрация канала в боте через Twitch в дашборде

## Дашборд
Панель управления на React js - https://github.com/xrystalll/xlllBot-client

Работает на rest api и socket.io с фронтенда бота

## Установка и запуск
- Клонировать и установить зависимости
  - `git clone https://github.com/xrystalll/xlllBot-backend.git`
  - `cd xlllBot-backend`
  - `npm install`
- Переименовать файл `default.example.json` в `default.json` в папке `/config`
- Заполнить все поля
  - Получить Oauth токен для бота - https://twitchapps.com/tmi
  - Создать Twitch приложение, получить id клиента и секретный ключ - https://dev.twitch.tv/console/apps
  - Создать облачную базу данных MongoDB на https://mongodb.com и указать полученный url или использавать локальную и указать локальный адрес
  - Указать адрес, на котором у вас будет находится дашборд
- Запустить Redis (Устанавливается отдельно на вашу ОС https://redis.io)
- Запустить командой `npm start` или в режиме разработки `npm run dev`
- Добавить необходимый канал в список приглашенных по url в браузере - `http://АДРЕС НА КОТОРОМ ЗАПУЩЕН СЕРВЕР БОТА/api/invite/add?channel=ИМЯ КАНАЛА` (не самая лучшая функция инвайтов, но пока так Ыы)
- Зайти в дашборд (устанавливается отдельно) и авторизоваться через Twitch. При первом входе канал добавится в базу данных
- Активировать, нажав на переключатель состояния бота, в дашборде. Бот подключится к чату (при перезапуске сервера бота нужно активировать заново)

Далее дашборд нужен только для различных настроек, добавления команд, запрещенных слов, просмотра событий в чате и просмотра заказанных видео

Sorry that the description is in Russian only ;)
