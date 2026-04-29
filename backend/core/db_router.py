from core.tenant_context import get_current_tenant_db
from django.conf import settings

class TenantDatabaseRouter:
    """
    A router to control all database operations on models in the
    SaaS application for multi-tenant database-per-tenant support.
    """

    def _get_target_db(self):
        """
        Internal helper with safety guard and failsafe fallback.
        """
        try:
            # Safety Guard: Master switch must be ENABLED
            if not getattr(settings, 'TENANT_DB_SWITCHING_ENABLED', False):
                return 'default'

            db_name = get_current_tenant_db()
            
            # Failsafe: Ensure target DB exists in settings
            if db_name not in settings.DATABASES:
                return 'default'
                
            return db_name
        except Exception:
            # Failsafe: Never crash the system, fallback to default SQLite
            return 'default'

    def db_for_read(self, model, **hints):
        """
        Attempts to read models from the tenant's dedicated database.
        """
        return self._get_target_db()

    def db_for_write(self, model, **hints):
        """
        Attempts to write models to the tenant's dedicated database.
        """
        return self._get_target_db()

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if both objects are in the same database.
        """
        db_obj1 = getattr(obj1._state, 'db', 'default') if hasattr(obj1, '_state') else 'default'
        db_obj2 = getattr(obj2._state, 'db', 'default') if hasattr(obj2, '_state') else 'default'
        
        if db_obj1 == db_obj2:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Migrations are handled with strict isolation rules.
        """
        # Master migration rule: All system tables live in 'default'
        if db == 'default':
            return True
        
        # Tenant migrations are only allowed on dedicated DBs when enabled
        if getattr(settings, 'TENANT_DB_SWITCHING_ENABLED', False):
            return True
            
        return False
