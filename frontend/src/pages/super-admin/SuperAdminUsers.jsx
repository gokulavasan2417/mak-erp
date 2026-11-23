import React, { useState } from 'react';
import { UserPlus, Shield, Mail, Filter } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { mockSuperAdminData } from '../../utils/mockData';
import { getStatusVariant } from '../../utils/formatters';

export function SuperAdminUsers() {
  const [users] = useState(mockSuperAdminData.systemUsers);

  const columns = [
    {
      header: 'Full Name',
      accessor: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>
    },
    {
      header: 'Portal Assigned',
      accessor: 'portal',
      render: (val) => (
        <Badge variant={val === 'Super Admin' ? 'danger' : val === 'Admin' ? 'primary' : 'neutral'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant={getStatusVariant(val)} dot size="sm">
          {val}
        </Badge>
      )
    },
    {
      header: 'Last Active',
      accessor: 'lastActive'
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm">Edit</Button>
          <Button variant="ghost" size="sm" style={{ color: 'var(--status-danger)' }}>Suspend</Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <Breadcrumbs portal="super-admin" />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            System User Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage administrative identities, role memberships, and security credentials across all 4 ERP portals.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<UserPlus size={15} />}>
          Invite New Administrator
        </Button>
      </div>

      <DataTable
        title="Active Administrative Accounts"
        subtitle="Total 1,428 active user profiles authenticated across the system"
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search users by name or email..."
      />
    </div>
  );
}

export default SuperAdminUsers;
