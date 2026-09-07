def get_tenant_db_config(db_name):
    """
    Returns the database configuration for a specific tenant.
    Host/user/password come from the primary DATABASE_URL / env.
    """
    import os

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": db_name,
        "USER": os.getenv("PGUSER") or os.getenv("POSTGRES_USER") or "",
        "PASSWORD": os.getenv("PGPASSWORD") or os.getenv("POSTGRES_PASSWORD") or "",
        "HOST": os.getenv("PGHOST") or os.getenv("POSTGRES_HOST") or "localhost",
        "PORT": os.getenv("PGPORT") or os.getenv("POSTGRES_PORT") or "5432",
    }
