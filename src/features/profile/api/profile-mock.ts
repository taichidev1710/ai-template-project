import type { Profile } from '../types';

/**
 * Seed data for the in-memory demo store (see profile-api.ts). Varied across
 * tiers + statuses so the table, filters and tier-specific fields all have
 * something to show. Replace the store with a real endpoint when ready.
 */
export function seedProfiles(): Profile[] {
  return [
    { id: 'p1', name: 'Nguyễn Tài Chi', email: 'taichi@example.com', phone: '+84 90 123 4567', tier: 'vip', status: 'active', joinedAt: '2023-03-12', bio: 'Kỹ sư sản phẩm.', loyaltyPoints: 32450, accountManager: 'Trần Thu Hà', hotline: '1900-888-999', creditLimit: 500_000_000 },
    { id: 'p2', name: 'Trần Minh Anh', email: 'minhanh@example.com', phone: '+84 91 222 3344', tier: 'advanced', status: 'active', joinedAt: '2023-07-01', loyaltyPoints: 12800, accountManager: 'Lê Quốc Huy' },
    { id: 'p3', name: 'Lê Quốc Huy', email: 'huylq@example.com', tier: 'intermediate', status: 'pending', joinedAt: '2024-01-15', loyaltyPoints: 3400 },
    { id: 'p4', name: 'Phạm Thu Trang', email: 'trangpt@example.com', phone: '+84 98 777 1212', tier: 'standard', status: 'active', joinedAt: '2024-05-20' },
    { id: 'p5', name: 'Đỗ Gia Bảo', email: 'baodg@example.com', tier: 'vip', status: 'suspended', joinedAt: '2022-11-08', loyaltyPoints: 64100, accountManager: 'Nguyễn Lan', hotline: '1900-888-777', creditLimit: 800_000_000 },
    { id: 'p6', name: 'Vũ Hải Nam', email: 'namvh@example.com', tier: 'standard', status: 'closed', joinedAt: '2021-09-30' },
    { id: 'p7', name: 'Bùi Khánh Linh', email: 'linhbk@example.com', phone: '+84 90 555 8888', tier: 'advanced', status: 'pending', joinedAt: '2024-02-11', loyaltyPoints: 9900, accountManager: 'Trần Thu Hà' },
    { id: 'p8', name: 'Hoàng Anh Tuấn', email: 'tuanha@example.com', tier: 'intermediate', status: 'active', joinedAt: '2023-12-01', loyaltyPoints: 5200 },
    { id: 'p9', name: 'Ngô Bích Ngọc', email: 'ngocnb@example.com', tier: 'vip', status: 'active', joinedAt: '2023-06-18', loyaltyPoints: 41000, accountManager: 'Lê Quốc Huy', hotline: '1900-888-666', creditLimit: 600_000_000 },
    { id: 'p10', name: 'Đặng Văn Sơn', email: 'sondv@example.com', phone: '+84 97 321 6549', tier: 'standard', status: 'active', joinedAt: '2024-08-05' },
  ];
}
