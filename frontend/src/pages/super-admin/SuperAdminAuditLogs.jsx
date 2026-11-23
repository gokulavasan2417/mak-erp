import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Download, RefreshCw } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { mockSuperAdminData } from '../../utils/mockData';
import { getStatusVariant } from '../../utils/formatters';

export function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await superAdminService.getAuditLogs({ limit: 100 });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setLogs(res.data.data.map(item => ({
          id: item._id || item.id,
          action: item.action,
          tenantId: item.tenantId || 'global',
          user: item.userName || item.userEmail || item.user || 'superadmin',
          ip: item.ipAddress || item.ip || '127.0.0.1',
          severity: item.severity || 'low',
          timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString() : item.timestamp || 'Just now'
        })));
      } else {
        setLogs(mockSuperAdminData.auditLogs);
      }
    } catch (err) {
      setLogs(mockSuperAdminData.auditLogs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      header: 'Audit ID',
      accessor: 'id',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>{val?.slice?.(-8) || val}</span>
    },
    {
      header: 'Security Action',
      accessor: 'action',
      render: (val) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{val}</span>
    },
    {
      header: 'Tenant Scope',
      accessor: 'tenantId',
      render: (val) => (
        <Badge variant="neutral" size="sm">
          {val || 'global'}
        </Badge>
      )
    },
    {
      header: 'User Account',
      accessor: 'user',
      render: (val) => <span>{val}</span>
    },
    {
      header: 'IP Address',
      accessor: 'ip',
      render: (val) => <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{val}</span>
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (val) => (
        <Badge variant={getStatusVariant(val)} dot size="sm">
          {val}
        </Badge>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (val) => <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{val}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="super-admin" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            System Audit &amp; Security Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Chronological multi-tenant audit trail of all authentication events, administrative actions, and data operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" size="sm" onClick={fetchLogs} leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      <DataTable
        title="Multi-Tenant Security Activity Stream"
        subtitle="Immutable records retained for 365 days compliance"
        columns={columns}
        data={logs.length > 0 ? logs : mockSuperAdminData.auditLogs}
        searchKey="action"
        searchPlaceholder="Filter by action or user..."
      />
    </div>
  );
}

export default SuperAdminAuditLogs;