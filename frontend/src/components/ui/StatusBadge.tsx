import React from 'react';
import { Badge } from './Badge';
import { DonationStatus, PickupStatus } from '../../types';

interface StatusBadgeProps {
  status: DonationStatus | PickupStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'AVAILABLE':
        return { variant: 'success' as const, label: 'Available' };
      case 'OFFERED':
        return { variant: 'info' as const, label: 'Offered' };
      case 'PARTIALLY_ALLOCATED':
        return { variant: 'teal' as const, label: 'Partially Allocated' };
      case 'FULLY_ALLOCATED':
        return { variant: 'teal' as const, label: 'Fully Allocated' };
      case 'CLAIMED':
        return { variant: 'primary' as const, label: 'Claimed' };
      case 'PICKUP_SCHEDULED':
      case 'ASSIGNED':
        return { variant: 'warning' as const, label: 'Pickup Scheduled' };
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'EN_ROUTE':
        return { variant: 'info' as const, label: 'In Transit' };
      case 'DELIVERED':
      case 'COMPLETED':
        return { variant: 'success' as const, label: 'Completed' };
      case 'EXPIRED':
        return { variant: 'danger' as const, label: 'Expired' };
      case 'CANCELLED':
      case 'FAILED':
        return { variant: 'danger' as const, label: status };
      default:
        return { variant: 'neutral' as const, label: status };
    }
  };

  const config = getBadgeConfig();
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
};
