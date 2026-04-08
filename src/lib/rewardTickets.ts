// Reward Ticket System
// ₹1000+ → 2 Tickets | ₹500-₹999 → 1 Ticket | Below ₹500 → Discount at dress shop or bakery

export interface RewardTicket {
  id: string;
  orderId: string;
  type: 'ticket' | 'discount';
  count: number; // number of tickets (0 for discount)
  discountPercent: number; // discount % (0 for tickets)
  redeemableAt: string[]; // where can be redeemed
  description: string;
  earnedAt: string;
  redeemed: boolean;
  orderAmount: number;
}

const TICKETS_STORAGE_KEY = 'eco_reward_tickets';

export const getRewardForAmount = (amount: number): { type: 'ticket' | 'discount'; count: number; discountPercent: number; description: string; redeemableAt: string[] } => {
  if (amount >= 1000) {
    return {
      type: 'ticket',
      count: 2,
      discountPercent: 0,
      description: '🎟️ 2 Reward Tickets! Redeem at any partner store',
      redeemableAt: ['Dress Shop', 'Bakery', 'Movie Theater', 'Restaurant'],
    };
  } else if (amount >= 500) {
    return {
      type: 'ticket',
      count: 1,
      discountPercent: 0,
      description: '🎟️ 1 Reward Ticket! Redeem at any partner store',
      redeemableAt: ['Dress Shop', 'Bakery', 'Movie Theater', 'Restaurant'],
    };
  } else {
    return {
      type: 'discount',
      count: 0,
      discountPercent: amount >= 300 ? 15 : 10,
      description: `🏷️ ${amount >= 300 ? '15%' : '10%'} Discount at Dress Shop or Bakery`,
      redeemableAt: ['Dress Shop', 'Bakery'],
    };
  }
};

export const saveRewardTicket = (orderId: string, amount: number): RewardTicket => {
  const reward = getRewardForAmount(amount);
  const ticket: RewardTicket = {
    id: 'TKT-' + Date.now().toString().slice(-8),
    orderId,
    type: reward.type,
    count: reward.count,
    discountPercent: reward.discountPercent,
    redeemableAt: reward.redeemableAt,
    description: reward.description,
    earnedAt: new Date().toISOString(),
    redeemed: false,
    orderAmount: amount,
  };

  const existing = JSON.parse(localStorage.getItem(TICKETS_STORAGE_KEY) || '[]');
  existing.push(ticket);
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(existing));

  return ticket;
};

export const getAllTickets = (): RewardTicket[] => {
  return JSON.parse(localStorage.getItem(TICKETS_STORAGE_KEY) || '[]');
};

export const getActiveTickets = (): RewardTicket[] => {
  return getAllTickets().filter(t => !t.redeemed);
};

export const getTotalTicketCount = (): number => {
  return getActiveTickets()
    .filter(t => t.type === 'ticket')
    .reduce((sum, t) => sum + t.count, 0);
};

export const redeemTicket = (ticketId: string): void => {
  const tickets = getAllTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx !== -1) {
    tickets[idx].redeemed = true;
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  }
};
