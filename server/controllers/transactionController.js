const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");

// ============================================
// CREATE
// POST /api/transactions
// ============================================

const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      paymentMethod,
      date,
      recurring,
      merchant,
      notes,
    } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Type, amount and category are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,

      type,

      amount: numericAmount,

      category: category.trim(),

      description: description?.trim() || "",

      paymentMethod: paymentMethod || "upi",

      date: date ? new Date(date) : new Date(),

      recurring: recurring === true,

      merchant: merchant?.trim() || "",

      notes: notes?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create transaction",
    });
  }
};

// ============================================
// GET ALL
// GET /api/transactions
// ============================================

const getTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      startDate,
      endDate,
      sort = "newest",
    } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (
      type &&
      ["income", "expense"].includes(type)
    ) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },

        {
          merchant: {
            $regex: search,
            $options: "i",
          },
        },

        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

        filter.date.$lte = end;
      }
    }

    const sortOption =
      sort === "oldest"
        ? { date: 1 }
        : { date: -1 };

    const transactions = await Transaction.find(
      filter
    ).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch transactions",
    });
  }
};

// ============================================
// GET ONE
// GET /api/transactions/:id
// ============================================

const getTransactionById = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,

      // IMPORTANT
      // Prevent accessing another user's transaction.
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch transaction",
    });
  }
};

// ============================================
// UPDATE
// PUT /api/transactions/:id
// ============================================

const updateTransaction = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    // Never allow userId to be changed through request body.
    const {
      userId,
      _id,
      createdAt,
      updatedAt,
      ...allowedUpdates
    } = req.body;

    if (allowedUpdates.amount !== undefined) {
      const amount = Number(
        allowedUpdates.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than zero",
        });
      }

      allowedUpdates.amount = amount;
    }

    const transaction =
      await Transaction.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user._id,
        },

        allowedUpdates,

        {
          new: true,
          runValidators: true,
        }
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update transaction",
    });
  }
};

// ============================================
// DELETE
// DELETE /api/transactions/:id
// ============================================

const deleteTransaction = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction =
      await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id,
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete transaction",
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};