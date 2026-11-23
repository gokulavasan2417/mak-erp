import React from 'react';
import { ShieldCheck, Plus, Lock } from 'lucide-react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { mockSuperAdminData } from '../../utils/mockData';

export function SuperAdminRoles() {
  const columns = [
    {
      header: 'Role Identifier',
      accessor: 'id',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span>
    },
    {
      header: 'Role Name',
      accessor: 'name',
      render: (val) => <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{val}</span>
    },
    {
      header: 'Active Users',
      accessor: 'usersCount',
      render: (val) => <Badge variant="neutral" size="sm">{val} Members</Badge>
    },
    {
      header: 'Permission Scope',
      accessor: 'permissions',
      render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      header: 'Access Tier',
      accessor: 'accessLevel',
      render: (val) => (
        <Badge variant={val === 'Tier 1' ? 'danger' : val === 'Tier 2' ? 'primary' : 'info'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: () => <Button variant="secondary" size="sm">Configure Matrix</Button>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="super-admin" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            Roles &amp; Privilege Matrix
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Define RBAC security boundaries, privilege delegation, and multi-tenant access tiers.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus size={15} />}>
          Define New Role
        </Button>
      </div>

      <DataTable
        title="Configured ERP System Roles"
        subtitle="Security privilege groups governing all 4 portals"
        columns={columns}
        data={mockSuperAdminData.roles}
        searchKey="name"
      />
    </div>
  );
}

export default SuperAdminRoles;
