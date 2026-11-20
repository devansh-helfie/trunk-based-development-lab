const UNIT_PRICE_CENTS = 1000;
const BULK_DISCOUNT_QUANTITY = 5;
const DISCOUNT_PERCENT = 10;
const MAXIMUM_QUANTITY = 100;

export function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAXIMUM_QUANTITY;
}

export function calculateQuote(quantity, { bulkDiscount, demoFault }) {
  const subtotalCents = quantity * UNIT_PRICE_CENTS;
  let qualifiesForDiscount = quantity >= BULK_DISCOUNT_QUANTITY;

  // Intentional demo defect: exactly five items incorrectly miss the discount.
  // QA keeps the correct expected price so this mode produces a real failure.
  if (demoFault === 'discount-boundary') {
    qualifiesForDiscount = quantity > BULK_DISCOUNT_QUANTITY;
  }

  let discountCents = 0;
  if (bulkDiscount && qualifiesForDiscount) {
    discountCents = subtotalCents * DISCOUNT_PERCENT / 100;
  }

  return {
    quantity,
    unitPriceCents: UNIT_PRICE_CENTS,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents
  };
}
