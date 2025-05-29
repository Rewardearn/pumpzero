import prisma from '../utils/prisma';
import { TraderData, TraderTransaction, ProfitTier } from '../types/tokens';

  export class TraderService {
    private readonly MAX_TRANSACTIONS = 100;

    async createTrader(data: TraderData): Promise<TraderData> {
      // Check if trader already exists
      const existingTrader = await prisma.trader.findUnique({
        where: { address: data.address },
      });

      if (existingTrader) {
        throw new Error(`Trader with address ${data.address} already exists`);
      }

      try {
        const trader = await prisma.trader.create({
          data: {
            address: data.address,
            totalProfit: data.totalProfit,
            profitTier: data.profitTier,
            lastActiveTimestamp: data.lastActiveTimestamp,
            transactions: {
              create: data.transactions.map((tx: TraderTransaction) => ({
                signature: tx.signature,
                mint: tx.mint,
                txType: tx.txType,
                amount: tx.amount,
                tokenAmount: tx.tokenAmount,
                timestamp: tx.timestamp,
                profit: tx.profit,
              })),
            },
          },
          include: { transactions: true },
        });

        // Enforce transaction limit
        if (trader.transactions.length > this.MAX_TRANSACTIONS) {
          const transactionsToDelete = trader.transactions
            .sort((a: { timestamp: Date }, b: { timestamp: Date }) => a.timestamp.getTime() - b.timestamp.getTime())
            .slice(0, trader.transactions.length - this.MAX_TRANSACTIONS);

          await prisma.traderTransaction.deleteMany({
            where: { id: { in: transactionsToDelete.map((tx: { id: number }) => tx.id) } },
          });
        }

        return {
          address: trader.address,
          totalProfit: trader.totalProfit,
          profitTier: trader.profitTier as ProfitTier | null,
          transactions: trader.transactions.map((tx) => ({
            signature: tx.signature,
            mint: tx.mint,
            txType: tx.txType as 'buy' | 'sell',
            amount: tx.amount,
            tokenAmount: tx.tokenAmount,
            timestamp: tx.timestamp,
            profit: tx.profit,
          })),
          lastActiveTimestamp: trader.lastActiveTimestamp,
        };
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new Error(`Trader with address ${data.address} already exists`);
        }
        throw error;
      }
    }

    async getTrader(address: string): Promise<TraderData | null> {
      const trader = await prisma.trader.findUnique({
        where: { address },
        include: { transactions: { orderBy: { timestamp: 'desc' } } },
      });

      if (!trader) return null;
      
      // Remove trader if they have no tier
      if (!trader.profitTier) {
        await this.deleteTrader(address);
        return null;
      }

      return {
        address: trader.address,
        totalProfit: trader.totalProfit,
        profitTier: trader.profitTier as ProfitTier | null,
        transactions: trader.transactions.map((tx) => ({
          signature: tx.signature,
          mint: tx.mint,
          txType: tx.txType as 'buy' | 'sell',
          amount: tx.amount,
          tokenAmount: tx.tokenAmount,
          timestamp: tx.timestamp,
          profit: tx.profit,
        })),
        lastActiveTimestamp: trader.lastActiveTimestamp,
      };
    }

    async updateTrader(address: string, data: Partial<TraderData>): Promise<TraderData | null> {
      const updateData: any = {
        totalProfit: data.totalProfit,
        profitTier: data.profitTier,
        lastActiveTimestamp: data.lastActiveTimestamp,
      };

      // Handle transaction updates
      if (data.transactions) {
        // Delete existing transactions
        await prisma.traderTransaction.deleteMany({
          where: { traderAddress: address },
        });

        // Add new transactions (limited to MAX_TRANSACTIONS)
        const transactionsToCreate = data.transactions.slice(0, this.MAX_TRANSACTIONS);
        updateData.transactions = {
          create: transactionsToCreate.map((tx: TraderTransaction) => ({
            signature: tx.signature,
            mint: tx.mint,
            txType: tx.txType,
            amount: tx.amount,
            tokenAmount: tx.tokenAmount,
            timestamp: tx.timestamp,
            profit: tx.profit,
          })),
        };
      }

      const trader = await prisma.trader.update({
        where: { address },
        data: updateData,
        include: { transactions: true },
      });

      // Remove trader if tier is null
      if (!trader.profitTier) {
        await this.deleteTrader(address);
        return null;
      }

      return {
        address: trader.address,
        totalProfit: trader.totalProfit,
        profitTier: trader.profitTier as ProfitTier | null,
        transactions: trader.transactions.map((tx) => ({
          signature: tx.signature,
          mint: tx.mint,
          txType: tx.txType as 'buy' | 'sell',
          amount: tx.amount,
          tokenAmount: tx.tokenAmount,
          timestamp: tx.timestamp,
          profit: tx.profit,
        })),
        lastActiveTimestamp: trader.lastActiveTimestamp,
      };
    }

    async addTransaction(address: string, transaction: TraderTransaction): Promise<TraderData | null> {
      // Check transaction count
      const transactionCount = await prisma.traderTransaction.count({
        where: { traderAddress: address },
      });

      if (transactionCount >= this.MAX_TRANSACTIONS) {
        // Delete oldest transaction
        const oldestTransaction = await prisma.traderTransaction.findFirst({
          where: { traderAddress: address },
          orderBy: { timestamp: 'asc' },
        });

        if (oldestTransaction) {
          await prisma.traderTransaction.delete({
            where: { id: oldestTransaction.id },
          });
        }
      }

      // Add new transaction
      await prisma.traderTransaction.create({
        data: {
          traderAddress: address,
          signature: transaction.signature,
          mint: transaction.mint,
          txType: transaction.txType,
          amount: transaction.amount,
          tokenAmount: transaction.tokenAmount,
          timestamp: transaction.timestamp,
          profit: transaction.profit,
        },
      });

      return this.getTrader(address);
    }

    async deleteTrader(address: string): Promise<void> {
      await prisma.traderTransaction.deleteMany({
        where: { traderAddress: address },
      });

      await prisma.trader.delete({
        where: { address },
      });
    }

    async getAllTraders(): Promise<TraderData[]> {
      const traders = await prisma.trader.findMany({
        include: { transactions: { orderBy: { timestamp: 'desc' } } },
      });

      const validTraders = traders.filter((trader) => trader.profitTier !== null);

      return validTraders.map((trader) => ({
        address: trader.address,
        totalProfit: trader.totalProfit,
        profitTier: trader.profitTier as ProfitTier | null,
        transactions: trader.transactions.map((tx) => ({
          signature: tx.signature,
          mint: tx.mint,
          txType: tx.txType as 'buy' | 'sell',
          amount: tx.amount,
          tokenAmount: tx.tokenAmount,
          timestamp: tx.timestamp,
          profit: tx.profit,
        })),
        lastActiveTimestamp: trader.lastActiveTimestamp,
      }));
    }
  }