import logging
import psycopg2
from psycopg2 import sql
from django.conf import settings
from django.db import connections
from django.core.management import call_command

logger = logging.getLogger('tenant')

def run_tenant_migrations(db_name, school_name="Unknown"):
    """
    Executes migrations for a specific tenant database by injecting it into settings.
    """
    try:
        logger.info(f"[TENANT SYSTEM] School: {school_name} | Database: {db_name} | Step: MIGRATE | Status: INITIATING")
        
        # Inject the database connection into Django's settings at runtime
        if db_name not in settings.DATABASES:
            # Copy default configuration and update the name
            new_db_config = settings.DATABASES['default'].copy()
            new_db_config['NAME'] = db_name
            settings.DATABASES[db_name] = new_db_config

        # Run migrations on the new database
        call_command('migrate', database=db_name, interactive=False)
        
        logger.info(f"[TENANT SYSTEM] School: {school_name} | Database: {db_name} | Step: MIGRATE | Status: SUCCESS")
        return True
    except Exception as e:
        logger.error(f"[TENANT SYSTEM] School: {school_name} | Database: {db_name} | Step: MIGRATE | Status: FAILED | Error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def create_tenant_database(school):
    """
    Creates a new PostgreSQL database for the tenant and runs migrations.
    """
    db_name = school.database_name
    if not db_name:
        logger.error(f"[TENANT SYSTEM] School: {school.name} | Step: VALIDATE | Status: FAILED | Error: No database_name defined")
        return False

    # 1. Database Creation Step
    try:
        logger.info(f"[TENANT SYSTEM] School: {school.name} | Database: {db_name} | Step: CREATE | Status: INITIATING")
        
        default_db = settings.DATABASES['default']
        
        # Connect to 'postgres' database to create the new one
        conn = psycopg2.connect(
            dbname='postgres',
            user=default_db['USER'],
            password=default_db['PASSWORD'],
            host=default_db['HOST'],
            port=default_db['PORT']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database already exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
            logger.info(f"[TENANT SYSTEM] School: {school.name} | Database: {db_name} | Step: CREATE | Status: SUCCESS")
        else:
            logger.info(f"[TENANT SYSTEM] School: {school.name} | Database: {db_name} | Step: CREATE | Status: ALREADY EXISTS")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"[TENANT SYSTEM] School: {school.name} | Database: {db_name} | Step: CREATE | Status: FAILED | Error: {str(e)}")
        return False

    # 2. Migration Step
    return run_tenant_migrations(db_name, school_name=school.name)
