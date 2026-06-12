"""DEPRECATED — онбординг переехал в Mini App (Фаза 3.5).

Раньше здесь жил FSM-онбординг на 11 шагов внутри бота. По решению продукта
анкета теперь заполняется в Mini App (экраны 3–13), а создание профиля идёт
через API: POST /profiles → загрузка фото /photos → POST /profiles/finalize.

Бот сведён к лаунчеру: см. bot/handlers/start.py (проверка @username + кнопка
запуска Mini App) и api/notify.py (уведомления о мэтчах).

Файлы bot/states/onboarding.py и часть bot/keyboards/inline.py (multiselect,
nationality_kb и т.п.) остались от прежней реализации и сейчас не используются.
Их можно удалить при следующей чистке.
"""
