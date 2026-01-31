'use client';

import { useState } from 'react';
import type { PriceTier } from '@/domain/models';
import { cn } from '@/lib/utils';

interface PriceTierSwitchProps {
  value: PriceTier;
  onChange: (tier: PriceTier, applyToCart: boolean) => void;
  hasCartItems: boolean;
}

const TIER_CONFIG = {
  price1: { label: 'Giá 1', desc: 'Bán lẻ', color: 'blue' },
  price2: { label: 'Giá 2', desc: 'Sỉ', color: 'amber' },
  price3: { label: 'Giá 3', desc: 'Đại lý', color: 'purple' },
} as const;

export function PriceTierSwitch({ value, onChange, hasCartItems }: PriceTierSwitchProps) {
  const [showModal, setShowModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<PriceTier | null>(null);

  const handleTierClick = (tier: PriceTier) => {
    if (tier === value) return;

    if (hasCartItems) {
      setPendingTier(tier);
      setShowModal(true);
    } else {
      onChange(tier, false);
    }
  };

  const handleConfirm = (applyToCart: boolean) => {
    if (pendingTier) {
      onChange(pendingTier, applyToCart);
    }
    setShowModal(false);
    setPendingTier(null);
  };

  return (
    <>
      <div className="price-tier-switch">
        <div className="tier-switch-header">
          <span className="tier-switch-label">Loại giá:</span>
        </div>
        <div className="tier-switch-options">
          {(Object.keys(TIER_CONFIG) as PriceTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const isActive = value === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierClick(tier)}
                className={cn(
                  'tier-switch-btn',
                  `tier-${config.color}`,
                  isActive && 'active'
                )}
              >
                <span className="tier-btn-label">{config.label}</span>
                <span className="tier-btn-desc">{config.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Thay đổi loại giá</h4>
            <p>Áp dụng cho toàn bộ sản phẩm trong giỏ hàng?</p>
            <p className="modal-note">
              (Sản phẩm đã chỉnh giá tay sẽ giữ nguyên)
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleConfirm(false)}
              >
                Chỉ SP mới
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleConfirm(true)}
              >
                Áp dụng tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
