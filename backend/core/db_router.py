from core.tenant_context import get_current_tenant_db
from django.conf import settings

class TenantDatabaseRouter:
    """
    A router to control all database operations on models in the
    SaaS application for multi-tenant database-per-tenant support.
    """

    # Apps that must always stay in the 'default' (Public) database
    PUBLIC_APPS = [
        'users',
        'schools',
        'admin',
        'contenttypes',
        'sessions',
        'auth',
        'core', # Shared notifications and activity logs
    ]

    def _get_target_db(self, model):
        """
        Internal helper to determine the target database based on app_label.
        """
        # If the app is a public app, always use 'default'
        if model._meta.app_label in self.PUBLIC_APPS:
            return 'default'

        try:
            # Safety Guard: Master switch must be ENABLED
            if not getattr(settings, 'TENANT_DB_SWITCHING_ENABLED', False):
                return 'default'

            db_name = get_current_tenant_db()
            
            # Failsafe: Ensure target DB exists in settings
            if not db_name or db_name not in settings.DATABASES:
                return 'default'
                
            return db_name
        except Exception:
            # Failsafe: Never crash the system, fallback to default
            return 'default'

    def db_for_read(self, model, **hints):
        """
        Attempts to read models from the appropriate database.
        """
        return self._get_target_db(model)

    def db_for_write(self, model, **hints):
        """
        Attempts to write models to the appropriate database.
        """
        return self._get_target_db(model)

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations between objects in the same database or between 
        public apps and tenant apps (depending on your architecture).
        For simplicity, we allow all relations here, but Django will still 
        enforce some constraints.
        """
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Migrations are handled with strict isolation rules.
        """
        # Public apps only migrate on 'default'
        if app_label in self.PUBLIC_APPS:
            return db == 'default'
        
        # Tenant apps migrate on 'default' (for shared testing) AND on tenant DBs
        if db == 'default':
            return True
            
        if getattr(settings, 'TENANT_DB_SWITCHING_ENABLED', False):
            # Dedicated tenant DBs only get tenant apps
            return app_label not in self.PUBLIC_APPS
            
        return False
