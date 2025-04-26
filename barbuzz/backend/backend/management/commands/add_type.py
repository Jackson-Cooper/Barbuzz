from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Add the type column to the bar table'
    
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'backend_bar' AND column_name = 'type'
            """)
            if not cursor.fetchone():
                self.stdout.write("Adding 'type' column...")
                try:
                    # Add the column with a default value
                    cursor.execute("ALTER TABLE backend_bar ADD COLUMN type varchar(50) DEFAULT 'bar'")
                    self.stdout.write(self.style.SUCCESS("Added 'type' column successfully"))
                except Exception as e:
                    self.stderr.write(f"Error adding column: {e}")
            else:
                self.stdout.write("Column 'type' already exists")

            # Show all columns for verification
            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'backend_bar'")
            columns = [row[0] for row in cursor.fetchall()]
            self.stdout.write("Columns in backend_bar table:")
            for col in columns:
                self.stdout.write(f"- {col}")