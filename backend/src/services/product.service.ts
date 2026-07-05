import { Product } from '../models/Product';
import { ProductResponse, PaginatedResponse } from '../types';

interface GetProductsParams {
  tenantId: string;
  search?: string;
  page: number;
  limit: number;
}

export const getProducts = async ({
  tenantId,
  search,
  page,
  limit,
}: GetProductsParams): Promise<PaginatedResponse<ProductResponse>> => {
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { tenantId };
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('-cost')
      .skip(skip)
      .limit(limit)
      .lean<ProductResponse[]>(),
    Product.countDocuments(query),
  ]);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};