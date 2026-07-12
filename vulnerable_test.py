import sqlite3

def get_user_data(username):
    # Hardcoded credentials (Vulnerability 1)
    db_user = "admin"
    db_pass = "super_secret_password_123!"

    # Connect to database
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()

    # SQL Injection (Vulnerability 2) - directly concatenating user input
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    
    cursor.execute(query)
    result = cursor.fetchall()
    
    conn.close()
    return result

def slow_loop(n):
    # This is an unoptimized loop just to test the optimization phase
    result = []
    for i in range(n):
        for j in range(i, n):
            result.append(i * j)
    return result

if __name__ == "__main__":
    print(get_user_data("admin' OR '1'='1"))
    print(slow_loop(10))
