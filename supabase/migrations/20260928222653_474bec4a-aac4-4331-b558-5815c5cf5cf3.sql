INSERT INTO departments (parent_id, name, emoji, sort_order)
VALUES ('f1ce04bd-9831-48a6-8ab1-60bb614bfff5', 'Ordnen & Sortieren', '🗂️', 30);

INSERT INTO catalog_translations (entity_type, entity_id, locale, name)
SELECT 'department', d.id, v.locale, v.name
FROM departments d
JOIN (VALUES
  ('de-AT','Ordnen & Sortieren'),
  ('de-CH','Ordnen & Sortieren'),
  ('en-US','Filing & Organization'),
  ('en-GB','Filing & Organising'),
  ('en-CA','Filing & Organization'),
  ('es-ES','Archivo y clasificación'),
  ('es-MX','Organización y archivo'),
  ('fr-FR','Classement & rangement'),
  ('fr-CA','Classement et rangement'),
  ('it-IT','Ordinare e archiviare'),
  ('it-CH','Ordinare e archiviare'),
  ('nl-NL','Sorteren & opbergen'),
  ('nl-BE','Ordenen & opbergen'),
  ('pt-PT','Arquivo e organização'),
  ('pt-BR','Arquivar e organizar')
) v(locale, name) ON true
WHERE d.name = 'Ordnen & Sortieren' AND d.parent_id = 'f1ce04bd-9831-48a6-8ab1-60bb614bfff5';

INSERT INTO products (department_id, name, default_quantity, default_unit, excluded_diets, sort_order)
SELECT d.id, v.name, 1, 'stueck', '{}', v.sort_order
FROM departments d
JOIN (VALUES
  ('Ordner',10),
  ('Ringbuch',20),
  ('Hängeregister',30),
  ('Hängemappen',40),
  ('Sichthüllen',50),
  ('Klarsichthüllen',60),
  ('Trennblätter / Register',70),
  ('Schnellhefter',80),
  ('Aktenmappen',90),
  ('Dokumentenmappen',100),
  ('Sammelmappen',110),
  ('Zeitschriftensammler',120),
  ('Archivboxen',130),
  ('Karteikästen',140),
  ('Karteikarten',150)
) v(name, sort_order) ON true
WHERE d.name = 'Ordnen & Sortieren' AND d.parent_id = 'f1ce04bd-9831-48a6-8ab1-60bb614bfff5';

