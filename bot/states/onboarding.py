"""FSM-состояния онбординга. Порядок = порядок шагов анкеты."""
from __future__ import annotations

from aiogram.fsm.state import State, StatesGroup


class Onboarding(StatesGroup):
    name = State()          # 1. Имя
    gender = State()        # 2. Пол
    looking_for = State()   # 3. Кого ищет
    birth_year = State()    # 4. Год рождения
    city = State()          # 5. Город
    nationality = State()   # 6. Своя национальность (можно пропустить)
    pref_nat = State()      # 7. Кого хочет видеть (multiselect / не важно)
    languages = State()     # 8. Языки общения (multiselect)
    intention = State()     # 9. Намерение
    bio = State()           # 10. О себе (можно пропустить)
    photos = State()        # 11. Фото (минимум 1)
