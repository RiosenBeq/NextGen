import pg8000
import sys

# Add local packages to path
sys.path.append('./.python_packages')

# Connection parameters
# URL: postgres://postgres.crbxcvmwmutrjydjdtla:zOWvr8vxBzmF4ihB@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
user = "postgres.crbxcvmwmutrjydjdtla"
password = "zOWvr8vxBzmF4ihB"
host = "aws-1-us-east-1.pooler.supabase.com"
port = 6543
database = "postgres"

try:
    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database,
        ssl_context=True
    )
    cursor = conn.cursor()
    print("Connected to Supabase PostgreSQL.")

    with open('migration.sql', 'r') as f:
        sql = f.read()
        statements = sql.split(';')
        
        success_count = 0
        error_count = 0
        
        for statement in statements:
            stmt = statement.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                    conn.commit() # Commit after each to isolate errors
                    success_count += 1
                except Exception as e:
                    print(f"\n[ERROR] Statement failed:\n{stmt[:200]}...")
                    print(f"Error Details: {e}")
                    conn.rollback() # Rollback current failed statement
                    error_count += 1
        
    print(f"\nMigration finished: {success_count} success, {error_count} errors.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Connection error: {e}")