INSERT INTO catalog_translations (entity_type, entity_id, locale, name)
SELECT 'product', p.id, v.locale, v.name
FROM products p
JOIN (VALUES
  ('Ordner','de-AT','Ordner'),('Ordner','de-CH','Ordner'),('Ordner','en-US','Binders'),('Ordner','en-GB','Lever Arch Files'),('Ordner','en-CA','Binders'),('Ordner','es-ES','Archivadores'),('Ordner','es-MX','Carpetas archivadoras'),('Ordner','fr-FR','Classeurs'),('Ordner','fr-CA','Classeurs'),('Ordner','it-IT','Raccoglitori'),('Ordner','it-CH','Raccoglitori'),('Ordner','nl-NL','Ordners'),('Ordner','nl-BE','Binders'),('Ordner','pt-PT','Arquivadores'),('Ordner','pt-BR','Fichários'),
  ('Ringbuch','de-AT','Ringbuch'),('Ringbuch','de-CH','Ringbuch'),('Ringbuch','en-US','Ring Binder'),('Ringbuch','en-GB','Ring Binder'),('Ringbuch','en-CA','Ring Binder'),('Ringbuch','es-ES','Carpeta de anillas'),('Ringbuch','es-MX','Carpeta de anillas'),('Ringbuch','fr-FR','Classeur à anneaux'),('Ringbuch','fr-CA','Classeur à anneaux'),('Ringbuch','it-IT','Raccoglitore ad anelli'),('Ringbuch','it-CH','Raccoglitore ad anelli'),('Ringbuch','nl-NL','Ringband'),('Ringbuch','nl-BE','Ringband'),('Ringbuch','pt-PT','Dossier de anilhas'),('Ringbuch','pt-BR','Fichário de argolas'),
  ('Hängeregister','de-AT','Hängeregister'),('Hängeregister','de-CH','Hängeregister'),('Hängeregister','en-US','Hanging File Folders'),('Hängeregister','en-GB','Suspension Files'),('Hängeregister','en-CA','Hanging File Folders'),('Hängeregister','es-ES','Carpetas colgantes'),('Hängeregister','es-MX','Carpetas colgantes'),('Hängeregister','fr-FR','Dossiers suspendus'),('Hängeregister','fr-CA','Dossiers suspendus'),('Hängeregister','it-IT','Dossier sospesi'),('Hängeregister','it-CH','Dossier sospesi'),('Hängeregister','nl-NL','Hangregisters'),('Hängeregister','nl-BE','Hangregisters'),('Hängeregister','pt-PT','Dossiers suspensos'),('Hängeregister','pt-BR','Pastas suspensas'),
  ('Hängemappen','de-AT','Hängemappen'),('Hängemappen','de-CH','Hängemappen'),('Hängemappen','en-US','Hanging File Pockets'),('Hängemappen','en-GB','Suspension Pockets'),('Hängemappen','en-CA','Hanging File Pockets'),('Hängemappen','es-ES','Fundas colgantes'),('Hängemappen','es-MX','Bolsas colgantes'),('Hängemappen','fr-FR','Pochettes suspendues'),('Hängemappen','fr-CA','Chemises suspendues'),('Hängemappen','it-IT','Cartelline sospese'),('Hängemappen','it-CH','Cartelline sospese'),('Hängemappen','nl-NL','Hangmappen'),('Hängemappen','nl-BE','Hangmappen'),('Hängemappen','pt-PT','Carpetes suspensos'),('Hängemappen','pt-BR','Pastas pendentes'),
  ('Sichthüllen','de-AT','Sichthüllen'),('Sichthüllen','de-CH','Sichthüllen'),('Sichthüllen','en-US','Plastic Wallets'),('Sichthüllen','en-GB','Plastic Wallets'),('Sichthüllen','en-CA','Plastic Wallets'),('Sichthüllen','es-ES','Dossiers'),('Sichthüllen','es-MX','Folders plásticos'),('Sichthüllen','fr-FR','Pochettes transparentes'),('Sichthüllen','fr-CA','Pochettes transparentes'),('Sichthüllen','it-IT','Buste trasparenti'),('Sichthüllen','it-CH','Buste trasparenti'),('Sichthüllen','nl-NL','Vulshaften'),('Sichthüllen','nl-BE','Doorzichtige hoezen'),('Sichthüllen','pt-PT','Bolsas de plástico'),('Sichthüllen','pt-BR','Envelopas plásticas'),
  ('Klarsichthüllen','de-AT','Klarsichthüllen'),('Klarsichthüllen','de-CH','Klarsichthüllen'),('Klarsichthüllen','en-US','Sheet Protectors'),('Klarsichthüllen','en-GB','Punched Pockets'),('Klarsichthüllen','en-CA','Sheet Protectors'),('Klarsichthüllen','es-ES','Fundas plásticas'),('Klarsichthüllen','es-MX','Fundas plásticas'),('Klarsichthüllen','fr-FR','Pochettes plastique'),('Klarsichthüllen','fr-CA','Protège-feuillets'),('Klarsichthüllen','it-IT','Fondelli trasparenti'),('Klarsichthüllen','it-CH','Fondelli trasparenti'),('Klarsichthüllen','nl-NL','Insteekhoezen'),('Klarsichthüllen','nl-BE','Insteekhoezen'),('Klarsichthüllen','pt-PT','Fundas plásticas'),('Klarsichthüllen','pt-BR','Envelopas para folhas'),
  ('Trennblätter / Register','de-AT','Trennblätter / Register'),('Trennblätter / Register','de-CH','Trennblätter / Register'),('Trennblätter / Register','en-US','Dividers / Index Tabs'),('Trennblätter / Register','en-GB','Dividers / Index Tabs'),('Trennblätter / Register','en-CA','Dividers / Index Tabs'),('Trennblätter / Register','es-ES','Separadores / Índices'),('Trennblätter / Register','es-MX','Separadores / Índices'),('Trennblätter / Register','fr-FR','Intercalaires / Index'),('Trennblätter / Register','fr-CA','Intercalaires / Index'),('Trennblätter / Register','it-IT','Separatori / Indici'),('Trennblätter / Register','it-CH','Separatori / Indici'),('Trennblätter / Register','nl-NL','Scheidingsbladen / Tabbladen'),('Trennblätter / Register','nl-BE','Scheidingsbladen / Tabbladen'),('Trennblätter / Register','pt-PT','Separadores / Índices'),('Trennblätter / Register','pt-BR','Separadores / Índices'),
  ('Schnellhefter','de-AT','Schnellhefter'),('Schnellhefter','de-CH','Schnellhefter'),('Schnellhefter','en-US','Clip Folders'),('Schnellhefter','en-GB','Clip Folders'),('Schnellhefter','en-CA','Clip Folders'),('Schnellhefter','es-ES','Carpetas de clip'),('Schnellhefter','es-MX','Carpetas con clip'),('Schnellhefter','fr-FR','Chemises à clip'),('Schnellhefter','fr-CA','Chemises à clip'),('Schnellhefter','it-IT','Cartelline con clip'),('Schnellhefter','it-CH','Cartelline con clip'),('Schnellhefter','nl-NL','Clipmappen'),('Schnellhefter','nl-BE','Klemmappen'),('Schnellhefter','pt-PT','Carpetes com clipe'),('Schnellhefter','pt-BR','Pastas com clipe'),
  ('Aktenmappen','de-AT','Aktenmappen'),('Aktenmappen','de-CH','Aktenmappen'),('Aktenmappen','en-US','File Folders'),('Aktenmappen','en-GB','Files'),('Aktenmappen','en-CA','File Folders'),('Aktenmappen','es-ES','Carpetas de archivo'),('Aktenmappen','es-MX','Carpetas de expedientes'),('Aktenmappen','fr-FR','Chemises cartonnées'),('Aktenmappen','fr-CA','Chemises cartonnées'),('Aktenmappen','it-IT','Cartelle di archivio'),('Aktenmappen','it-CH','Cartelle di archivio'),('Aktenmappen','nl-NL','Dossiermappen'),('Aktenmappen','nl-BE','Dossiermappen'),('Aktenmappen','pt-PT','Carpetes de arquivo'),('Aktenmappen','pt-BR','Pastas de arquivo'),
  ('Dokumentenmappen','de-AT','Dokumentenmappen'),('Dokumentenmappen','de-CH','Dokumentenmappen'),('Dokumentenmappen','en-US','Document Folders'),('Dokumentenmappen','en-GB','Document Folders'),('Dokumentenmappen','en-CA','Document Folders'),('Dokumentenmappen','es-ES','Carpetas para documentos'),('Dokumentenmappen','es-MX','Carpetas para documentos'),('Dokumentenmappen','fr-FR','Chemises à documents'),('Dokumentenmappen','fr-CA','Chemises à documents'),('Dokumentenmappen','it-IT','Cartelle per documenti'),('Dokumentenmappen','it-CH','Cartelle per documenti'),('Dokumentenmappen','nl-NL','Documentmappen'),('Dokumentenmappen','nl-BE','Documentmappen'),('Dokumentenmappen','pt-PT','Carpetes para documentos'),('Dokumentenmappen','pt-BR','Porta-documentos'),
  ('Sammelmappen','de-AT','Sammelmappen'),('Sammelmappen','de-CH','Sammelmappen'),('Sammelmappen','en-US','Presentation Binders'),('Sammelmappen','en-GB','Presentation Binders'),('Sammelmappen','en-CA','Presentation Binders'),('Sammelmappen','es-ES','Carpetas de colección'),('Sammelmappen','es-MX','Álbumes de colección'),('Sammelmappen','fr-FR','Classeurs de collection'),('Sammelmappen','fr-CA','Classeurs de collection'),('Sammelmappen','it-IT','Raccoglitori da collezione'),('Sammelmappen','it-CH','Raccoglitori da collezione'),('Sammelmappen','nl-NL','Verzamelordners'),('Sammelmappen','nl-BE','Verzamelbinders'),('Sammelmappen','pt-PT','Dossiers de coleção'),('Sammelmappen','pt-BR','Fichários de coleção'),
  ('Zeitschriftensammler','de-AT','Zeitschriftensammler'),('Zeitschriftensammler','de-CH','Zeitschriftensammler'),('Zeitschriftensammler','en-US','Magazine Files'),('Zeitschriftensammler','en-GB','Magazine Files'),('Zeitschriftensammler','en-CA','Magazine Files'),('Zeitschriftensammler','es-ES','Expositores de revistas'),('Zeitschriftensammler','es-MX','Organizadores de revistas'),('Zeitschriftensammler','fr-FR','Range-revues'),('Zeitschriftensammler','fr-CA','Range-revues'),('Zeitschriftensammler','it-IT','Espositori per riviste'),('Zeitschriftensammler','it-CH','Espositori per riviste'),('Zeitschriftensammler','nl-NL','Tijdschriftbakken'),('Zeitschriftensammler','nl-BE','Tijdschriftenhouders'),('Zeitschriftensammler','pt-PT','Expositores de revistas'),('Zeitschriftensammler','pt-BR','Porta-revistas'),
  ('Archivboxen','de-AT','Archivboxen'),('Archivboxen','de-CH','Archivboxen'),('Archivboxen','en-US','Archive Boxes'),('Archivboxen','en-GB','Archive Boxes'),('Archivboxen','en-CA','Archive Boxes'),('Archivboxen','es-ES','Cajas de archivo'),('Archivboxen','es-MX','Cajas de archivo'),('Archivboxen','fr-FR','Boîtes d''archives'),('Archivboxen','fr-CA','Boîtes d''archives'),('Archivboxen','it-IT','Scatole archivio'),('Archivboxen','it-CH','Scatole archivio'),('Archivboxen','nl-NL','Archiefdozen'),('Archivboxen','nl-BE','Archiefdozen'),('Archivboxen','pt-PT','Caixas de arquivo'),('Archivboxen','pt-BR','Caixas de arquivo'),
  ('Karteikästen','de-AT','Karteikästen'),('Karteikästen','de-CH','Karteikästen'),('Karteikästen','en-US','Card File Boxes'),('Karteikästen','en-GB','Card Index Boxes'),('Karteikästen','en-CA','Card File Boxes'),('Karteikästen','es-ES','Ficheros'),('Karteikästen','es-MX','Cajas para fichas'),('Karteikästen','fr-FR','Fichiers à cartes'),('Karteikästen','fr-CA','Fichiers à cartes'),('Karteikästen','it-IT','Scatole porta-schede'),('Karteikästen','it-CH','Scatole porta-schede'),('Karteikästen','nl-NL','Kaartenbakken'),('Karteikästen','nl-BE','Kaartenbakken'),('Karteikästen','pt-PT','Ficheiros de cartões'),('Karteikästen','pt-BR','Caixas para fichas'),
  ('Karteikarten','de-AT','Karteikarten'),('Karteikarten','de-CH','Karteikarten'),('Karteikarten','en-US','Index Cards'),('Karteikarten','en-GB','Record Cards'),('Karteikarten','en-CA','Index Cards'),('Karteikarten','es-ES','Fichas'),('Karteikarten','es-MX','Tarjetas de índice'),('Karteikarten','fr-FR','Fiches bristol'),('Karteikarten','fr-CA','Fiches cartonnées'),('Karteikarten','it-IT','Schede'),('Karteikarten','it-CH','Schede'),('Karteikarten','nl-NL','Systeemkaarten'),('Karteikarten','nl-BE','Fiches'),('Karteikarten','pt-PT','Fichas'),('Karteikarten','pt-BR','Fichas de índice')
) v(pname, locale, name) ON true
WHERE p.department_id = (SELECT id FROM departments WHERE name = 'Ordnen & Sortieren' AND parent_id = 'f1ce04bd-9831-48a6-8ab1-60bb614bfff5')
  AND p.name = v.pname;