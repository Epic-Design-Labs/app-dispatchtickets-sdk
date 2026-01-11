/**
 * Category resource
 */
export interface Category {
  id: string;
  brandId: string;
  name: string;
  color: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
}

/**
 * Input for creating a category
 */
export interface CreateCategoryInput {
  name: string;
  color?: string;
  description?: string;
  sortOrder?: number;
}

/**
 * Input for updating a category
 */
export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
}

/**
 * Category stats
 */
export interface CategoryStats {
  [categoryId: string]: {
    ticketCount: number;
  };
}
