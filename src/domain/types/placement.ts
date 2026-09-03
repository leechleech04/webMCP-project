export interface Placement {
  /** Unique installed instance ID. The first instance keeps the product ID for v1 compatibility. */
  componentId: string;
  /** Present when an instance ID differs from its purchasable product ID. */
  productId?: string;
  mountId: string;
}
