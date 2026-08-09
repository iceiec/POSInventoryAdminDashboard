const Sale = require('../models/Sale');
const Category = require('../models/Category');

/**
 * Build a date range filter object for MongoDB queries.
 * endDate is extended to the last millisecond of that day.
 */
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return Object.keys(filter).length ? filter : null;
};

/**
 * Compute the previous period of equal length relative to the current range.
 * e.g. if range is 7 days, previous period is the 7 days before that.
 */
const getPreviousPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - diffMs - 1);
  return { prevStart, prevEnd };
};

/**
 * Percentage change helper. Returns 0 when both values are 0.
 */
const pctChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

/**
 * GET /api/analytics/summary
 * Query params: startDate, endDate (ISO strings or date strings)
 */
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const matchStage = dateFilter ? { $match: { createdAt: dateFilter } } : { $match: {} };

    // ── 1. Core metrics ──────────────────────────────────────────────────────
    const metricsAgg = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$total' },
          totalDiscount: { $sum: '$discountAmount' },
          totalCost: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: ['$$value', { $multiply: ['$$this.cost', '$$this.quantity'] }],
                },
              },
            },
          },
        },
      },
    ]);

    const currentMetrics =
      metricsAgg.length > 0
        ? metricsAgg[0]
        : { grossSales: 0, totalDiscount: 0, totalCost: 0 };

    const grossSales = currentMetrics.grossSales;
    const discounts = currentMetrics.totalDiscount;
    const netSales = grossSales - discounts;
    const grossProfit = netSales - currentMetrics.totalCost;

    // ── 2. Previous period metrics for % change ───────────────────────────────
    let metricsChange = {
      grossSales: 0,
      refunds: 0,
      discounts: 0,
      netSales: 0,
      grossProfit: 0,
    };

    if (startDate && endDate) {
      const { prevStart, prevEnd } = getPreviousPeriod(startDate, endDate);
      const prevFilter = buildDateFilter(
        prevStart.toISOString(),
        prevEnd.toISOString()
      );
      const prevMatchStage = { $match: { createdAt: prevFilter } };

      const prevAgg = await Sale.aggregate([
        prevMatchStage,
        {
          $group: {
            _id: null,
            grossSales: { $sum: '$total' },
            totalDiscount: { $sum: '$discountAmount' },
            totalCost: {
              $sum: {
                $reduce: {
                  input: '$items',
                  initialValue: 0,
                  in: {
                    $add: ['$$value', { $multiply: ['$$this.cost', '$$this.quantity'] }],
                  },
                },
              },
            },
          },
        },
      ]);

      const prev =
        prevAgg.length > 0
          ? prevAgg[0]
          : { grossSales: 0, totalDiscount: 0, totalCost: 0 };

      const prevNetSales = prev.grossSales - prev.totalDiscount;
      const prevGrossProfit = prevNetSales - prev.totalCost;

      metricsChange = {
        grossSales: pctChange(grossSales, prev.grossSales),
        refunds: 0,
        discounts: pctChange(discounts, prev.totalDiscount),
        netSales: pctChange(netSales, prevNetSales),
        grossProfit: pctChange(grossProfit, prevGrossProfit),
      };
    }

    // ── 3. Daily sales trend ──────────────────────────────────────────────────
    const trendAgg = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: '$total' },
          totalCost: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: ['$$value', { $multiply: ['$$this.cost', '$$this.quantity'] }],
                },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          sales: 1,
          profit: { $subtract: ['$sales', '$totalCost'] },
        },
      },
    ]);

    // ── 4. Sales by category ──────────────────────────────────────────────────
    // Fetch category colors for label
    const categories = await Category.find({}, { name: 1, color: 1 }).lean();
    const categoryColorMap = {};
    categories.forEach((c) => {
      categoryColorMap[c.name] = c.color || '#3b82f6';
    });

    const categoryAgg = await Sale.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name', // fallback — ideally join via item lookup
          value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 10 },
    ]);

    // For category breakdown we join items to their category via a lookup
    const categoryByItemAgg = await Sale.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'items',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'itemDoc',
        },
      },
      { $unwind: { path: '$itemDoc', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: { $ifNull: ['$itemDoc.category', 'Uncategorized'] },
          value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { value: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: { $round: ['$value', 2] },
        },
      },
    ]);

    const salesByCategory = categoryByItemAgg.map((c) => ({
      name: c.name,
      value: c.value,
      color: categoryColorMap[c.name] || '#3b82f6',
    }));

    // ── 5. Sales by payment method ────────────────────────────────────────────
    const paymentColors = {
      cash: '#059669',
      card: '#3b82f6',
      wallet: '#8b5cf6',
    };

    const paymentAgg = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: '$paymentMethod',
          value: { $sum: '$total' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: { $round: ['$value', 2] },
        },
      },
    ]);

    const salesByPayment = paymentAgg.map((p) => ({
      name: p.name,
      value: p.value,
      color: paymentColors[p.name] || '#6b7280',
    }));

    // ── 6. Daily receipt data ─────────────────────────────────────────────────
    const receiptAgg = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
          total: { $round: ['$total', 2] },
        },
      },
    ]);

    // ── 7. Discount usage data ────────────────────────────────────────────────
    const discountAgg = await Sale.aggregate([
      matchStage,
      { $match: { discountLabel: { $ne: '' }, discountAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$discountLabel',
          usage: { $sum: 1 },
          total: { $sum: '$discountAmount' },
        },
      },
      { $sort: { usage: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          usage: 1,
          total: { $round: ['$total', 2] },
        },
      },
    ]);

    // ── 8. Top items by revenue ───────────────────────────────────────────────
    const topItemsAgg = await Sale.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          name: { $first: '$items.name' },
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: 1,
          sold: 1,
          revenue: { $round: ['$revenue', 2] },
        },
      },
    ]);

    // ── Response ──────────────────────────────────────────────────────────────
    res.json({
      metrics: {
        grossSales: parseFloat(grossSales.toFixed(2)),
        refunds: 0,
        discounts: parseFloat(discounts.toFixed(2)),
        netSales: parseFloat(netSales.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
      },
      metricsChange,
      salesTrend: trendAgg,
      salesByCategory,
      salesByPayment,
      receiptData: receiptAgg,
      discountData: discountAgg,
      topItems: topItemsAgg,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary };
