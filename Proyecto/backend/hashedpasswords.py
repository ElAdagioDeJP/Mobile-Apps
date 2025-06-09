from werkzeug.security import generate_password_hash
password = ""  # Usa la contraseña que deseas
hashed_password = generate_password_hash(password)
print(hashed_password)