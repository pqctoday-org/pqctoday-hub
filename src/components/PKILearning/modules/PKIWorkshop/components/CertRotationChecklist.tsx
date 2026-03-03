// SPDX-License-Identifier: GPL-3.0-only
import { OpsChecklist, type ChecklistSection } from '@/components/PKILearning/common/OpsChecklist'

const sections: ChecklistSection[] = [
  {
    title: 'Pre-Rotation',
    items: [
      {
        id: 'pre-backup-ca',
        label: 'Backup current CA certificates and private keys',
        critical: true,
      },
      {
        id: 'pre-verify-chain',
        label: 'Verify new PQC/hybrid CA chain with `openssl verify`',
      },
      {
        id: 'pre-test-compat',
        label: 'Test hybrid certificate compatibility with target clients',
      },
      {
        id: 'pre-ocsp-oids',
        label: 'Confirm OCSP responder supports new algorithm OIDs',
      },
      {
        id: 'pre-crl-dist',
        label: 'Review CRL distribution points for new CA',
      },
    ],
  },
  {
    title: 'Rotation Execution',
    items: [
      {
        id: 'exec-gen-root',
        label: 'Generate new root CA with PQC algorithm (ML-DSA-65 or hybrid)',
      },
      {
        id: 'exec-issue-intermediate',
        label: 'Issue new intermediate CA certificates',
      },
      {
        id: 'exec-rekey-ee',
        label: 'Re-key all end-entity certificates',
      },
      {
        id: 'exec-update-trust',
        label: 'Update trust stores on all servers and clients',
        critical: true,
      },
      {
        id: 'exec-deploy-staging',
        label: 'Deploy to staging environment first',
      },
    ],
  },
  {
    title: 'Post-Rotation Verification',
    items: [
      {
        id: 'post-tls-handshake',
        label: 'Verify TLS handshakes complete successfully',
      },
      {
        id: 'post-ocsp-stapling',
        label: 'Check OCSP stapling responses',
      },
      {
        id: 'post-monitor-errors',
        label: 'Monitor error rates for 24 hours',
        critical: true,
      },
      {
        id: 'post-browser-chain',
        label: 'Validate certificate chain in browser dev tools',
      },
      {
        id: 'post-auto-renewal',
        label: 'Confirm automated renewal processes work',
      },
    ],
  },
  {
    title: 'Rollback Procedure',
    items: [
      {
        id: 'rollback-restore-ca',
        label: 'Restore original CA certificates from backup',
        critical: true,
      },
      {
        id: 'rollback-redeploy-trust',
        label: 'Re-deploy previous trust stores',
      },
      {
        id: 'rollback-verify-handshakes',
        label: 'Verify rollback handshakes succeed',
      },
      {
        id: 'rollback-document',
        label: 'Document incident and root cause',
      },
    ],
  },
]

export const CertRotationChecklist: React.FC = () => {
  return (
    <OpsChecklist
      title="PQC Certificate Rotation Checklist"
      description="Step-by-step procedure for rotating certificates to PQC or hybrid algorithms"
      sections={sections}
    />
  )
}
