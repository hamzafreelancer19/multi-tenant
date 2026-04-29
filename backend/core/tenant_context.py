import threading

# Thread-local storage for tenant context
_thread_locals = threading.local()

def set_current_tenant_db(db_name):
    """
    Sets the database name for the current request thread.
    """
    setattr(_thread_locals, 'tenant_db', db_name)

def get_current_tenant_db():
    """
    Retrieves the database name for the current request thread.
    Defaults to 'default' if no tenant context is set.
    """
    return getattr(_thread_locals, 'tenant_db', 'default')

def clear_tenant_context():
    """
    Clears the tenant context from the current thread.
    """
    if hasattr(_thread_locals, 'tenant_db'):
        delattr(_thread_locals, 'tenant_db')
