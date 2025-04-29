from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('backend', '0002_remove_favorite_created_at_and_more'),  # Keep this as it is
    ]

    operations = [
        # First, make sure the table doesn't exist to avoid errors
        migrations.RunSQL(
            "DROP TABLE IF EXISTS backend_favorite;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Then create it properly
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bar', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='backend.bar')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'bar')},
            },
        ),
    ]
