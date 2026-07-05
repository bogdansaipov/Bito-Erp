import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { PaymentStatus } from '../types';
import redis from '../lib/redis';

export interface TopProduct {
  productId: string;
  title: string;
  totalQuantity: number;
  totalRevenue: number;
  totalMargin: number;
}

export interface ReportResult {
  totalRevenue: number;
  totalMargin: number;
  topProducts: TopProduct[];
}

const CACHE_TTL = 300;

const getCacheKey = (tenantId: string, from: string, to: string): string => {
  return `report:${tenantId}:${from}:${to}`;
};

export const getSalesReport = async (
  tenantId: string,
  from: Date,
  to: Date
): Promise<ReportResult> => {

    // this is going to the cache gey from the function
  const cacheKey = getCacheKey(tenantId, from.toISOString(), to.toISOString()); 

// 1. well this is the cache aside caching strategy where we check if the data is already cached if yes - then we return immideately
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as ReportResult;
  }

  // 2. so if we miss we are going to make an expensive db request for aggregated data
  const topProducts = await Order.aggregate([
    {

      // step 1 is filtering where only paid orders, this tenant, date range
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        status: PaymentStatus.PAID,
        createdAt: { $gte: from, $lte: to }
      }
    },
    {
      // step 2 is where with the property $unwind we flatten the items arrays into separate records
      $unwind: '$items'
    },
    {
      // step 3 is where I group items by their relative productId and title and calculate the sum of all quantities, the sum of all revenue and the total margin
      $group: {
        _id: {
          productId: '$items.productId',
          title: '$items.title'
        },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue:  { $sum: '$items.lineTotal' },
        totalMargin: {
          $sum: {
            $multiply: [
              { $subtract: ['$items.unitPrice', '$items.unitCost'] },
              '$items.quantity'
            ]
          }
        }
      }
    },
    {
      // step 4: sorting by most sold first basically the products with bigger number of quantity will be on top of the list
      $sort: { totalQuantity: -1 }
    },
    {
      // step 5: I am reshaping output to make it clean
      $project: {
        _id: 0,
        productId: '$_id.productId',
        title: '$_id.title',
        totalQuantity: 1,
        totalRevenue: 1,
        totalMargin: 1
      }
    }
  ]);

  // well here we just compute the total of the revenue and margin of all items combined
  const totalRevenue = topProducts.reduce(
    (sum, p) => sum + p.totalRevenue, 0
  );
  
  const totalMargin = topProducts.reduce(
    (sum, p) => sum + p.totalMargin, 0,
  )

  const report: ReportResult = {
    totalRevenue,
    totalMargin,
    topProducts,
  };

  // here we store the data as cache in redis
  await redis.set(
    cacheKey,
    JSON.stringify(report),
    'EX',
    CACHE_TTL
  );

  return report;
};

// Invalidate all report caches for a tenant
// this function will be called from webhook service when order becomes PAID
export const invalidateReportCache = async (tenantId: string): Promise<void> => {
  const pattern = `report:${tenantId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};