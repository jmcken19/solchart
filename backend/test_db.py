from db import get_connection

connection = get_connection()
cursor = connection.cursor()

cursor.execute("SELECT NOW();")
result = cursor.fetchone()

print("Database connected successfully")
print(result)

cursor.close()
connection.close()