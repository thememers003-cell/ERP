'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
}

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive,
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div>
        <span className="metric-label">{label}</span>
        <div className="metric-value">{value}</div>
        {(subtext || trend) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}>
            {trend && (
              <span
                style={{
                  fontWeight: 600,
                  color: trendPositive ? 'var(--status-success)' : 'var(--status-danger)',
                }}
              >
                {trend}
              </span>
            )}
            {subtext && <span style={{ color: 'var(--text-subtle)' }}>{subtext}</span>}
          </div>
        )}
      </div>
      <div className="metric-icon-wrap">
        <Icon size={22} />
      </div>
    </div>
  );
}
