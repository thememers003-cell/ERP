'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  User,
  Download,
} from 'lucide-react';

interface ReceiptModalProps {
  receiptId: string | null;
  onClose: () => void;
}

export default function ReceiptModal({ receiptId, onClose }: ReceiptModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/fees/receipt/${receiptId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setData(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  if (!receiptId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="receipt-modal-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 700, color: '#047857' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Official Institutional Payment Voucher</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', color: '#fff' }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          id="printable-receipt-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '36px 40px',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              Loading official receipt...
            </div>
          ) : !data ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#ef4444' }}>
              Receipt voucher record not found.
            </div>
          ) : (
            <div>
              {/* Institutional Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '10px',
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '22px',
                    }}
                  >
                    {data.school.code || 'NX'}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                      {data.school.name}
                    </h1>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                      {data.school.address} • Phone: {data.school.phone}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: '#0f172a',
                    }}
                  >
                    FEE RECEIPT
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: 6, fontFamily: 'monospace' }}>
                    {data.receiptNumber}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Date: {new Date(data.paymentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Student & Payment Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>STUDENT DETAILS</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{data.student.name}</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: 2 }}>
                    Admission #: <strong>{data.student.admissionNumber}</strong> • Roll #: <strong>{data.student.rollNumber}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>
                    Class: <strong>{data.student.classGrade} - {data.student.section}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>TRANSACTION & PARENT</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', marginTop: 2 }}>
                    Parent / Guardian: <strong>{data.student.guardianName}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: 2 }}>
                    Mode: <strong>{data.paymentMethod}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
                    Ref #: {data.transactionRef}
                  </div>
                </div>
              </div>

              {/* Fee Particulars Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #0f172a', backgroundColor: '#f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: 800 }}>FEE PARTICULARS</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: 800 }}>BILLED</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: 800 }}>PAID TODAY</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: 800 }}>BALANCE DUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{data.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Invoice #{data.invoiceNumber}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                      ${data.totalInvoiceAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                      ${data.amountPaid.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: data.remainingBalance > 0 ? '#b91c1c' : '#047857' }}>
                      ${data.remainingBalance.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Summary Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <div style={{ width: '280px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Amount Collected:</span>
                    <strong style={{ color: '#047857', fontSize: '15px' }}>${data.amountPaid.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>Account Status:</span>
                    <span style={{ fontWeight: 800, color: data.remainingBalance === 0 ? '#047857' : '#b45309' }}>
                      {data.remainingBalance === 0 ? '100% SETTLED' : 'PARTIAL SETTLEMENT'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stamp & Authorized Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      border: '2px solid #047857',
                      color: '#047857',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontWeight: 900,
                      fontSize: '11px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      transform: 'rotate(-4deg)',
                    }}
                  >
                    ✓ ACCOUNTS OFFICE VERIFIED
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: 8 }}>
                    Computer-generated official receipt • No manual seal required.
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '160px', borderBottom: '1px solid #0f172a', marginBottom: 6 }} />
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Bursar / Cashier Signature</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
