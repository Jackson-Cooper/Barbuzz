# Generated by Django 5.2 on 2025-04-30 06:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0003_create_favorite_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='bar',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='bar',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
