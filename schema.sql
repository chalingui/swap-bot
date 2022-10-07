-- Create syntax for TABLE 'logs'
CREATE TABLE `logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `trade_pair` varchar(255) DEFAULT NULL,
  `type` enum('buy','sell') DEFAULT NULL,
  `amount` decimal(10,6) DEFAULT NULL,
  `target_price` decimal(10,6) DEFAULT NULL,
  `market_price` decimal(10,6) DEFAULT NULL,
  `base_price` decimal(10,6) DEFAULT NULL,
  `base_price_sell` decimal(10,6) DEFAULT NULL,
  `market_price_sell` decimal(10,6) DEFAULT NULL,
  `base_price_buy` decimal(10,6) DEFAULT NULL,
  `market_price_buy` decimal(10,6) DEFAULT NULL,
  `percent` int(11) DEFAULT NULL,
  `estimated_gas` bigint(20) DEFAULT NULL,
  `gas_price` bigint(20) DEFAULT NULL,
  `action` enum('yes','no') DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create syntax for TABLE 'trades'
CREATE TABLE `trades` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `log_id` int(11) DEFAULT NULL,
  `type` enum('BUY','SELL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tx` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromToken` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromTokenAmount` decimal(10,4) DEFAULT NULL,
  `toToken` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toTokenAmount` decimal(10,4) DEFAULT NULL,
  `gas_used` bigint(20) DEFAULT NULL,
  `gas_price` bigint(20) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;