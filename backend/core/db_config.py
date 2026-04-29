def get_tenant_db_config(db_name):
    """
    Returns the database configuration for a specific tenant.
    Currently configured for PostgreSQL in production-ready environments.
    """
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': '',      # To be provided via environment variables
        'PASSWORD': '',  # To be provided via environment variables
        'HOST': 'localhost',
        'PORT': '5432',
    }
