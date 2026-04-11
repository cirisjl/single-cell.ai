-- MySQL dump 10.13  Distrib 8.0.34, for Linux (x86_64)
--
-- Host: localhost    Database: oscb
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Quality Control'),(2,'Imputation'),(3,'Normalization'),(4,'Integration'),(5,'Annotation'),(6, 'Formatting'),(7, 'Visualization');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dataset`
--

DROP TABLE IF EXISTS `dataset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dataset` (
  `dataset_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(45) NOT NULL,
  `n_cells` int NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `summary` varchar(200) DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`dataset_id`),
  UNIQUE KEY `title_UNIQUE` (`title`,`user_id`),
  KEY `user_id_fk_idx` (`user_id`),
  CONSTRAINT `user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dataset`
--

LOCK TABLES `dataset` WRITE;
/*!40000 ALTER TABLE `dataset` DISABLE KEYS */;
/*!40000 ALTER TABLE `dataset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_activity`
--

DROP TABLE IF EXISTS `directus_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_activity` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `action` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `origin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_activity_collection_foreign` (`collection`)
) ENGINE=InnoDB AUTO_INCREMENT=153 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_activity`
--

LOCK TABLES `directus_activity` WRITE;
/*!40000 ALTER TABLE `directus_activity` DISABLE KEYS */;
INSERT INTO `directus_activity` VALUES (143,'login','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:35:28','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_users','6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(144,'delete','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:37:09','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','filemappings','2',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(145,'delete','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:37:17','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','735baca4-6dd4-4fdd-be19-e6b28d9f20a6',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(146,'delete','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:37:17','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','a70a8d68-9b26-4acd-b589-943496a9017d',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(147,'delete','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:37:23','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','b28a3f28-f392-484c-9276-717a50375244',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(148,'delete','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:37:23','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','15682c71-7d6e-4c9a-8e88-4eced5c7a0fe',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(149,'create','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:38:20','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','675c5f69-ae11-4951-babd-3c165b039571',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(150,'create','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:38:22','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','team','3',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(151,'create','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:39:02','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','directus_files','fd681829-9fa9-416d-8fcc-c9cfec9d3020',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055'),(152,'create','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:39:04','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36','filemappings','4',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055');
/*!40000 ALTER TABLE `directus_activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_collections`
--

DROP TABLE IF EXISTS `directus_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_collections` (
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `display_template` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `singleton` tinyint(1) NOT NULL DEFAULT '0',
  `translations` json DEFAULT NULL,
  `archive_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archive_app_filter` tinyint(1) NOT NULL DEFAULT '1',
  `archive_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unarchive_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountability` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_duplication_fields` json DEFAULT NULL,
  `sort` int DEFAULT NULL,
  `group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collapse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  PRIMARY KEY (`collection`),
  KEY `directus_collections_group_foreign` (`group`),
  CONSTRAINT `directus_collections_group_foreign` FOREIGN KEY (`group`) REFERENCES `directus_collections` (`collection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_collections`
--

LOCK TABLES `directus_collections` WRITE;
/*!40000 ALTER TABLE `directus_collections` DISABLE KEYS */;
INSERT INTO `directus_collections` VALUES ('categories',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('dataset',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('file',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('filemappings',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('filters',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('team',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('updates',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open'),('users',NULL,NULL,NULL,0,0,NULL,NULL,1,NULL,NULL,NULL,'all',NULL,NULL,NULL,NULL,'open');
/*!40000 ALTER TABLE `directus_collections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_dashboards`
--

DROP TABLE IF EXISTS `directus_dashboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_dashboards` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dashboard',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_dashboards_user_created_foreign` (`user_created`),
  CONSTRAINT `directus_dashboards_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_dashboards`
--

LOCK TABLES `directus_dashboards` WRITE;
/*!40000 ALTER TABLE `directus_dashboards` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_dashboards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_fields`
--

DROP TABLE IF EXISTS `directus_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_fields` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `special` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interface` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `options` json DEFAULT NULL,
  `display` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_options` json DEFAULT NULL,
  `readonly` tinyint(1) NOT NULL DEFAULT '0',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `sort` int unsigned DEFAULT NULL,
  `width` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'full',
  `translations` json DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `conditions` json DEFAULT NULL,
  `required` tinyint(1) DEFAULT '0',
  `group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validation` json DEFAULT NULL,
  `validation_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `directus_fields_collection_foreign` (`collection`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_fields`
--

LOCK TABLES `directus_fields` WRITE;
/*!40000 ALTER TABLE `directus_fields` DISABLE KEYS */;
INSERT INTO `directus_fields` VALUES (1,'updates','id',NULL,'input',NULL,NULL,NULL,1,1,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(2,'updates','user_created','user-created','select-dropdown-m2o','{\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}','user',NULL,1,1,NULL,'half',NULL,NULL,NULL,0,NULL,NULL,NULL),(3,'updates','date_created','date-created','datetime',NULL,'datetime','{\"relative\": true}',1,1,NULL,'half',NULL,NULL,NULL,0,NULL,NULL,NULL),(4,'updates','user_updated','user-updated','select-dropdown-m2o','{\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}','user',NULL,1,1,NULL,'half',NULL,NULL,NULL,0,NULL,NULL,NULL),(5,'updates','date_updated','date-updated','datetime',NULL,'datetime','{\"relative\": true}',1,1,NULL,'half',NULL,NULL,NULL,0,NULL,NULL,NULL),(6,'updates','title',NULL,'input','{\"placeholder\": \"Enter the title of the update\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(8,'updates','date_published',NULL,'datetime',NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(9,'updates','update_description',NULL,'input-rich-text-html','{\"folder\": \"c69b03a6-fcb6-4aba-96f8-6be3a0e82f0f\", \"toolbar\": [\"undo\", \"redo\", \"bold\", \"italic\", \"underline\", \"strikethrough\", \"subscript\", \"superscript\", \"fontselect\", \"fontsizeselect\", \"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\", \"alignleft\", \"aligncenter\", \"alignright\", \"alignjustify\", \"alignnone\", \"indent\", \"outdent\", \"numlist\", \"bullist\", \"forecolor\", \"backcolor\", \"removeformat\", \"cut\", \"copy\", \"paste\", \"remove\", \"selectall\", \"blockquote\", \"customLink\", \"unlink\", \"customImage\", \"customMedia\", \"table\", \"hr\", \"code\", \"fullscreen\", \"visualaid\", \"ltr rtl\"]}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(10,'filemappings','id',NULL,'input',NULL,NULL,NULL,1,1,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(11,'filemappings','filename',NULL,'input','{\"trim\": true, \"placeholder\": \"Enter a filename to be rendered in react application in lowercase\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(12,'filemappings','fileID','file','file','{\"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\"}','image','{\"circle\": true}',0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(13,'team','id',NULL,'input',NULL,NULL,NULL,1,1,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(14,'team','firstname',NULL,'input','{\"trim\": true, \"placeholder\": \"Enter the firstname of the team member\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(15,'team','lastname',NULL,'input','{\"trim\": true, \"placeholder\": \"Enter the lastname of the team member\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(16,'team','organization',NULL,'input','{\"trim\": true, \"placeholder\": \"Enter the organization of the team member\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(17,'team','team_type',NULL,'select-dropdown','{\"choices\": [{\"text\": \"core development\", \"value\": \"core development\"}, {\"text\": \"steering committee\", \"value\": \"steering committee\"}]}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(18,'team','order',NULL,'input','{\"trim\": true, \"placeholder\": \"Enter the order in which the team member are shown on teams page\"}',NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(19,'team','image','file','file-image','{\"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\"}','image','{\"circle\": true}',0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(20,'categories','name',NULL,NULL,NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(21,'filters','category_id',NULL,NULL,NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(22,'filters','id',NULL,NULL,NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(23,'filters','name',NULL,NULL,NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(24,'users','user_id',NULL,NULL,NULL,NULL,NULL,0,0,NULL,'full',NULL,NULL,NULL,0,NULL,NULL,NULL),(25,'users','username',NULL,NULL,NULL,NULL,NULL,1,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(26,'users','email',NULL,NULL,NULL,NULL,NULL,1,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL),(27,'users','password_hash',NULL,NULL,NULL,NULL,NULL,1,0,NULL,'full',NULL,NULL,NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `directus_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_files`
--

DROP TABLE IF EXISTS `directus_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_files` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename_disk` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filename_download` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `folder` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `charset` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filesize` bigint DEFAULT NULL,
  `width` int unsigned DEFAULT NULL,
  `height` int unsigned DEFAULT NULL,
  `duration` int unsigned DEFAULT NULL,
  `embed` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tags` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_files_uploaded_by_foreign` (`uploaded_by`),
  KEY `directus_files_modified_by_foreign` (`modified_by`),
  KEY `directus_files_folder_foreign` (`folder`),
  CONSTRAINT `directus_files_folder_foreign` FOREIGN KEY (`folder`) REFERENCES `directus_folders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `directus_files_modified_by_foreign` FOREIGN KEY (`modified_by`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `directus_files_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_files`
--

LOCK TABLES `directus_files` WRITE;
/*!40000 ALTER TABLE `directus_files` DISABLE KEYS */;
INSERT INTO `directus_files` VALUES ('675c5f69-ae11-4951-babd-3c165b039571','local','675c5f69-ae11-4951-babd-3c165b039571.jpg','Lei Jiang.jpg','Lei Jiang','image/jpeg','e53a7105-3bfa-4bcd-b491-88e63188e713','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:38:19',NULL,'2023-08-31 22:38:20',NULL,2069882,1827,1827,NULL,NULL,NULL,NULL,NULL,'{}'),('fd681829-9fa9-416d-8fcc-c9cfec9d3020','local','fd681829-9fa9-416d-8fcc-c9cfec9d3020.md','OGB.md','Ogb','application/octet-stream','f86cf86e-a734-483f-9a3f-35cf4499e1f9','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-08-31 22:39:01',NULL,'2023-08-31 22:39:02',NULL,5326,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `directus_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_flows`
--

DROP TABLE IF EXISTS `directus_flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_flows` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `trigger` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountability` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `options` json DEFAULT NULL,
  `operation` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `directus_flows_operation_unique` (`operation`),
  KEY `directus_flows_user_created_foreign` (`user_created`),
  CONSTRAINT `directus_flows_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_flows`
--

LOCK TABLES `directus_flows` WRITE;
/*!40000 ALTER TABLE `directus_flows` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_flows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_folders`
--

DROP TABLE IF EXISTS `directus_folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_folders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_folders_parent_foreign` (`parent`),
  CONSTRAINT `directus_folders_parent_foreign` FOREIGN KEY (`parent`) REFERENCES `directus_folders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_folders`
--

LOCK TABLES `directus_folders` WRITE;
/*!40000 ALTER TABLE `directus_folders` DISABLE KEYS */;
INSERT INTO `directus_folders` VALUES ('c69b03a6-fcb6-4aba-96f8-6be3a0e82f0f','updates_folder',NULL),('e53a7105-3bfa-4bcd-b491-88e63188e713','team_images',NULL),('f86cf86e-a734-483f-9a3f-35cf4499e1f9','static_files',NULL);
/*!40000 ALTER TABLE `directus_folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_migrations`
--

DROP TABLE IF EXISTS `directus_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_migrations` (
  `version` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_migrations`
--

LOCK TABLES `directus_migrations` WRITE;
/*!40000 ALTER TABLE `directus_migrations` DISABLE KEYS */;
INSERT INTO `directus_migrations` VALUES ('20201028A','Remove Collection Foreign Keys','2023-04-10 05:18:55'),('20201029A','Remove System Relations','2023-04-10 05:18:55'),('20201029B','Remove System Collections','2023-04-10 05:18:55'),('20201029C','Remove System Fields','2023-04-10 05:18:55'),('20201105A','Add Cascade System Relations','2023-04-10 05:18:57'),('20201105B','Change Webhook URL Type','2023-04-10 05:18:57'),('20210225A','Add Relations Sort Field','2023-04-10 05:18:57'),('20210304A','Remove Locked Fields','2023-04-10 05:18:57'),('20210312A','Webhooks Collections Text','2023-04-10 05:18:57'),('20210331A','Add Refresh Interval','2023-04-10 05:18:57'),('20210415A','Make Filesize Nullable','2023-04-10 05:18:57'),('20210416A','Add Collections Accountability','2023-04-10 05:18:57'),('20210422A','Remove Files Interface','2023-04-10 05:18:57'),('20210506A','Rename Interfaces','2023-04-10 05:18:57'),('20210510A','Restructure Relations','2023-04-10 05:18:57'),('20210518A','Add Foreign Key Constraints','2023-04-10 05:18:57'),('20210519A','Add System Fk Triggers','2023-04-10 05:18:58'),('20210521A','Add Collections Icon Color','2023-04-10 05:18:58'),('20210525A','Add Insights','2023-04-10 05:18:58'),('20210608A','Add Deep Clone Config','2023-04-10 05:18:58'),('20210626A','Change Filesize Bigint','2023-04-10 05:18:58'),('20210716A','Add Conditions to Fields','2023-04-10 05:18:59'),('20210721A','Add Default Folder','2023-04-10 05:18:59'),('20210802A','Replace Groups','2023-04-10 05:18:59'),('20210803A','Add Required to Fields','2023-04-10 05:18:59'),('20210805A','Update Groups','2023-04-10 05:18:59'),('20210805B','Change Image Metadata Structure','2023-04-10 05:18:59'),('20210811A','Add Geometry Config','2023-04-10 05:18:59'),('20210831A','Remove Limit Column','2023-04-10 05:18:59'),('20210903A','Add Auth Provider','2023-04-10 05:18:59'),('20210907A','Webhooks Collections Not Null','2023-04-10 05:18:59'),('20210910A','Move Module Setup','2023-04-10 05:18:59'),('20210920A','Webhooks URL Not Null','2023-04-10 05:18:59'),('20210924A','Add Collection Organization','2023-04-10 05:18:59'),('20210927A','Replace Fields Group','2023-04-10 05:18:59'),('20210927B','Replace M2M Interface','2023-04-10 05:18:59'),('20210929A','Rename Login Action','2023-04-10 05:18:59'),('20211007A','Update Presets','2023-04-10 05:18:59'),('20211009A','Add Auth Data','2023-04-10 05:19:00'),('20211016A','Add Webhook Headers','2023-04-10 05:19:00'),('20211103A','Set Unique to User Token','2023-04-10 05:19:00'),('20211103B','Update Special Geometry','2023-04-10 05:19:00'),('20211104A','Remove Collections Listing','2023-04-10 05:19:00'),('20211118A','Add Notifications','2023-04-10 05:19:00'),('20211211A','Add Shares','2023-04-10 05:19:00'),('20211230A','Add Project Descriptor','2023-04-10 05:19:00'),('20220303A','Remove Default Project Color','2023-04-10 05:19:00'),('20220308A','Add Bookmark Icon and Color','2023-04-10 05:19:00'),('20220314A','Add Translation Strings','2023-04-10 05:19:00'),('20220322A','Rename Field Typecast Flags','2023-04-10 05:19:00'),('20220323A','Add Field Validation','2023-04-10 05:19:01'),('20220325A','Fix Typecast Flags','2023-04-10 05:19:01'),('20220325B','Add Default Language','2023-04-10 05:19:01'),('20220402A','Remove Default Value Panel Icon','2023-04-10 05:19:01'),('20220429A','Add Flows','2023-04-10 05:19:01'),('20220429B','Add Color to Insights Icon','2023-04-10 05:19:01'),('20220429C','Drop Non Null From IP of Activity','2023-04-10 05:19:01'),('20220429D','Drop Non Null From Sender of Notifications','2023-04-10 05:19:02'),('20220614A','Rename Hook Trigger to Event','2023-04-10 05:19:02'),('20220801A','Update Notifications Timestamp Column','2023-04-10 05:19:02'),('20220802A','Add Custom Aspect Ratios','2023-04-10 05:19:02'),('20220826A','Add Origin to Accountability','2023-04-10 05:19:02');
/*!40000 ALTER TABLE `directus_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_notifications`
--

DROP TABLE IF EXISTS `directus_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'inbox',
  `recipient` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_notifications_recipient_foreign` (`recipient`),
  KEY `directus_notifications_sender_foreign` (`sender`),
  CONSTRAINT `directus_notifications_recipient_foreign` FOREIGN KEY (`recipient`) REFERENCES `directus_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_notifications_sender_foreign` FOREIGN KEY (`sender`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_notifications`
--

LOCK TABLES `directus_notifications` WRITE;
/*!40000 ALTER TABLE `directus_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_operations`
--

DROP TABLE IF EXISTS `directus_operations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_operations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_x` int NOT NULL,
  `position_y` int NOT NULL,
  `options` json DEFAULT NULL,
  `resolve` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reject` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flow` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `directus_operations_resolve_unique` (`resolve`),
  UNIQUE KEY `directus_operations_reject_unique` (`reject`),
  KEY `directus_operations_flow_foreign` (`flow`),
  KEY `directus_operations_user_created_foreign` (`user_created`),
  CONSTRAINT `directus_operations_flow_foreign` FOREIGN KEY (`flow`) REFERENCES `directus_flows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_operations_reject_foreign` FOREIGN KEY (`reject`) REFERENCES `directus_operations` (`id`),
  CONSTRAINT `directus_operations_resolve_foreign` FOREIGN KEY (`resolve`) REFERENCES `directus_operations` (`id`),
  CONSTRAINT `directus_operations_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_operations`
--

LOCK TABLES `directus_operations` WRITE;
/*!40000 ALTER TABLE `directus_operations` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_operations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_panels`
--

DROP TABLE IF EXISTS `directus_panels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_panels` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dashboard` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `show_header` tinyint(1) NOT NULL DEFAULT '0',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_x` int NOT NULL,
  `position_y` int NOT NULL,
  `width` int NOT NULL,
  `height` int NOT NULL,
  `options` json DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_panels_dashboard_foreign` (`dashboard`),
  KEY `directus_panels_user_created_foreign` (`user_created`),
  CONSTRAINT `directus_panels_dashboard_foreign` FOREIGN KEY (`dashboard`) REFERENCES `directus_dashboards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_panels_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_panels`
--

LOCK TABLES `directus_panels` WRITE;
/*!40000 ALTER TABLE `directus_panels` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_panels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_permissions`
--

DROP TABLE IF EXISTS `directus_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `role` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json DEFAULT NULL,
  `validation` json DEFAULT NULL,
  `presets` json DEFAULT NULL,
  `fields` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `directus_permissions_collection_foreign` (`collection`),
  KEY `directus_permissions_role_foreign` (`role`),
  CONSTRAINT `directus_permissions_role_foreign` FOREIGN KEY (`role`) REFERENCES `directus_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_permissions`
--

LOCK TABLES `directus_permissions` WRITE;
/*!40000 ALTER TABLE `directus_permissions` DISABLE KEYS */;
INSERT INTO `directus_permissions` VALUES (1,NULL,'updates','create','{}','{}',NULL,'*'),(2,NULL,'updates','read','{}','{}',NULL,'*'),(3,NULL,'updates','update','{}','{}',NULL,'*'),(4,NULL,'updates','delete','{}','{}',NULL,'*'),(5,NULL,'updates','share','{}','{}',NULL,'*'),(6,NULL,'dataset','create','{}','{}',NULL,'*'),(7,NULL,'dataset','read','{}','{}',NULL,'*'),(8,NULL,'dataset','update','{}','{}',NULL,'*'),(9,NULL,'dataset','share','{}','{}',NULL,'*'),(10,NULL,'dataset','delete','{}','{}',NULL,'*'),(11,NULL,'file','create','{}','{}',NULL,'*'),(12,NULL,'file','update','{}','{}',NULL,'*'),(13,NULL,'file','read','{}','{}',NULL,'*'),(14,NULL,'file','share','{}','{}',NULL,'*'),(15,NULL,'file','delete','{}','{}',NULL,'*'),(16,NULL,'users','create','{}','{}',NULL,'*'),(17,NULL,'users','read','{}','{}',NULL,'*'),(18,NULL,'users','update','{}','{}',NULL,'*'),(19,NULL,'users','delete','{}','{}',NULL,'*'),(20,NULL,'users','share','{}','{}',NULL,'*'),(21,NULL,'directus_files','create','{}','{}',NULL,'*'),(22,NULL,'directus_files','delete','{}','{}',NULL,'*'),(23,NULL,'directus_files','update','{}','{}',NULL,'*'),(24,NULL,'directus_files','share','{}','{}',NULL,'*'),(25,NULL,'directus_files','read','{}','{}',NULL,'*'),(26,NULL,'directus_folders','create','{}','{}',NULL,'*'),(27,NULL,'directus_folders','update','{}','{}',NULL,'*'),(28,NULL,'directus_folders','read','{}','{}',NULL,'*'),(29,NULL,'directus_folders','delete','{}','{}',NULL,'*'),(30,NULL,'directus_folders','share','{}','{}',NULL,'*'),(31,NULL,'directus_permissions','create','{}','{}',NULL,'*'),(32,NULL,'directus_permissions','update','{}','{}',NULL,'*'),(33,NULL,'directus_permissions','read','{}','{}',NULL,'*'),(34,NULL,'directus_permissions','delete','{}','{}',NULL,'*'),(35,NULL,'directus_permissions','share','{}','{}',NULL,'*'),(36,NULL,'filemappings','create','{}','{}',NULL,'*'),(37,NULL,'filemappings','read','{}','{}',NULL,'*'),(38,NULL,'filemappings','update','{}','{}',NULL,'*'),(39,NULL,'filemappings','delete','{}','{}',NULL,'*'),(40,NULL,'filemappings','share','{}','{}',NULL,'*'),(41,NULL,'team','create','{}','{}',NULL,'*'),(42,NULL,'team','read','{}','{}',NULL,'*'),(43,NULL,'team','delete','{}','{}',NULL,'*'),(44,NULL,'team','update','{}','{}',NULL,'*'),(45,NULL,'team','share','{}','{}',NULL,'*');
/*!40000 ALTER TABLE `directus_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_presets`
--

DROP TABLE IF EXISTS `directus_presets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_presets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `bookmark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `layout` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'tabular',
  `layout_query` json DEFAULT NULL,
  `layout_options` json DEFAULT NULL,
  `refresh_interval` int DEFAULT NULL,
  `filter` json DEFAULT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bookmark_outline',
  `color` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_presets_collection_foreign` (`collection`),
  KEY `directus_presets_user_foreign` (`user`),
  KEY `directus_presets_role_foreign` (`role`),
  CONSTRAINT `directus_presets_role_foreign` FOREIGN KEY (`role`) REFERENCES `directus_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_presets_user_foreign` FOREIGN KEY (`user`) REFERENCES `directus_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_presets`
--

LOCK TABLES `directus_presets` WRITE;
/*!40000 ALTER TABLE `directus_presets` DISABLE KEYS */;
INSERT INTO `directus_presets` VALUES (1,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'file',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(2,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'updates',NULL,NULL,'{\"tabular\": {\"page\": 1, \"sort\": [\"date_published\"]}}',NULL,NULL,NULL,'bookmark_outline',NULL),(3,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'users',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(4,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'dataset',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(5,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'filemappings',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(6,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'team',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(7,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'categories',NULL,NULL,'{\"tabular\": {\"page\": 1}}',NULL,NULL,NULL,'bookmark_outline',NULL),(8,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'filters',NULL,NULL,'{\"tabular\": {\"page\": 2}}',NULL,NULL,NULL,'bookmark_outline',NULL),(9,NULL,'6069af76-fe39-45bb-8710-bb5719e8e79b',NULL,'directus_files',NULL,'cards','{\"cards\": {\"page\": 1, \"sort\": [\"-uploaded_on\"]}}','{\"cards\": {\"icon\": \"insert_drive_file\", \"size\": 4, \"title\": \"{{ title }}\", \"imageFit\": \"crop\", \"subtitle\": \"{{ type }} • {{ filesize }}\"}}',NULL,NULL,'bookmark_outline',NULL);
/*!40000 ALTER TABLE `directus_presets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_relations`
--

DROP TABLE IF EXISTS `directus_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_relations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `many_collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `many_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `one_collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_collection_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_allowed_collections` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `junction_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_field` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_deselect_action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nullify',
  PRIMARY KEY (`id`),
  KEY `directus_relations_many_collection_foreign` (`many_collection`),
  KEY `directus_relations_one_collection_foreign` (`one_collection`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_relations`
--

LOCK TABLES `directus_relations` WRITE;
/*!40000 ALTER TABLE `directus_relations` DISABLE KEYS */;
INSERT INTO `directus_relations` VALUES (1,'updates','user_created','directus_users',NULL,NULL,NULL,NULL,NULL,'nullify'),(2,'updates','user_updated','directus_users',NULL,NULL,NULL,NULL,NULL,'nullify'),(3,'filemappings','fileID','directus_files',NULL,NULL,NULL,NULL,NULL,'nullify'),(4,'team','image','directus_files',NULL,NULL,NULL,NULL,NULL,'nullify');
/*!40000 ALTER TABLE `directus_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_revisions`
--

DROP TABLE IF EXISTS `directus_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_revisions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `activity` int unsigned NOT NULL,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `delta` json DEFAULT NULL,
  `parent` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_revisions_collection_foreign` (`collection`),
  KEY `directus_revisions_parent_foreign` (`parent`),
  KEY `directus_revisions_activity_foreign` (`activity`),
  CONSTRAINT `directus_revisions_activity_foreign` FOREIGN KEY (`activity`) REFERENCES `directus_activity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_revisions_parent_foreign` FOREIGN KEY (`parent`) REFERENCES `directus_revisions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_revisions`
--

LOCK TABLES `directus_revisions` WRITE;
/*!40000 ALTER TABLE `directus_revisions` DISABLE KEYS */;
INSERT INTO `directus_revisions` VALUES (1,2,'directus_collections','dataset','{\"collection\": \"dataset\"}','{\"collection\": \"dataset\"}',NULL),(2,3,'directus_collections','file','{\"collection\": \"file\"}','{\"collection\": \"file\"}',NULL),(3,4,'directus_collections','users','{\"collection\": \"users\"}','{\"collection\": \"users\"}',NULL),(4,5,'directus_fields','1','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"updates\"}','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"updates\"}',NULL),(5,6,'directus_fields','2','{\"field\": \"user_created\", \"width\": \"half\", \"hidden\": true, \"display\": \"user\", \"options\": {\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}, \"special\": [\"user-created\"], \"readonly\": true, \"interface\": \"select-dropdown-m2o\", \"collection\": \"updates\"}','{\"field\": \"user_created\", \"width\": \"half\", \"hidden\": true, \"display\": \"user\", \"options\": {\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}, \"special\": [\"user-created\"], \"readonly\": true, \"interface\": \"select-dropdown-m2o\", \"collection\": \"updates\"}',NULL),(6,7,'directus_fields','3','{\"field\": \"date_created\", \"width\": \"half\", \"hidden\": true, \"display\": \"datetime\", \"special\": [\"date-created\"], \"readonly\": true, \"interface\": \"datetime\", \"collection\": \"updates\", \"display_options\": {\"relative\": true}}','{\"field\": \"date_created\", \"width\": \"half\", \"hidden\": true, \"display\": \"datetime\", \"special\": [\"date-created\"], \"readonly\": true, \"interface\": \"datetime\", \"collection\": \"updates\", \"display_options\": {\"relative\": true}}',NULL),(7,8,'directus_fields','4','{\"field\": \"user_updated\", \"width\": \"half\", \"hidden\": true, \"display\": \"user\", \"options\": {\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}, \"special\": [\"user-updated\"], \"readonly\": true, \"interface\": \"select-dropdown-m2o\", \"collection\": \"updates\"}','{\"field\": \"user_updated\", \"width\": \"half\", \"hidden\": true, \"display\": \"user\", \"options\": {\"template\": \"{{avatar.$thumbnail}} {{first_name}} {{last_name}}\"}, \"special\": [\"user-updated\"], \"readonly\": true, \"interface\": \"select-dropdown-m2o\", \"collection\": \"updates\"}',NULL),(8,9,'directus_fields','5','{\"field\": \"date_updated\", \"width\": \"half\", \"hidden\": true, \"display\": \"datetime\", \"special\": [\"date-updated\"], \"readonly\": true, \"interface\": \"datetime\", \"collection\": \"updates\", \"display_options\": {\"relative\": true}}','{\"field\": \"date_updated\", \"width\": \"half\", \"hidden\": true, \"display\": \"datetime\", \"special\": [\"date-updated\"], \"readonly\": true, \"interface\": \"datetime\", \"collection\": \"updates\", \"display_options\": {\"relative\": true}}',NULL),(9,10,'directus_collections','updates','{\"singleton\": false, \"collection\": \"updates\"}','{\"singleton\": false, \"collection\": \"updates\"}',NULL),(10,11,'directus_fields','6','{\"field\": \"title\", \"options\": {\"placeholder\": \"Enter the title of the update\"}, \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"updates\"}','{\"field\": \"title\", \"options\": {\"placeholder\": \"Enter the title of the update\"}, \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"updates\"}',NULL),(11,12,'directus_fields','6','{\"id\": 6, \"note\": null, \"sort\": null, \"field\": \"title\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"placeholder\": \"Enter the title of the update\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"updates\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"title\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"placeholder\": \"Enter the title of the update\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"updates\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(12,13,'directus_fields','7','{\"field\": \"description\", \"options\": {\"trim\": true, \"placeholder\": \"Enter the description of the update\"}, \"special\": null, \"required\": true, \"interface\": \"input-multiline\", \"collection\": \"updates\"}','{\"field\": \"description\", \"options\": {\"trim\": true, \"placeholder\": \"Enter the description of the update\"}, \"special\": null, \"required\": true, \"interface\": \"input-multiline\", \"collection\": \"updates\"}',NULL),(13,14,'directus_fields','8','{\"field\": \"date_published\", \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"datetime\", \"collection\": \"updates\"}','{\"field\": \"date_published\", \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"datetime\", \"collection\": \"updates\"}',NULL),(14,16,'updates','1','{\"title\": \"Package updated to package 1.3.5\", \"description\": \"Fixed stick import bug (see PR)\", \"date_published\": \"2023-04-12\"}','{\"title\": \"Package updated to package 1.3.5\", \"description\": \"Fixed stick import bug (see PR)\", \"date_published\": \"2023-04-12\"}',NULL),(15,17,'directus_fields','9','{\"field\": \"update_description\", \"options\": {\"toolbar\": [\"undo\", \"redo\", \"bold\", \"italic\", \"underline\", \"strikethrough\", \"subscript\", \"superscript\", \"fontselect\", \"fontsizeselect\", \"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\", \"alignleft\", \"aligncenter\", \"alignright\", \"alignjustify\", \"alignnone\", \"indent\", \"outdent\", \"numlist\", \"bullist\", \"forecolor\", \"backcolor\", \"removeformat\", \"cut\", \"copy\", \"paste\", \"remove\", \"selectall\", \"blockquote\", \"customLink\", \"unlink\", \"customImage\", \"customMedia\", \"table\", \"hr\", \"code\", \"fullscreen\", \"visualaid\", \"ltr rtl\"]}, \"special\": null, \"required\": true, \"interface\": \"input-rich-text-html\", \"collection\": \"updates\"}','{\"field\": \"update_description\", \"options\": {\"toolbar\": [\"undo\", \"redo\", \"bold\", \"italic\", \"underline\", \"strikethrough\", \"subscript\", \"superscript\", \"fontselect\", \"fontsizeselect\", \"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\", \"alignleft\", \"aligncenter\", \"alignright\", \"alignjustify\", \"alignnone\", \"indent\", \"outdent\", \"numlist\", \"bullist\", \"forecolor\", \"backcolor\", \"removeformat\", \"cut\", \"copy\", \"paste\", \"remove\", \"selectall\", \"blockquote\", \"customLink\", \"unlink\", \"customImage\", \"customMedia\", \"table\", \"hr\", \"code\", \"fullscreen\", \"visualaid\", \"ltr rtl\"]}, \"special\": null, \"required\": true, \"interface\": \"input-rich-text-html\", \"collection\": \"updates\"}',NULL),(16,19,'updates','2','{\"title\": \"Package updated to package 1.3.5\", \"date_published\": \"2023-04-12\", \"update_description\": \"<ul>\\n<li>Fixed stuck import bug(see <a href=\\\"https://github.com/\\\" target=\\\"_blank\\\" rel=\\\"noopener\\\">PR</a>)</li>\\n</ul>\"}','{\"title\": \"Package updated to package 1.3.5\", \"date_published\": \"2023-04-12\", \"update_description\": \"<ul>\\n<li>Fixed stuck import bug(see <a href=\\\"https://github.com/\\\" target=\\\"_blank\\\" rel=\\\"noopener\\\">PR</a>)</li>\\n</ul>\"}',NULL),(17,20,'updates','3','{\"title\": \"Package updated to package 1.3.4\", \"date_published\": \"2023-03-01\", \"update_description\": \"<ul>\\n<li>oscb-vessel is included in the OGB. Thank you everyone for the contribution!.</li>\\n<li>The ranking metric of the link prediction is improved(see <a href=\\\"github.com\\\" target=\\\"_blank\\\" rel=\\\"noopener\\\">PR</a>)</li>\\n</ul>\"}','{\"title\": \"Package updated to package 1.3.4\", \"date_published\": \"2023-03-01\", \"update_description\": \"<ul>\\n<li>oscb-vessel is included in the OGB. Thank you everyone for the contribution!.</li>\\n<li>The ranking metric of the link prediction is improved(see <a href=\\\"github.com\\\" target=\\\"_blank\\\" rel=\\\"noopener\\\">PR</a>)</li>\\n</ul>\"}',NULL),(18,21,'directus_permissions','2','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}',NULL),(19,22,'directus_permissions','4','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}',NULL),(20,23,'directus_permissions','5','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}',NULL),(21,24,'directus_permissions','1','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}',NULL),(22,25,'directus_permissions','3','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"updates\", \"validation\": {}, \"permissions\": {}}',NULL),(23,26,'directus_permissions','6','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}',NULL),(24,27,'directus_permissions','7','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}',NULL),(25,28,'directus_permissions','9','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}',NULL),(26,29,'directus_permissions','8','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}',NULL),(27,30,'directus_permissions','10','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"dataset\", \"validation\": {}, \"permissions\": {}}',NULL),(28,31,'directus_permissions','11','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}',NULL),(29,32,'directus_permissions','12','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}',NULL),(30,33,'directus_permissions','13','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}',NULL),(31,34,'directus_permissions','14','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}',NULL),(32,35,'directus_permissions','15','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"file\", \"validation\": {}, \"permissions\": {}}',NULL),(33,36,'directus_permissions','17','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}',NULL),(34,37,'directus_permissions','18','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}',NULL),(35,38,'directus_permissions','19','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}',NULL),(36,39,'directus_permissions','16','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}',NULL),(37,40,'directus_permissions','20','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"users\", \"validation\": {}, \"permissions\": {}}',NULL),(38,41,'directus_permissions','21','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}',NULL),(39,42,'directus_permissions','22','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}',NULL),(40,43,'directus_permissions','23','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}',NULL),(41,44,'directus_permissions','24','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}',NULL),(42,45,'directus_permissions','25','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_files\", \"validation\": {}, \"permissions\": {}}',NULL),(43,46,'directus_permissions','26','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}',NULL),(44,47,'directus_permissions','28','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}',NULL),(45,48,'directus_permissions','29','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}',NULL),(46,49,'directus_permissions','27','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}',NULL),(47,50,'directus_permissions','30','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_folders\", \"validation\": {}, \"permissions\": {}}',NULL),(48,51,'directus_permissions','31','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}',NULL),(49,52,'directus_permissions','32','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}',NULL),(50,53,'directus_permissions','33','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}',NULL),(51,55,'directus_permissions','35','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}',NULL),(52,54,'directus_permissions','34','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"directus_permissions\", \"validation\": {}, \"permissions\": {}}',NULL),(53,56,'updates','2','{\"id\": 2, \"title\": \"Package updated to package 1.3.5\", \"date_created\": \"2023-04-13T04:00:52.000Z\", \"date_updated\": \"2023-04-13T05:28:27.000Z\", \"user_created\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"user_updated\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"date_published\": \"2023-04-05\", \"update_description\": \"<ul>\\n<li>Fixed stuck import bug(see <a href=\\\"https://github.com/\\\" target=\\\"_blank\\\" rel=\\\"noopener\\\">PR</a>)</li>\\n</ul>\"}','{\"date_updated\": \"2023-04-13T05:28:26.588Z\", \"user_updated\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"date_published\": \"2023-04-05\"}',NULL),(54,57,'updates','4','{\"title\": \"Latest Update to the site\", \"date_published\": \"2023-04-13\", \"update_description\": \"<ul>\\n<li>Latest Update to the site 1</li>\\n<li>Latest Update to the site 2</li>\\n</ul>\"}','{\"title\": \"Latest Update to the site\", \"date_published\": \"2023-04-13\", \"update_description\": \"<ul>\\n<li>Latest Update to the site 1</li>\\n<li>Latest Update to the site 2</li>\\n</ul>\"}',NULL),(55,60,'directus_fields','10','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"filemappings\"}','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"filemappings\"}',NULL),(56,61,'directus_collections','filemappings','{\"singleton\": false, \"collection\": \"filemappings\"}','{\"singleton\": false, \"collection\": \"filemappings\"}',NULL),(57,62,'directus_fields','11','{\"field\": \"filename\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"filemappings\"}','{\"field\": \"filename\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"filemappings\"}',NULL),(58,63,'directus_fields','12','{\"field\": \"fileID\", \"special\": [\"file\"], \"required\": true, \"interface\": \"file\", \"collection\": \"filemappings\"}','{\"field\": \"fileID\", \"special\": [\"file\"], \"required\": true, \"interface\": \"file\", \"collection\": \"filemappings\"}',NULL),(59,64,'directus_files','347e193c-e45f-4e19-9d07-ac3ecf656b1a','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}',NULL),(60,65,'filemappings','1','{\"fileID\": \"347e193c-e45f-4e19-9d07-ac3ecf656b1a\", \"filename\": \"getstarted\"}','{\"fileID\": \"347e193c-e45f-4e19-9d07-ac3ecf656b1a\", \"filename\": \"getstarted\"}',NULL),(61,66,'directus_permissions','36','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}',NULL),(62,67,'directus_permissions','37','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}',NULL),(63,68,'directus_permissions','38','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}',NULL),(64,69,'directus_permissions','39','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}',NULL),(65,70,'directus_permissions','40','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"filemappings\", \"validation\": {}, \"permissions\": {}}',NULL),(66,71,'directus_files','94095bb5-0cbb-4a2c-9609-c96e7c3ae05e','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}',NULL),(67,72,'filemappings','1','{\"id\": 1, \"fileID\": \"94095bb5-0cbb-4a2c-9609-c96e7c3ae05e\", \"filename\": \"getstarted\"}','{\"fileID\": \"94095bb5-0cbb-4a2c-9609-c96e7c3ae05e\"}',NULL),(68,73,'directus_files','96be30e6-746b-4745-8027-e0ccc70f3065','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}',NULL),(69,74,'filemappings','1','{\"id\": 1, \"fileID\": \"96be30e6-746b-4745-8027-e0ccc70f3065\", \"filename\": \"getstarted\"}','{\"fileID\": \"96be30e6-746b-4745-8027-e0ccc70f3065\"}',NULL),(70,79,'directus_files','a70a8d68-9b26-4acd-b589-943496a9017d','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}',NULL),(71,80,'filemappings','2','{\"fileID\": \"a70a8d68-9b26-4acd-b589-943496a9017d\", \"filename\": \"getstarted\"}','{\"fileID\": \"a70a8d68-9b26-4acd-b589-943496a9017d\", \"filename\": \"getstarted\"}',NULL),(72,81,'directus_fields','13','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"team\"}','{\"field\": \"id\", \"hidden\": true, \"readonly\": true, \"interface\": \"input\", \"collection\": \"team\"}',NULL),(73,82,'directus_collections','team','{\"singleton\": false, \"collection\": \"team\"}','{\"singleton\": false, \"collection\": \"team\"}',NULL),(74,83,'directus_fields','14','{\"field\": \"firstname\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"team\"}','{\"field\": \"firstname\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"team\"}',NULL),(75,84,'directus_fields','15','{\"field\": \"lastname\", \"special\": null, \"interface\": \"input\", \"collection\": \"team\"}','{\"field\": \"lastname\", \"special\": null, \"interface\": \"input\", \"collection\": \"team\"}',NULL),(76,85,'directus_fields','16','{\"field\": \"organization\", \"special\": null, \"interface\": \"input\", \"collection\": \"team\"}','{\"field\": \"organization\", \"special\": null, \"interface\": \"input\", \"collection\": \"team\"}',NULL),(77,86,'directus_fields','17','{\"field\": \"team_type\", \"options\": {\"choices\": [{\"text\": \"core development\", \"value\": \"core development\"}, {\"text\": \"steering committee\", \"value\": \"steering committee\"}]}, \"special\": null, \"interface\": \"select-dropdown\", \"collection\": \"team\"}','{\"field\": \"team_type\", \"options\": {\"choices\": [{\"text\": \"core development\", \"value\": \"core development\"}, {\"text\": \"steering committee\", \"value\": \"steering committee\"}]}, \"special\": null, \"interface\": \"select-dropdown\", \"collection\": \"team\"}',NULL),(78,87,'directus_fields','18','{\"field\": \"order\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"team\"}','{\"field\": \"order\", \"special\": null, \"required\": true, \"interface\": \"input\", \"collection\": \"team\"}',NULL),(79,88,'directus_fields','19','{\"field\": \"image\", \"special\": [\"file\"], \"interface\": \"file-image\", \"collection\": \"team\"}','{\"field\": \"image\", \"special\": [\"file\"], \"interface\": \"file-image\", \"collection\": \"team\"}',NULL),(80,89,'directus_permissions','41','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"create\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}',NULL),(81,90,'directus_permissions','43','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"delete\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}',NULL),(82,91,'directus_permissions','44','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"update\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}',NULL),(83,92,'directus_permissions','42','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"read\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}',NULL),(84,93,'directus_permissions','45','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}','{\"role\": null, \"action\": \"share\", \"fields\": [\"*\"], \"collection\": \"team\", \"validation\": {}, \"permissions\": {}}',NULL),(85,94,'directus_files','15682c71-7d6e-4c9a-8e88-4eced5c7a0fe','{\"type\": \"image/png\", \"title\": \"Yuxiao\", \"storage\": \"local\", \"filename_download\": \"yuxiao.png\"}','{\"type\": \"image/png\", \"title\": \"Yuxiao\", \"storage\": \"local\", \"filename_download\": \"yuxiao.png\"}',NULL),(86,95,'team','1','{\"image\": \"15682c71-7d6e-4c9a-8e88-4eced5c7a0fe\", \"order\": \"2\", \"lastname\": \"Bathula\", \"firstname\": \"karthik Goud\", \"team_type\": \"core development\", \"organization\": \"University of Missouri\"}','{\"image\": \"15682c71-7d6e-4c9a-8e88-4eced5c7a0fe\", \"order\": \"2\", \"lastname\": \"Bathula\", \"firstname\": \"karthik Goud\", \"team_type\": \"core development\", \"organization\": \"University of Missouri\"}',NULL),(87,96,'directus_files','b28a3f28-f392-484c-9276-717a50375244','{\"type\": \"image/jpeg\", \"title\": \"Img 0866\", \"storage\": \"local\", \"filename_download\": \"IMG-0866.jpg\"}','{\"type\": \"image/jpeg\", \"title\": \"Img 0866\", \"storage\": \"local\", \"filename_download\": \"IMG-0866.jpg\"}',NULL),(88,97,'team','2','{\"image\": \"b28a3f28-f392-484c-9276-717a50375244\", \"order\": \"1\", \"lastname\": \"bathula\", \"firstname\": \"karthik goud\", \"team_type\": \"core development\", \"organization\": \"mizzou\"}','{\"image\": \"b28a3f28-f392-484c-9276-717a50375244\", \"order\": \"1\", \"lastname\": \"bathula\", \"firstname\": \"karthik goud\", \"team_type\": \"core development\", \"organization\": \"mizzou\"}',NULL),(89,98,'directus_fields','19','{\"id\": 19, \"note\": null, \"sort\": null, \"field\": \"image\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {}, \"special\": [\"file\"], \"readonly\": false, \"required\": false, \"interface\": \"file-image\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"image\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {}, \"special\": [\"file\"], \"readonly\": false, \"required\": false, \"interface\": \"file-image\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}',NULL),(90,99,'directus_files','b28a3f28-f392-484c-9276-717a50375244','{\"id\": \"b28a3f28-f392-484c-9276-717a50375244\", \"tags\": null, \"type\": \"image/jpeg\", \"embed\": null, \"title\": \"Img 0866\", \"width\": 3024, \"folder\": null, \"height\": 4032, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 2989220, \"location\": null, \"metadata\": {\"exif\": {\"ISO\": 1000, \"FNumber\": 1.78, \"FocalLength\": 6.86, \"ExposureTime\": 0.06666666666666667}, \"ifd0\": {\"Make\": \"Apple\", \"Model\": \"iPhone 14 Pro\"}}, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-04-13T22:32:51.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T22:28:43.000Z\", \"filename_disk\": \"b28a3f28-f392-484c-9276-717a50375244.jpg\", \"filename_download\": \"IMG-0866.jpg\"}','{\"type\": \"image/jpeg\", \"folder\": null, \"storage\": \"local\", \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-04-13T22:32:50.837Z\", \"filename_download\": \"IMG-0866.jpg\"}',NULL),(91,100,'directus_files','b28a3f28-f392-484c-9276-717a50375244','{\"id\": \"b28a3f28-f392-484c-9276-717a50375244\", \"tags\": null, \"type\": \"image/jpeg\", \"embed\": null, \"title\": null, \"width\": 1348, \"folder\": null, \"height\": 1689, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 446688, \"location\": null, \"metadata\": {}, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-04-13T22:32:51.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T22:28:43.000Z\", \"filename_disk\": \"b28a3f28-f392-484c-9276-717a50375244.jpg\", \"filename_download\": \"IMG-0866.jpg\"}','{\"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-04-13T22:32:50.883Z\"}',NULL),(92,102,'directus_collections','categories','{\"collection\": \"categories\"}','{\"collection\": \"categories\"}',NULL),(93,103,'directus_collections','filters','{\"collection\": \"filters\"}','{\"collection\": \"filters\"}',NULL),(94,106,'filters','30','{\"id\": 30, \"name\": \"Dropkick\", \"category_id\": 2}','{\"id\": 30, \"name\": \"Dropkick\", \"category_id\": 2}',NULL),(95,108,'directus_fields','20','{\"field\": \"name\", \"special\": null, \"collection\": \"categories\"}','{\"field\": \"name\", \"special\": null, \"collection\": \"categories\"}',NULL),(96,109,'directus_fields','11','{\"id\": 11, \"note\": null, \"sort\": null, \"field\": \"filename\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter a filename to be rendered in react application in lowercase\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"filemappings\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"filename\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter a filename to be rendered in react application in lowercase\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"filemappings\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(97,110,'directus_folders','e53a7105-3bfa-4bcd-b491-88e63188e713','{\"name\": \"team_images\", \"parent\": null}','{\"name\": \"team_images\", \"parent\": null}',NULL),(98,111,'directus_folders','f86cf86e-a734-483f-9a3f-35cf4499e1f9','{\"name\": \"static_files\", \"parent\": null}','{\"name\": \"static_files\", \"parent\": null}',NULL),(99,112,'directus_fields','12','{\"id\": 12, \"note\": null, \"sort\": null, \"field\": \"fileID\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {\"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\"}, \"special\": [\"file\"], \"readonly\": false, \"required\": true, \"interface\": \"file\", \"collection\": \"filemappings\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"fileID\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {\"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\"}, \"special\": [\"file\"], \"readonly\": false, \"required\": true, \"interface\": \"file\", \"collection\": \"filemappings\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}',NULL),(100,113,'directus_files','b28a3f28-f392-484c-9276-717a50375244','{\"id\": \"b28a3f28-f392-484c-9276-717a50375244\", \"tags\": null, \"type\": \"image/jpeg\", \"embed\": null, \"title\": null, \"width\": 1348, \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"height\": 1689, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 446688, \"location\": null, \"metadata\": {}, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:09.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T22:28:43.000Z\", \"filename_disk\": \"b28a3f28-f392-484c-9276-717a50375244.jpg\", \"filename_download\": \"IMG-0866.jpg\"}','{\"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:09.414Z\"}',NULL),(101,114,'directus_files','b28a3f28-f392-484c-9276-717a50375244','{\"id\": \"b28a3f28-f392-484c-9276-717a50375244\", \"tags\": null, \"type\": \"image/jpeg\", \"embed\": null, \"title\": null, \"width\": 1348, \"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"height\": 1689, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 446688, \"location\": null, \"metadata\": {}, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:35.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T22:28:43.000Z\", \"filename_disk\": \"b28a3f28-f392-484c-9276-717a50375244.jpg\", \"filename_download\": \"IMG-0866.jpg\"}','{\"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:35.289Z\"}',NULL),(102,115,'directus_files','15682c71-7d6e-4c9a-8e88-4eced5c7a0fe','{\"id\": \"15682c71-7d6e-4c9a-8e88-4eced5c7a0fe\", \"tags\": null, \"type\": \"image/png\", \"embed\": null, \"title\": \"Yuxiao\", \"width\": 383, \"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"height\": 385, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 219212, \"location\": null, \"metadata\": {}, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:48.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T22:25:15.000Z\", \"filename_disk\": \"15682c71-7d6e-4c9a-8e88-4eced5c7a0fe.png\", \"filename_download\": \"yuxiao.png\"}','{\"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:37:47.927Z\"}',NULL),(103,116,'directus_files','a70a8d68-9b26-4acd-b589-943496a9017d','{\"id\": \"a70a8d68-9b26-4acd-b589-943496a9017d\", \"tags\": null, \"type\": \"application/octet-stream\", \"embed\": null, \"title\": \"Ogb\", \"width\": null, \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"height\": null, \"charset\": null, \"storage\": \"local\", \"duration\": null, \"filesize\": 5326, \"location\": null, \"metadata\": null, \"description\": null, \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:38:05.000Z\", \"uploaded_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"uploaded_on\": \"2023-04-13T20:18:32.000Z\", \"filename_disk\": \"a70a8d68-9b26-4acd-b589-943496a9017d.md\", \"filename_download\": \"OGB.md\"}','{\"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"modified_by\": \"6069af76-fe39-45bb-8710-bb5719e8e79b\", \"modified_on\": \"2023-06-02T17:38:05.255Z\"}',NULL),(104,117,'directus_files','735baca4-6dd4-4fdd-be19-e6b28d9f20a6','{\"type\": \"application/pdf\", \"title\": \"E  Itinerary\", \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"storage\": \"local\", \"filename_download\": \"E- Itinerary.pdf\"}','{\"type\": \"application/pdf\", \"title\": \"E  Itinerary\", \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"storage\": \"local\", \"filename_download\": \"E- Itinerary.pdf\"}',NULL),(105,118,'filemappings','3','{\"fileID\": \"735baca4-6dd4-4fdd-be19-e6b28d9f20a6\", \"filename\": \"updates\"}','{\"fileID\": \"735baca4-6dd4-4fdd-be19-e6b28d9f20a6\", \"filename\": \"updates\"}',NULL),(106,120,'directus_fields','21','{\"field\": \"category_id\", \"special\": null, \"collection\": \"filters\"}','{\"field\": \"category_id\", \"special\": null, \"collection\": \"filters\"}',NULL),(107,121,'directus_fields','22','{\"field\": \"id\", \"special\": null, \"collection\": \"filters\"}','{\"field\": \"id\", \"special\": null, \"collection\": \"filters\"}',NULL),(108,122,'directus_fields','23','{\"field\": \"name\", \"special\": null, \"collection\": \"filters\"}','{\"field\": \"name\", \"special\": null, \"collection\": \"filters\"}',NULL),(109,123,'directus_fields','23','{\"id\": 23, \"note\": null, \"sort\": null, \"field\": \"name\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"filters\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"name\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"filters\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(110,124,'directus_fields','14','{\"id\": 14, \"note\": null, \"sort\": null, \"field\": \"firstname\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the firstname of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"firstname\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the firstname of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(111,125,'directus_fields','15','{\"id\": 15, \"note\": null, \"sort\": null, \"field\": \"lastname\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the lastname of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"lastname\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the lastname of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(112,126,'directus_fields','16','{\"id\": 16, \"note\": null, \"sort\": null, \"field\": \"organization\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the organization of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"organization\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the organization of the team member\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(113,127,'directus_fields','17','{\"id\": 17, \"note\": null, \"sort\": null, \"field\": \"team_type\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"choices\": [{\"text\": \"core development\", \"value\": \"core development\"}, {\"text\": \"steering committee\", \"value\": \"steering committee\"}]}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"select-dropdown\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"team_type\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"choices\": [{\"text\": \"core development\", \"value\": \"core development\"}, {\"text\": \"steering committee\", \"value\": \"steering committee\"}]}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"select-dropdown\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(114,128,'directus_fields','18','{\"id\": 18, \"note\": null, \"sort\": null, \"field\": \"order\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the order in which the team member are shown on teams page\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"order\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"trim\": true, \"placeholder\": \"Enter the order in which the team member are shown on teams page\"}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(115,131,'directus_fields','19','{\"id\": 19, \"note\": null, \"sort\": null, \"field\": \"image\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {\"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\"}, \"special\": [\"file\"], \"readonly\": false, \"required\": true, \"interface\": \"file-image\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"image\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": \"image\", \"options\": {\"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\"}, \"special\": [\"file\"], \"readonly\": false, \"required\": true, \"interface\": \"file-image\", \"collection\": \"team\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": {\"circle\": true}, \"validation_message\": null}',NULL),(116,132,'directus_folders','c69b03a6-fcb6-4aba-96f8-6be3a0e82f0f','{\"name\": \"updates_folder\", \"parent\": null}','{\"name\": \"updates_folder\", \"parent\": null}',NULL),(117,133,'directus_fields','9','{\"id\": 9, \"note\": null, \"sort\": null, \"field\": \"update_description\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"folder\": \"c69b03a6-fcb6-4aba-96f8-6be3a0e82f0f\", \"toolbar\": [\"undo\", \"redo\", \"bold\", \"italic\", \"underline\", \"strikethrough\", \"subscript\", \"superscript\", \"fontselect\", \"fontsizeselect\", \"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\", \"alignleft\", \"aligncenter\", \"alignright\", \"alignjustify\", \"alignnone\", \"indent\", \"outdent\", \"numlist\", \"bullist\", \"forecolor\", \"backcolor\", \"removeformat\", \"cut\", \"copy\", \"paste\", \"remove\", \"selectall\", \"blockquote\", \"customLink\", \"unlink\", \"customImage\", \"customMedia\", \"table\", \"hr\", \"code\", \"fullscreen\", \"visualaid\", \"ltr rtl\"]}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input-rich-text-html\", \"collection\": \"updates\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"update_description\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": {\"folder\": \"c69b03a6-fcb6-4aba-96f8-6be3a0e82f0f\", \"toolbar\": [\"undo\", \"redo\", \"bold\", \"italic\", \"underline\", \"strikethrough\", \"subscript\", \"superscript\", \"fontselect\", \"fontsizeselect\", \"h1\", \"h2\", \"h3\", \"h4\", \"h5\", \"h6\", \"alignleft\", \"aligncenter\", \"alignright\", \"alignjustify\", \"alignnone\", \"indent\", \"outdent\", \"numlist\", \"bullist\", \"forecolor\", \"backcolor\", \"removeformat\", \"cut\", \"copy\", \"paste\", \"remove\", \"selectall\", \"blockquote\", \"customLink\", \"unlink\", \"customImage\", \"customMedia\", \"table\", \"hr\", \"code\", \"fullscreen\", \"visualaid\", \"ltr rtl\"]}, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": \"input-rich-text-html\", \"collection\": \"updates\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(118,134,'directus_fields','24','{\"field\": \"user_id\", \"special\": null, \"collection\": \"users\"}','{\"field\": \"user_id\", \"special\": null, \"collection\": \"users\"}',NULL),(119,135,'directus_fields','25','{\"field\": \"username\", \"special\": null, \"collection\": \"users\"}','{\"field\": \"username\", \"special\": null, \"collection\": \"users\"}',NULL),(120,136,'directus_fields','25','{\"id\": 25, \"note\": null, \"sort\": null, \"field\": \"username\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"username\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(121,137,'directus_fields','26','{\"field\": \"email\", \"special\": null, \"collection\": \"users\"}','{\"field\": \"email\", \"special\": null, \"collection\": \"users\"}',NULL),(122,138,'directus_fields','26','{\"id\": 26, \"note\": null, \"sort\": null, \"field\": \"email\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"email\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": false, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(123,139,'directus_fields','27','{\"field\": \"password_hash\", \"special\": null, \"collection\": \"users\"}','{\"field\": \"password_hash\", \"special\": null, \"collection\": \"users\"}',NULL),(124,140,'directus_fields','25','{\"id\": 25, \"note\": null, \"sort\": null, \"field\": \"username\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"username\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(125,141,'directus_fields','26','{\"id\": 26, \"note\": null, \"sort\": null, \"field\": \"email\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"email\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(126,142,'directus_fields','27','{\"id\": 27, \"note\": null, \"sort\": null, \"field\": \"password_hash\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}','{\"note\": null, \"sort\": null, \"field\": \"password_hash\", \"group\": null, \"width\": \"full\", \"hidden\": false, \"display\": null, \"options\": null, \"special\": null, \"readonly\": true, \"required\": true, \"interface\": null, \"collection\": \"users\", \"conditions\": null, \"validation\": null, \"translations\": null, \"display_options\": null, \"validation_message\": null}',NULL),(127,149,'directus_files','675c5f69-ae11-4951-babd-3c165b039571','{\"type\": \"image/jpeg\", \"title\": \"Lei Jiang\", \"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"storage\": \"local\", \"filename_download\": \"Lei Jiang.jpg\"}','{\"type\": \"image/jpeg\", \"title\": \"Lei Jiang\", \"folder\": \"e53a7105-3bfa-4bcd-b491-88e63188e713\", \"storage\": \"local\", \"filename_download\": \"Lei Jiang.jpg\"}',NULL),(128,150,'team','3','{\"image\": \"675c5f69-ae11-4951-babd-3c165b039571\", \"order\": \"1\", \"lastname\": \"Jiang\", \"firstname\": \"Lei\", \"team_type\": \"core development\", \"organization\": \"University of Missouri\"}','{\"image\": \"675c5f69-ae11-4951-babd-3c165b039571\", \"order\": \"1\", \"lastname\": \"Jiang\", \"firstname\": \"Lei\", \"team_type\": \"core development\", \"organization\": \"University of Missouri\"}',NULL),(129,151,'directus_files','fd681829-9fa9-416d-8fcc-c9cfec9d3020','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}','{\"type\": \"application/octet-stream\", \"title\": \"Ogb\", \"folder\": \"f86cf86e-a734-483f-9a3f-35cf4499e1f9\", \"storage\": \"local\", \"filename_download\": \"OGB.md\"}',NULL),(130,152,'filemappings','4','{\"fileID\": \"fd681829-9fa9-416d-8fcc-c9cfec9d3020\", \"filename\": \"getstarted\"}','{\"fileID\": \"fd681829-9fa9-416d-8fcc-c9cfec9d3020\", \"filename\": \"getstarted\"}',NULL);
/*!40000 ALTER TABLE `directus_revisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_roles`
--

DROP TABLE IF EXISTS `directus_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'supervised_user_circle',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_access` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `enforce_tfa` tinyint(1) NOT NULL DEFAULT '0',
  `admin_access` tinyint(1) NOT NULL DEFAULT '0',
  `app_access` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_roles`
--

LOCK TABLES `directus_roles` WRITE;
/*!40000 ALTER TABLE `directus_roles` DISABLE KEYS */;
INSERT INTO `directus_roles` VALUES ('22c12235-6b5d-4f05-94cb-3d2d98076c81','Administrator','verified','$t:admin_description',NULL,0,1,1);
/*!40000 ALTER TABLE `directus_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_sessions`
--

DROP TABLE IF EXISTS `directus_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_sessions` (
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires` timestamp NOT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `share` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`token`),
  KEY `directus_sessions_user_foreign` (`user`),
  KEY `directus_sessions_share_foreign` (`share`),
  CONSTRAINT `directus_sessions_share_foreign` FOREIGN KEY (`share`) REFERENCES `directus_shares` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_sessions_user_foreign` FOREIGN KEY (`user`) REFERENCES `directus_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_sessions`
--

LOCK TABLES `directus_sessions` WRITE;
/*!40000 ALTER TABLE `directus_sessions` DISABLE KEYS */;
INSERT INTO `directus_sessions` VALUES ('M06NAZqMul2NR5Wx4YGyKBNwcQxUAm1BrmB2eTUdstf66UIGAm1XoegF_Jlo3t_k','6069af76-fe39-45bb-8710-bb5719e8e79b','2023-09-07 22:35:28','162.219.62.172','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',NULL,'http://node-0.jiangl0-163710.biomizzou-pg0.clemson.cloudlab.us:8055');
/*!40000 ALTER TABLE `directus_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_settings`
--

DROP TABLE IF EXISTS `directus_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `project_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Directus',
  `project_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_logo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_foreground` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_background` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `auth_login_attempts` int unsigned DEFAULT '25',
  `auth_password_policy` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_asset_transform` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `storage_asset_presets` json DEFAULT NULL,
  `custom_css` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `storage_default_folder` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basemaps` json DEFAULT NULL,
  `mapbox_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_bar` json DEFAULT NULL,
  `project_descriptor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `translation_strings` json DEFAULT NULL,
  `default_language` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en-US',
  `custom_aspect_ratios` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_settings_project_logo_foreign` (`project_logo`),
  KEY `directus_settings_public_foreground_foreign` (`public_foreground`),
  KEY `directus_settings_public_background_foreign` (`public_background`),
  KEY `directus_settings_storage_default_folder_foreign` (`storage_default_folder`),
  CONSTRAINT `directus_settings_project_logo_foreign` FOREIGN KEY (`project_logo`) REFERENCES `directus_files` (`id`),
  CONSTRAINT `directus_settings_public_background_foreign` FOREIGN KEY (`public_background`) REFERENCES `directus_files` (`id`),
  CONSTRAINT `directus_settings_public_foreground_foreign` FOREIGN KEY (`public_foreground`) REFERENCES `directus_files` (`id`),
  CONSTRAINT `directus_settings_storage_default_folder_foreign` FOREIGN KEY (`storage_default_folder`) REFERENCES `directus_folders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_settings`
--

LOCK TABLES `directus_settings` WRITE;
/*!40000 ALTER TABLE `directus_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_shares`
--

DROP TABLE IF EXISTS `directus_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_shares` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_start` timestamp NULL DEFAULT NULL,
  `date_end` timestamp NULL DEFAULT NULL,
  `times_used` int DEFAULT '0',
  `max_uses` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `directus_shares_collection_foreign` (`collection`),
  KEY `directus_shares_role_foreign` (`role`),
  KEY `directus_shares_user_created_foreign` (`user_created`),
  CONSTRAINT `directus_shares_collection_foreign` FOREIGN KEY (`collection`) REFERENCES `directus_collections` (`collection`) ON DELETE CASCADE,
  CONSTRAINT `directus_shares_role_foreign` FOREIGN KEY (`role`) REFERENCES `directus_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `directus_shares_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_shares`
--

LOCK TABLES `directus_shares` WRITE;
/*!40000 ALTER TABLE `directus_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_users`
--

DROP TABLE IF EXISTS `directus_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tags` json DEFAULT NULL,
  `avatar` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `theme` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'auto',
  `tfa_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `role` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_access` timestamp NULL DEFAULT NULL,
  `last_page` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `external_identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth_data` json DEFAULT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `directus_users_external_identifier_unique` (`external_identifier`),
  UNIQUE KEY `directus_users_email_unique` (`email`),
  UNIQUE KEY `directus_users_token_unique` (`token`),
  KEY `directus_users_role_foreign` (`role`),
  CONSTRAINT `directus_users_role_foreign` FOREIGN KEY (`role`) REFERENCES `directus_roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_users`
--

LOCK TABLES `directus_users` WRITE;
/*!40000 ALTER TABLE `directus_users` DISABLE KEYS */;
INSERT INTO `directus_users` VALUES ('6069af76-fe39-45bb-8710-bb5719e8e79b','Admin','User','leijiang@missouri.edu','$argon2id$v=19$m=65536,t=3,p=4$gh6rMUzGZF88LIF/3U1ppA$KS+RMSv4KOqBb9atv9r/WnvEz5hJIc4dZkjupS6E/+A',NULL,NULL,NULL,NULL,NULL,NULL,'auto',NULL,'active','22c12235-6b5d-4f05-94cb-3d2d98076c81',NULL,'2023-08-31 22:35:28','/content/filemappings','default',NULL,NULL,1);
/*!40000 ALTER TABLE `directus_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `directus_webhooks`
--

DROP TABLE IF EXISTS `directus_webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `directus_webhooks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POST',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `data` tinyint(1) NOT NULL DEFAULT '1',
  `actions` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `collections` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `headers` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `directus_webhooks`
--

LOCK TABLES `directus_webhooks` WRITE;
/*!40000 ALTER TABLE `directus_webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `directus_webhooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `file_loc` varchar(100) NOT NULL,
  `dataset_id` int DEFAULT NULL,
  PRIMARY KEY (`file_id`),
  KEY `dataset_id_fk_idx` (`dataset_id`),
  CONSTRAINT `dataset_id_fk` FOREIGN KEY (`dataset_id`) REFERENCES `dataset` (`dataset_id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file`
--

LOCK TABLES `file` WRITE;
/*!40000 ALTER TABLE `file` DISABLE KEYS */;
/*!40000 ALTER TABLE `file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `filemappings`
--

DROP TABLE IF EXISTS `filemappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `filemappings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileID` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `filemappings_filename_unique` (`filename`),
  KEY `filemappings_fileid_foreign` (`fileID`),
  CONSTRAINT `filemappings_fileid_foreign` FOREIGN KEY (`fileID`) REFERENCES `directus_files` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `filemappings`
--

LOCK TABLES `filemappings` WRITE;
/*!40000 ALTER TABLE `filemappings` DISABLE KEYS */;
INSERT INTO `filemappings` VALUES (4,'getstarted','fd681829-9fa9-416d-8fcc-c9cfec9d3020');
/*!40000 ALTER TABLE `filemappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `filters`
--

DROP TABLE IF EXISTS `filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `filters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `filters_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `filters`
--

LOCK TABLES `filters` WRITE;
/*!40000 ALTER TABLE `filters` DISABLE KEYS */;
/* INSERT INTO `filters` VALUES (1,1,'Bioconductor'),(2,1,'Scanpy'),(3,1,'Seurat'),(4,1,'Dropkick'),(5,2,'MAGIC'),(6,2,'SAVER'),(7,2,'scGNN'),(8,3,'LogCPM'),(9,3,'LogCP10K'),(10,3,'sctransform'),(11,3,'DEseq2'),(12,3,'scran'),(13,3,'TMM'),(14,3,'RLE'),(15,3,'UpperQuartile'),(16,3,'TPM'),(17,3,'FPKM'),(18,3,'PEARSON_RESIDUALS'),(19,4,'Seurat'),(20,4,'Harmony'),(21,4,'Liger'),(22,4,'scVI'),(23,5,'CellTypist'),(24,5,'scANVI'),(25,5,'SingleR'),(26, 6, 'Convert'), (27, 7, 'UMAP'), (28, 7, 't-SNE'); */
INSERT INTO `filters` VALUES (1,1,'Bioconductor'),(2,1,'Scanpy'),(3,1,'Seurat'),(4,1,'Dropkick'),(5,2,'MAGIC'),(6,2,'SAVER'),(7,3,'LogCPM'),(8,3,'LogCP10K'),(9,3,'sctransform'),(10,3,'DEseq2'),(11,3,'scran'),(12,3,'TMM'),(13,3,'RLE'),(14,3,'UpperQuartile'),(15,3,'TPM'),(16,3,'FPKM'),(17,3,'PEARSON_RESIDUALS'),(18,4,'Seurat'),(19,4,'Harmony'),(20,4,'Liger'),(21,4,'scVI'),(22,5,'CellTypist'),(23,5,'scANVI'),(24,5,'SingleR'),(25, 6, 'Convert'), (26, 7, 'UMAP'), (27, 7, 't-SNE');

/*!40000 ALTER TABLE `filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `task_title` varchar(500) NOT NULL,
  `job_id` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `tool` varchar(255) DEFAULT NULL,
  `results_path` varchar(500) NOT NULL,
  `status` varchar(15) DEFAULT NULL,
  `created_datetime` bigint unsigned DEFAULT NULL,
  `finish_datetime` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`job_id`),
  KEY `user_id_fk_idx` (`user_id`),
  CONSTRAINT `user_id_fk_task` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `team_image_foreign` (`image`),
  CONSTRAINT `team_image_foreign` FOREIGN KEY (`image`) REFERENCES `directus_files` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES (3,'Lei','Jiang','University of Missouri','core development','1','675c5f69-ae11-4951-babd-3c165b039571');
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `updates`
--

DROP TABLE IF EXISTS `updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `updates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_created` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT NULL,
  `user_updated` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_published` date NOT NULL,
  `update_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `updates_user_created_foreign` (`user_created`),
  KEY `updates_user_updated_foreign` (`user_updated`),
  CONSTRAINT `updates_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
  CONSTRAINT `updates_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `updates`
--

LOCK TABLES `updates` WRITE;
/*!40000 ALTER TABLE `updates` DISABLE KEYS */;
INSERT INTO `updates` VALUES (3,'6069af76-fe39-45bb-8710-bb5719e8e79b','2023-04-13 04:02:47',NULL,NULL,'Package updated to package 1.3.4','2023-03-01','<ul>\n<li>oscb-vessel is included in the OGB. Thank you everyone for the contribution!.</li>\n<li>The ranking metric of the link prediction is improved(see <a href=\"github.com\" target=\"_blank\" rel=\"noopener\">PR</a>)</li>\n</ul>');
/*!40000 ALTER TABLE `updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `password_hash` varchar(300) DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-08-31 22:54:19
