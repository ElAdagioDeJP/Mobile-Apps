from werkzeug.security import generate_password_hash
password = "entrenador1234"  # Usa la contraseña que deseas
hashed_password = generate_password_hash(password)
print(hashed_password)