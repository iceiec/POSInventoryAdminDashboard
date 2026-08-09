const Sale = require('../models/Sale');
const Item = require('../models/Item');

// POST /api/sales
// Body: { items, subtotal, discountAmount, discountLabel, total, paymentMethod, amountReceived, change, customerName }
const createSale = async (req, res, next) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();

    // Decrement stock for each trackStock item and recompute status
    const stockUpdates = sale.items.map(async (saleItem) => {
      const item = await Item.findById(saleItem.itemId);
      if (!item || !item.trackStock) return;

      item.stock = Math.max(0, item.stock - saleItem.quantity);
      // pre-save hook will recalculate status
      await item.save();
    });

    await Promise.all(stockUpdates);

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

// GET /api/sales
// Query params: startDate, endDate, page (default 1), limit (default 20)
const getAllSales = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Include all of endDate by going to end of that day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Sale.countDocuments(filter),
    ]);

    res.json({
      sales,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSaleById,
};
