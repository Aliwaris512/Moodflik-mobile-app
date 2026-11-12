# Moodflik backend (Django + DRF + Channels)

## Run locally (Windows, Python 3.12)

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install Django==4.2.24 djangorestframework==3.16.1 djangorestframework_simplejwt==5.5.1 django-cors-headers==3.13.0 django-environ==0.12.0 django-filter==22.1 channels==4.3.1 daphne==4.2.1 channels_redis==4.3.0 redis==6.4.0 boto3 python-dotenv pytz Pillow
copy .env.example .env
.venv\Scripts\python manage.py makemigrations authentication chat post   # migrations are gitignored
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py runserver 0.0.0.0:8000
```

- Emails (activation links, password-reset OTPs) print in this console while `EMAIL_BACKEND` is the console backend.
- Tests: `.venv\Scripts\python manage.py test authentication`
- The mobile app finds this server automatically from the Expo dev host (`http://<your-pc>:8000/api`).
  Set `EXPO_PUBLIC_API_URL` to point it elsewhere.
