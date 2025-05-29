-- CreateTable
CREATE TABLE `Trader` (
    `address` VARCHAR(191) NOT NULL,
    `totalProfit` DOUBLE NOT NULL,
    `profitTier` ENUM('TIER1', 'TIER2', 'TIER3', 'TIER4', 'TIER5', 'TIER6', 'TIER7', 'TIER8') NULL,
    `lastActiveTimestamp` DATETIME(3) NOT NULL,

    PRIMARY KEY (`address`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TraderTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `traderAddress` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `mint` VARCHAR(191) NOT NULL,
    `txType` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `tokenAmount` DOUBLE NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `profit` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TraderTransaction` ADD CONSTRAINT `TraderTransaction_traderAddress_fkey` FOREIGN KEY (`traderAddress`) REFERENCES `Trader`(`address`) ON DELETE CASCADE ON UPDATE CASCADE;
