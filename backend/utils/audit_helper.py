"""
Audit logging helper functions
"""
from typing import Optional, Dict, Any
from datetime import datetime
from utils import db, get_malaysia_time


async def log_audit(
    user_id: str,
    user_email: str,
    action: str,
    resource_type: str,
    resource_id: str,
    old_data: Optional[Dict[str, Any]] = None,
    new_data: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """
    Log an admin action to the audit trail
    
    Args:
        user_id: ID of the user performing the action
        user_email: Email of the user
        action: Type of action (create, update, delete)
        resource_type: Type of resource being modified
        resource_id: ID of the resource
        old_data: Previous state of the resource (for updates/deletes)
        new_data: New state of the resource (for creates/updates)
        ip_address: IP address of the request
    """
    from models.audit import AuditLog
    
    audit_log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address
    )
    
    doc = audit_log.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.audit_logs.insert_one(doc)
    
    return audit_log.id


async def get_audit_logs_for_resource(resource_type: str, resource_id: str):
    """
    Get all audit logs for a specific resource
    """
    logs = await db.audit_logs.find(
        {
            "resource_type": resource_type,
            "resource_id": resource_id
        },
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    # Convert timestamp strings back to datetime
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs
